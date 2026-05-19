import json
import os
import re
import subprocess
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from pdf_tools import extract_pdf_text, extract_images
from llm import make_manim_script
from codeformattor import sanitize_vgroup_with_images, rewrite_invalid_transforms
# from utils import write_status
import redis
from watermark import add_watermark_to_video

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
    audio_path = os.path.join(job_dir, f"page_{base_name.removeprefix('Scene')}_narration.mp3")

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

def get_manim_scene_names(script_path: str):
    with open(script_path, "r", encoding="utf-8") as f:
        code = f.read()

    # Capture classes that inherit from Scene-like Manim base classes.
    pattern = re.compile(r"^class\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*Scene[^)]*)\)\s*:", re.MULTILINE)
    return [match.group(1) for match in pattern.finditer(code)]

def render_single_scene(scene_name: str, script_path: str, job_dir: str):
    scene_media_dir = os.path.join(job_dir, "scene_renders", scene_name)
    os.makedirs(scene_media_dir, exist_ok=True)

    command = [
        "manim",
        "--resolution", "1280,720",   # 720p
        "--fps", "30",                # 30 FPS
        script_path,
        scene_name,
        "--output_file", scene_name,
        "--media_dir", scene_media_dir,
    ]

    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"Manim render failed for {scene_name}.\n"
            f"Command: {' '.join(command)}\n"
            f"STDOUT:\n{result.stdout}\n"
            f"STDERR:\n{result.stderr}"
        )

    scene_video_path = os.path.join(
        scene_media_dir,
        "videos",
        "generated_manim",
        "720p30",
        f"{scene_name}.mp4",
    )
    if not os.path.exists(scene_video_path):
        raise FileNotFoundError(f"Expected rendered video not found: {scene_video_path}")

    target_videos_dir = os.path.join(job_dir, "videos", "generated_manim", "720p30")
    os.makedirs(target_videos_dir, exist_ok=True)
    shutil.copy2(scene_video_path, os.path.join(target_videos_dir, f"{scene_name}.mp4"))
    return scene_name

def process_job_test(job_id: str):
    job_dir = f"tmp/{job_id}"
    pdf_path = f"{job_dir}/input.pdf"
    diagrams_folder = f"{job_dir}/diagrams"
    os.makedirs(diagrams_folder, exist_ok=True)

    # Extract text
    # write_status(job_dir, "extracting_text", 0.1)
    json_extract = extract_pdf_text(pdf_path)
    with open(f"{job_dir}/extracted_text.json", "w") as f:
        json.dump(json_extract, f)

    # Extract diagrams
    # write_status(job_dir, "extracting_diagrams", 0.25)
    diagrams = extract_images(pdf_path, diagrams_folder)
    with open(f"{job_dir}/diagrams_list.txt", "w") as f:
        f.write("\n".join(diagrams))

    # Generate Manim code
    # write_status(job_dir, "generating_manim_code", 0.50)
    print(f"Generating Manim code...")
    manim_code = make_manim_script(job_id, diagrams)
    
    # Store the raw Manim code before sanitization for debugging
    with open(f"{job_dir}/raw_manim_code.py", "w", encoding="utf-8") as f:
        f.write(manim_code)

    manim_code = sanitize_vgroup_with_images(manim_code)
    manim_code = rewrite_invalid_transforms(manim_code)
    # with open(f"sanitized_manim_code.py", "w", encoding="utf-8") as f:
    #     f.write(manim_code)

    script_path = f"{job_dir}/generated_manim.py"
    with open(script_path, "w", encoding="utf-8") as f:
        f.write("from manim import *\n\n")
        f.write(manim_code)

    # Render videos via Manim (parallel per scene)
    # write_status(job_dir, "rendering_video", 0.80)
    pre_watermark_output_path = f"{job_dir}/pre_watermark_final.mp4"
    output_path = f"{job_dir}/final.mp4"
    scene_names = get_manim_scene_names(script_path)
    if not scene_names:
        raise ValueError("No Manim scene classes found in generated script.")

    worker_cap = 4
    auto_workers = min(max(1, os.cpu_count() or 1), len(scene_names))
    render_workers = min(max(1, worker_cap), len(scene_names)) if worker_cap > 0 else auto_workers
    with ThreadPoolExecutor(max_workers=render_workers) as executor:
        futures = [
            executor.submit(render_single_scene, scene_name, script_path, job_dir)
            for scene_name in scene_names
        ]
        for future in as_completed(futures):
            future.result()
    
    videos_dir = f"{job_dir}/videos/generated_manim/720p30"
    
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

    concat_videos_ffmpeg(videos_dir, pre_watermark_output_path)
    add_watermark_to_video(pre_watermark_output_path, output_path)

    return output_path
