import os

from render_pipeline import (
    add_watermark_to_video,
    concat_videos_ffmpeg,
    load_scene_manifest,
    process_job,
    process_video_audio,
    render_scenes,
    RENDER_QUALITY_DIR,
)
from concurrent.futures import ThreadPoolExecutor, as_completed


def process_job_test(job_id: str):
    """Full pipeline run with status updates printed to stdout."""
    return process_job(job_id, mode="cli")


def rerender_job_test(job_id: str):
    """
    Re-render an already generated job from <job_dir>/scenes/scenes.json.

    Handy for iterating on the render + LLM repair loop without paying for
    narration/code generation again.
    """
    job_dir = f"tmp/{job_id}"
    scenes = load_scene_manifest(job_dir)
    print(f"Re-rendering {len(scenes)} scenes for job {job_id}")

    results = render_scenes(scenes, job_dir)

    for result in results:
        state = "ok" if result["ok"] else "FAILED"
        print(f"  {result['scene_name']}: {state} after {result['attempts']} attempt(s)")

    if not any(result["ok"] for result in results):
        raise RuntimeError(
            f"Every scene failed to render. See {job_dir}/render_errors.json"
        )

    videos_dir = f"{job_dir}/videos/generated_manim/{RENDER_QUALITY_DIR}"
    video_files_list = [f for f in os.listdir(videos_dir) if f.endswith(".mp4")]

    max_workers = min(4, max(1, os.cpu_count() or 1))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(process_video_audio, video_file, videos_dir, job_dir)
            for video_file in video_files_list
        ]
        for future in as_completed(futures):
            future.result()

    pre_watermark_output_path = f"{job_dir}/pre_watermark_final.mp4"
    output_path = f"{job_dir}/final.mp4"
    concat_videos_ffmpeg(videos_dir, pre_watermark_output_path)
    add_watermark_to_video(pre_watermark_output_path, output_path)

    return output_path
