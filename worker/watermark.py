import subprocess

def add_watermark_to_video(input_video, output_video):
    cmd = [
        "ffmpeg",
        "-y",
        "-i", input_video,
        "-i", "probso-logo.png",
        "-filter_complex",
        "overlay=W-w-5:H-h-5",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-c:a", "copy",
        output_video
    ]

    subprocess.run(cmd, check=True)
