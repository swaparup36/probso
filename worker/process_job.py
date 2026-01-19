import sys
from render_pipeline_test import process_job_test

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_job.py <job_id>")
        exit(1)

    job_id = sys.argv[1]
    print(f"Processing job: {job_id}")
    output = process_job_test(job_id)
    print(f"Done! Video saved at: {output}")
