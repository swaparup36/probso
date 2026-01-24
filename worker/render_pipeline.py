import os
import subprocess
from pdf_tools import extract_pdf_text, extract_images
from llm import make_manim_script
from codeformattor import sanitize_vgroup_with_images, rewrite_invalid_transforms
from watermark import add_watermark_to_video
from utils import write_status
import redis

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
    subprocess.run(
        [
            "ffmpeg",
            "-i", video_path,
            "-i", audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-shortest",
            output_path,
        ],
        check=True
    )

def process_job(job_id: str, r: redis.Redis):
    job_dir = f"tmp/{job_id}"
    pdf_path = f"{job_dir}/input.pdf"
    diagrams_folder = f"{job_dir}/diagrams"
    os.makedirs(diagrams_folder, exist_ok=True)

    # Step 1 — Extract text
    write_status(job_id, job_dir, "extracting_text", 0.1, r)
    text = extract_pdf_text(pdf_path)
    open(f"{job_dir}/extracted_text.txt", "w").write(text)

    # Step 2 — Extract diagrams
    write_status(job_id, job_dir, "extracting_diagrams", 0.25, r)
    diagrams = extract_images(pdf_path, diagrams_folder)
    open(f"{job_dir}/diagrams_list.txt", "w").write("\n".join(diagrams))

    # Step 3 — Generate Manim code
    write_status(job_id, job_dir, "generating_manim_code", 0.50, r)
    manim_code = make_manim_script(job_id, diagrams)
    
    # Store the raw Manim code before sanitization for debugging
    with open(f"{job_dir}/raw_manim_code.py", "w", encoding="utf-8") as f:
        f.write(manim_code)

    manim_code = sanitize_vgroup_with_images(manim_code)
    manim_code = rewrite_invalid_transforms(manim_code)
    with open(f"sanitized_manim_code.py", "w", encoding="utf-8") as f:
        f.write(manim_code)

    script_path = f"{job_dir}/generated_manim.py"
    with open(script_path, "w", encoding="utf-8") as f:
        f.write("from manim import *\n\n")
        f.write(manim_code)

    # Step 4 — Render video via Manim
    write_status(job_id, job_dir, "rendering_video", 0.80, r)

    pre_watermark_output_path = f"{job_dir}/pre_watermark_final.mp4"
    output_path = f"{job_dir}/final.mp4"
    command = [
        "manim",
        "--resolution", "1280,720",   # 720p
        "--fps", "30",                # 30 FPS
        "-a",                         # render all scenes
        script_path,
        "--output_file", "final",
        "--media_dir", job_dir
    ]
    subprocess.run(command, check=True)
    
    videos_dir = f"{job_dir}/videos/generated_manim/720p30"
    
    # Add audio to each video segment
    for video_file in os.listdir(videos_dir):
        if video_file.endswith(".mp4"):
            video_path = os.path.join(videos_dir, video_file)
            base_name = os.path.splitext(video_file)[0]
            audio_path = os.path.join(job_dir, f"page_{base_name.removeprefix('Scene')}_narration.mp3")
            print(f"attaching audio: {audio_path} to video: {video_path}")
            if os.path.exists(audio_path):
                output_video_path = os.path.join(videos_dir, f"{base_name}_with_audio.mp4")
                add_audio_to_video(video_path, audio_path, output_video_path)
                os.remove(video_path)  # Remove original video without audio
                os.rename(output_video_path, video_path)  # Rename new video to original name

    concat_videos_ffmpeg(videos_dir, pre_watermark_output_path)
    add_watermark_to_video(pre_watermark_output_path, output_path)

    return output_path
