import atexit
import glob
import json
import os
import re
import signal
import subprocess
import shutil
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pdf_tools import extract_pdf_text, extract_images
from llm import make_manim_script, repair_manim_script
from utils import write_status
from watermark import add_watermark_to_video
import redis


MAX_RENDER_ATTEMPTS = int(os.getenv("MANIM_MAX_RENDER_ATTEMPTS", "3"))
MAX_ERROR_CHARS = 6000

TERMINATE_GRACE_SECONDS = 5

RENDER_RESOLUTION = "1280,720"
RENDER_FPS = "30"
RENDER_QUALITY_DIR = "720p30"

# Tracks how many times the LLM has been asked to repair a Manim scene across all jobs
TOTAL_MANIM_REPAIR_ATTEMPTS = 0
# Tracks how many times the LLM was not able to produce a usable repair diff across all jobs
TOTAL_MANIM_REPAIR_FAILURES = 0

_active_renders = {}
_active_renders_lock = threading.Lock()
_error_log_lock = threading.Lock()
_repair_stats_lock = threading.Lock()



def _count_repair_attempt():
    global TOTAL_MANIM_REPAIR_ATTEMPTS
    with _repair_stats_lock:
        TOTAL_MANIM_REPAIR_ATTEMPTS += 1

def _count_repair_failure():
    global TOTAL_MANIM_REPAIR_FAILURES
    with _repair_stats_lock:
        TOTAL_MANIM_REPAIR_FAILURES += 1

def concat_videos_ffmpeg(video_dir: str, output_path: str):
    video_files = sorted(
        f for f in os.listdir(video_dir) if f.endswith(".mp4")
    )

    list_file = os.path.join(video_dir, "videos.txt")
    with open(list_file, "w", encoding="utf-8") as f:
        for video in video_files:
            f.write(f"file '{video}'\n")

    subprocess.run(
        [
            "ffmpeg",
            "-f", "concat",
            "-safe", "0",
            "-i", list_file,
            "-c", "copy",
            output_path
        ],
        check=True
    )

def add_audio_to_video(video_path, audio_path, output_path):
    """Add audio track to video file."""
    print(f"Running ffmpeg to add audio...")
    print(f"  Input video: {video_path}")
    print(f"  Input audio: {audio_path}")
    print(f"  Output: {output_path}")

    result = subprocess.run(
        [
            "ffmpeg",
            "-y",  # Overwrite output file if exists
            "-i", video_path,
            "-i", audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            output_path,
        ],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"ERROR: ffmpeg failed with return code {result.returncode}")
        print(f"STDERR: {result.stderr}")
        raise subprocess.CalledProcessError(result.returncode, result.args, result.stdout, result.stderr)
    else:
        print(f"  ffmpeg completed successfully")

def process_video_audio(video_file: str, videos_dir: str, job_dir: str):
    video_path = os.path.join(videos_dir, video_file)
    base_name = os.path.splitext(video_file)[0]

    page_match = re.search(r"(\d+)", base_name)
    if not page_match:
        print(f"  WARNING: Cannot derive a page number from {video_file}")
        return video_file, False

    page_number = int(page_match.group(1))
    audio_path = os.path.join(job_dir, f"page_{page_number}_narration.mp3")

    print(f"Processing: {video_file}")
    print(f"  Video path: {video_path}")
    print(f"  Audio path: {audio_path}")
    print(f"  Audio exists: {os.path.exists(audio_path)}")

    if not os.path.exists(audio_path):
        print(f"  WARNING: Audio file not found: {audio_path}")
        return video_file, False

    output_video_path = os.path.join(videos_dir, f"{base_name}_with_audio.mp4")
    print(f"  Attaching audio to create: {output_video_path}")
    add_audio_to_video(video_path, audio_path, output_video_path)
    os.replace(output_video_path, video_path)
    print(f"  Successfully attached audio to {video_file}")
    return video_file, True

