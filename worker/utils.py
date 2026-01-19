import json
import os

def write_status(job_dir: str, status: str, progress: float):
    """
    Write job status to tmp/<id>/status.json.
    """
    data = {"status": status, "progress": progress}
    with open(os.path.join(job_dir, "status.json"), "w") as f:
        json.dump(data, f)
