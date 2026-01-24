import json
import os
import redis

def write_status(jobId: str,job_dir: str, status: str, progress: float, r: redis.Redis):
    """
    Write job status to tmp/<id>/status.json and publish to Redis channel.
    """
    data = {"jobId": jobId,"status": status, "progress": progress*100}
    r.publish('job_status_channel', json.dumps(data))
    with open(os.path.join(job_dir, "status.json"), "w") as f:
        json.dump(data, f)
