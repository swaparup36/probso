import json
import redis

def write_status(jobId: str, status: str, progress: float, r: redis.Redis):
    """
    Write job status to tmp/<id>/status.json and publish to Redis channel.
    """
    data = {"jobId": jobId,"status": status, "progress": progress*100}
    
    # Publish to Redis
    result = r.publish('job_status_channel', json.dumps(data))
    print(f"Redis publish returned: {result} subscribers received the message")