def load_scene_manifest(job_dir: str):
    """Read the per-page scene manifest written by make_manim_script()."""
    manifest_path = os.path.join(job_dir, "scenes", "scenes.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)

def _register_render(process):
    with _active_renders_lock:
        _active_renders[process.pid] = process

def _unregister_render(process):
    with _active_renders_lock:
        _active_renders.pop(process.pid, None)

def terminate_process_tree(process, grace_seconds: int = TERMINATE_GRACE_SECONDS):
    """
    Stop a render child and everything it spawned.

    Manim starts ffmpeg subprocesses of its own, so signalling only the manim pid
    can leave those behind holding the job directory open.
    """
    if process.poll() is not None:
        return

    try:
        if os.name == "nt":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(process.pid)],
                capture_output=True,
            )
        else:
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
    except (OSError, ValueError, subprocess.SubprocessError) as exc:
        print(f"Could not signal render process {process.pid}: {exc}")

    try:
        process.wait(timeout=grace_seconds)
    except subprocess.TimeoutExpired:
        print(f"Render process {process.pid} ignored the stop signal; killing it.")
        try:
            if os.name == "nt":
                process.kill()
            else:
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)
        except (OSError, ValueError):
            pass

def shutdown_active_renders(reason: str = ""):
    """
    Kill every Manim child still running. Called when a job ends - on success and
    on failure - so no render outlives the job that started it.
    """
    with _active_renders_lock:
        processes = list(_active_renders.values())
        _active_renders.clear()

    alive = [process for process in processes if process.poll() is None]
    if not alive:
        return

    suffix = f" ({reason})" if reason else ""
    print(f"Cleaning up {len(alive)} running Manim process(es){suffix}...")
    for process in alive:
        terminate_process_tree(process)

atexit.register(shutdown_active_renders, "process exit")

def summarize_manim_error(stdout: str, stderr: str) -> str:
    """
    Condense the Manim CLI output into something small enough to hand back to the
    LLM. The tail of the output is kept because that is where the traceback and
    the actual exception live.
    """
    parts = []
    for label, stream in (("STDERR", stderr), ("STDOUT", stdout)):
        stream = (stream or "").strip()
        if not stream:
            continue
        if len(stream) > MAX_ERROR_CHARS:
            stream = "...(truncated)...\n" + stream[-MAX_ERROR_CHARS:]
        parts.append(f"{label}:\n{stream}")

    return "\n\n".join(parts) if parts else "Manim produced no output."

def record_render_error(job_dir: str, scene: dict, attempt: int, error_text: str, repaired: bool = False):
    """
    Append a render failure to <job_dir>/render_errors.json.

    This is the record the repair step feeds back to the LLM, and what is left
    behind for inspection when a scene could not be fixed.
    """
    entry = {
        "page": scene.get("page"),
        "scene_name": scene.get("scene_name"),
        "script_path": scene.get("script_path"),
        "attempt": attempt,
        "error": error_text,
        "repair_applied": repaired,
    }

    errors_path = os.path.join(job_dir, "render_errors.json")
    with _error_log_lock:
        errors = []
        if os.path.exists(errors_path):
            try:
                with open(errors_path, "r", encoding="utf-8") as f:
                    errors = json.load(f)
            except (json.JSONDecodeError, OSError):
                errors = []

        errors.append(entry)
        with open(errors_path, "w", encoding="utf-8") as f:
            json.dump(errors, f, indent=2)

    return entry

def find_rendered_video(scene_media_dir: str, script_path: str, scene_name: str):
    """Locate the mp4 Manim produced, whatever media sub-directory it landed in."""
    script_stem = os.path.splitext(os.path.basename(script_path))[0]
    expected = os.path.join(
        scene_media_dir, "videos", script_stem, RENDER_QUALITY_DIR, f"{scene_name}.mp4"
    )
    if os.path.exists(expected):
        return expected

    patterns = [
        os.path.join(scene_media_dir, "videos", "**", f"{scene_name}.mp4"),
        os.path.join(scene_media_dir, "videos", "**", "*.mp4"),
    ]
    for pattern in patterns:
        matches = [
            match for match in glob.glob(pattern, recursive=True)
            if "partial_movie_files" not in match.replace("\\", "/")
        ]
        if matches:
            return sorted(matches)[0]

    return None

