import json
import os
import sys
import redis

def write_status(jobId: str,job_dir: str, status: str, progress: float, r: redis.Redis):
    """
    Write job status to tmp/<id>/status.json and publish to Redis channel.
    """
    print(f"🔵 write_status called: jobId={jobId}, status={status}, progress={progress}", flush=True)
    sys.stdout.flush()
    data = {"jobId": jobId,"status": status, "progress": progress*100}
    
    # Debug: Print what we're about to publish
    print(f"📤 Publishing status update: {json.dumps(data)}", flush=True)
    sys.stdout.flush()  # Force flush
    
    # Publish to Redis
    result = r.publish('job_status_channel', json.dumps(data))
    print(f"✅ Redis publish returned: {result} subscribers received the message", flush=True)
    sys.stdout.flush()  # Force flush
    
    # Write to file
    with open(os.path.join(job_dir, "status.json"), "w") as f:
        json.dump(data, f)
