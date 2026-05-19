import sys
import time
from render_pipeline_test import process_job_test

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_job.py <job_id>")
        exit(1)

    job_id = sys.argv[1]
    print(f"Processing job: {job_id}")
    job_start_time = time.time()
    output = process_job_test(job_id)
    print(f"Done! Video saved at: {output}")
    job_end_time = time.time()
    print(f"Total processing time: {round(job_end_time - job_start_time, 2)} seconds")