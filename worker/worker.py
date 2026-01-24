import shutil
import redis
import psycopg2
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import json
import requests
import os
from render_pipeline import process_job

load_dotenv()

# r = redis.Redis(host=os.getenv("REDIS_HOST"), port=os.getenv("REDIS_PORT"), decode_responses=True)
r = redis.Redis.from_url(
    os.getenv("REDIS_URL"),
    decode_responses=True
)

    
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST"),
        database=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        port=os.getenv("POSTGRES_PORT"),
        sslmode="require",
        keepalives=1,
        keepalives_idle=30,
        keepalives_interval=10,
        keepalives_count=5,
    )


cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

while True:
    task = r.brpop('task_queue', timeout=5)
    print(f'Retrieved task: {task}')
    if task:
        _, task_data = task
        print(f'Processing task: {task_data}')
        task_data = json.loads(task_data)
        job_id = task_data['jobId']
        user_id = None
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            # Update the job status to in_progress
            cursor.execute("UPDATE jobs SET status = %s WHERE id = %s ", ('in_progress', job_id))
            conn.commit()
            # Get the pdf file url from the database
            cursor.execute("SELECT pdf_url FROM jobs WHERE id = %s", (job_id,))
            pdf_url = cursor.fetchone()[0]
            conn.close()
            
            # Download the PDF file and save it locally to tmp/{job_id}/input.pdf
            pdf_path = f"tmp/{job_id}/input.pdf"
            os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
            response = requests.get(pdf_url)
            if response.status_code != 200:
                raise Exception(f"Failed to download PDF, status code: {response.status_code}")
            with open(pdf_path, 'wb') as f:
                f.write(response.content)
            # Check if file is empty
            if os.path.getsize(pdf_path) == 0:
                raise Exception("Downloaded PDF is empty.")
            output = process_job(job_id, r)
            
            # Upload the output video to cloudinary
            upload_result = cloudinary.uploader.upload(
                output,
                folder="pdfvid",
                resource_type="auto"
            )

            print(f"Video uploaded to Cloudinary: {upload_result['secure_url']}")
            
            conn = get_db_connection()
            cursor = conn.cursor()
            # Update the database with the output video url and mark job as completed
            cursor.execute("UPDATE jobs SET status = %s, output_url = %s WHERE id = %s ", ('completed', upload_result['secure_url'], job_id))
            conn.commit()
            
            title = task_data['title']
            
            # Get the user id from the database
            cursor.execute("SELECT user_id FROM jobs WHERE id = %s", (job_id,))
            user_id = cursor.fetchone()[0]
            
            if not user_id:
                raise Exception(f"User ID not found for job ID: {job_id}")
            
            # Create a new entry on the conversion table
            cursor.execute(
                """
                INSERT INTO conversions (title, user_id, job_id)
                VALUES (%s, %s, %s)
                """,
                (title, user_id, job_id)
            )
            conn.commit()
            
            # Deduct one token from on hold in user token balances
            cursor.execute(
                """
                UPDATE user_token_balances
                SET onhold = onhold - 1,
                    updated_at = NOW()
                WHERE user_id = %s AND onhold > 0
                """,
                (user_id,)
            )
            conn.commit()
            conn.close()
            
            # Delete the job directory to save space
            shutil.rmtree(f"tmp/{job_id}")
            
            # Publish job completion message to Redis
            job_status = {
                'title': title,
                'jobId': job_id,
                'userId': user_id,
                'output_url': upload_result['secure_url']
            }
            r.publish('job_output_channel', json.dumps(job_status))
        except Exception as e:
            print(f"Job {job_id} failed.")
            print(f"Error: {e}")
            
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE jobs SET status = %s, error_message = %s WHERE id = %s ", ('failed', f'{e}', job_id))
            conn.commit()
            if user_id:
                # Refund the token by moving one token from onhold to balance
                cursor.execute(
                    """
                    UPDATE user_token_balances
                    SET balance = balance + 1,
                        onhold = onhold - 1,
                        updated_at = NOW()
                    WHERE user_id = %s AND onhold > 0
                    """,
                    (user_id,)
                )
                conn.commit()
            conn.close()
            # Delete the job directory to save space
            shutil.rmtree(f"tmp/{job_id}")