def run_manim_render(scene_name: str, script_path: str, job_dir: str):
    """
    Render one scene in its own manim process.

    Returns (video_path, error_text). Exactly one of the two is None
    """
    scene_media_dir = os.path.join(job_dir, "scene_renders", scene_name)

    shutil.rmtree(scene_media_dir, ignore_errors=True)
    os.makedirs(scene_media_dir, exist_ok=True)

    command = [
        "manim",
        "--resolution", RENDER_RESOLUTION,   # 720p
        "--fps", RENDER_FPS,                 # 30 FPS
        script_path,
        scene_name,
        "--output_file", scene_name,
        "--media_dir", scene_media_dir,
    ]

    popen_kwargs = {}
    if os.name != "nt":
        popen_kwargs["start_new_session"] = True

    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            **popen_kwargs,
        )
    except OSError as exc:
        return None, f"Could not start Manim for {scene_name}: {exc}"

    _register_render(process)
    try:
        stdout, stderr = process.communicate()
    except BaseException:
        terminate_process_tree(process)
        raise
    finally:
        _unregister_render(process)

    if process.returncode != 0:
        return None, (
            f"Manim exited with code {process.returncode} while rendering {scene_name}.\n"
            f"Command: {' '.join(command)}\n"
            f"{summarize_manim_error(stdout, stderr)}"
        )

    video_path = find_rendered_video(scene_media_dir, script_path, scene_name)
    if not video_path:
        return None, (
            f"Manim reported success for {scene_name} but no video file was produced.\n"
            f"{summarize_manim_error(stdout, stderr)}"
        )

    return video_path, None

def render_scene_with_repair(scene: dict, job_dir: str, max_attempts: int = MAX_RENDER_ATTEMPTS):
    """
    Render a single page's Manim script, and on failure feed the exact error plus
    that script back to the LLM, apply the diff it returns and retry.

    Always returns a result dict - it never raises - so one unfixable page does
    not abort the rest of the job.
    """
    scene_name = scene["scene_name"]
    script_path = scene["script_path"]
    page_number = scene["page"]

    last_error = None

    for attempt in range(1, max_attempts + 1):
        print(f"Rendering {scene_name} (page {page_number}), attempt {attempt}/{max_attempts}")
        video_path, error_text = run_manim_render(scene_name, script_path, job_dir)

        if video_path:
            target_videos_dir = os.path.join(job_dir, "videos", "generated_manim", RENDER_QUALITY_DIR)
            os.makedirs(target_videos_dir, exist_ok=True)
            # Zero padded so the plain sort used by the concat step keeps page order.
            collected_path = os.path.join(target_videos_dir, f"page_{page_number:04d}.mp4")
            shutil.copy2(video_path, collected_path)
            print(f"Rendered {scene_name} -> {collected_path}")
            return {
                "page": page_number,
                "scene_name": scene_name,
                "ok": True,
                "attempts": attempt,
                "video": collected_path,
                "error": None,
            }

        last_error = error_text
        print(f"Render failed for {scene_name} on attempt {attempt}:\n{error_text}")

        is_last_attempt = attempt == max_attempts
        repaired = False

        if not is_last_attempt:
            # Hand the LLM only the failing scene and its error - then patch the script in place with the diff it returns
            print(f"Asking the LLM for a fix diff for {scene_name}...")
            _count_repair_attempt()
            try:
                repaired = repair_manim_script(script_path, scene_name, error_text, attempt)
            except Exception as exc:
                print(f"Repair step raised for {scene_name}: {exc}")
                repaired = False

            if not repaired:
                _count_repair_failure()

        record_render_error(job_dir, scene, attempt, error_text, repaired)

        if not is_last_attempt and not repaired:
            print(f"No usable fix produced for {scene_name}; giving up on this page.")
            break

    return {
        "page": page_number,
        "scene_name": scene_name,
        "ok": False,
        "attempts": attempt,
        "video": None,
        "error": last_error,
    }

