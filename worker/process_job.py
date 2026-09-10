import sys
import time
from render_pipeline import process_job
from render_pipeline_test import rerender_job_test

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_job.py <job_id> [--rerender]")
        exit(1)

    job_id = sys.argv[1]
    # --rerender skips narration/code generation and re-runs only the Manim
    # render + LLM repair loop against the already generated scene scripts.
    rerender_only = "--rerender" in sys.argv[2:]

    print(f"Processing job: {job_id}")
    job_start_time = time.time()
    if rerender_only:
        output = rerender_job_test(job_id)
    else:
        output = process_job(job_id, mode="cli")
    print(f"Done! Video saved at: {output}")
    job_end_time = time.time()
    print(f"Total processing time: {round(job_end_time - job_start_time, 2)} seconds")