def render_scenes(scenes: list, job_dir: str, job_id: str = None, mode: str = "cli", r: redis.Redis = None):
    """Render every page scene in its own process, in parallel, tolerating failures."""
    if not scenes:
        raise ValueError("No Manim scenes were generated for this job.")

    worker_cap = 4
    render_workers = min(max(1, worker_cap), max(1, os.cpu_count() or 1), len(scenes))

    results = []
    completed = 0
    progress_lock = threading.Lock()

    try:
        with ThreadPoolExecutor(max_workers=render_workers) as executor:
            futures = {
                executor.submit(render_scene_with_repair, scene, job_dir): scene
                for scene in scenes
            }
            for future in as_completed(futures):
                scene = futures[future]
                try:
                    result = future.result()
                except Exception as exc:
                    error_text = f"Unexpected failure while rendering {scene['scene_name']}: {exc}"
                    print(error_text)
                    record_render_error(job_dir, scene, 0, error_text)
                    result = {
                        "page": scene["page"],
                        "scene_name": scene["scene_name"],
                        "ok": False,
                        "attempts": 0,
                        "video": None,
                        "error": error_text,
                    }

                results.append(result)

                if job_id:
                    with progress_lock:
                        completed += 1
                        progress = 0.55 + 0.30 * (completed / len(scenes))
                        write_status(job_id, "rendering_video", progress, mode, r)
    finally:
        # kill any Manim processes that are still running, so they don't outlive the job that spawned them
        shutdown_active_renders("render stage finished")

    results.sort(key=lambda item: item["page"])
    return results

def process_job(job_id: str, mode: str, r: redis.Redis = None):
    try:
        return _process_job(job_id, mode, r)
    finally:
        # kill any Manim processes that are still running, so they don't outlive the job that spawned them
        shutdown_active_renders(f"job {job_id} finished")

def _process_job(job_id: str, mode: str, r: redis.Redis = None):
    job_dir = f"tmp/{job_id}"
    pdf_path = f"{job_dir}/input.pdf"
    diagrams_folder = f"{job_dir}/diagrams"
    os.makedirs(diagrams_folder, exist_ok=True)

    # Extract text
    write_status(job_id, "extracting_text", 0.1, mode, r)
    json_extract = extract_pdf_text(pdf_path)
    with open(f"{job_dir}/extracted_text.json", "w") as f:
        json.dump(json_extract, f)

    # Extract diagrams
    write_status(job_id, "extracting_diagrams", 0.25, mode, r)
    diagrams = extract_images(pdf_path, diagrams_folder)
    with open(f"{job_dir}/diagrams_list.txt", "w") as f:
        f.write("\n".join(diagrams))

    # Generate Manim code - one standalone script per page, written to
    # <job_dir>/scenes/manim_scene_<n>.py
    write_status(job_id, "generating_manim_code", 0.50, mode, r)
    print(f"Generating Manim code...")
    scenes = make_manim_script(job_id, diagrams)
    print(f"Generated {len(scenes)} scene scripts.")

    # Render videos via Manim - one subprocess per scene with isoalted faliures and retry mechanism
    write_status(job_id, "rendering_video", 0.55, mode, r)

    pre_watermark_output_path = f"{job_dir}/pre_watermark_final.mp4"
    output_path = f"{job_dir}/final.mp4"

    results = render_scenes(scenes, job_dir, job_id, mode, r)

    rendered = [result for result in results if result["ok"]]
    failed = [result for result in results if not result["ok"]]

    if failed:
        print(
            f"{len(failed)} of {len(results)} scenes could not be rendered: "
            f"{[result['scene_name'] for result in failed]}. "
            f"Details in {job_dir}/render_errors.json"
        )

    if not rendered:
        raise RuntimeError(
            f"Every scene failed to render for job {job_id}. "
            f"See {job_dir}/render_errors.json for the recorded Manim errors."
        )

    videos_dir = f"{job_dir}/videos/generated_manim/{RENDER_QUALITY_DIR}"

    # Add audio to each video segment
    print(f"Looking for videos in: {videos_dir}")
    video_files_list = [f for f in os.listdir(videos_dir) if f.endswith(".mp4")]
    print(f"Found video files: {video_files_list}")

    max_workers = min(4, max(1, os.cpu_count() or 1))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(process_video_audio, video_file, videos_dir, job_dir)
            for video_file in video_files_list
        ]
        for future in as_completed(futures):
            future.result()

    write_status(job_id, "finalizing_video", 0.90, mode, r)
    concat_videos_ffmpeg(videos_dir, pre_watermark_output_path)
    add_watermark_to_video(pre_watermark_output_path, output_path)
    
    print(f"{TOTAL_MANIM_REPAIR_ATTEMPTS} total LLM repair attempts were made across all jobs. Out of those, {TOTAL_MANIM_REPAIR_FAILURES} attempts failed to produce a usable repair diff.")

    return output_path
