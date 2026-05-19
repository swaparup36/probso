import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

def upload_image_to_cloudinary(image_path: str) -> str:
    """
        Uploads an image to Cloudinary and returns the secure URL.
    """
    
    try:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        print(f"Uploading image to Cloudinary: {image_path}")
        
        upload_result = cloudinary.uploader.upload(
            image_path,
            folder="pdfvid/images",
            resource_type="auto"
        )
        secure_url = upload_result["secure_url"]
        print(f"Image uploaded successfully: {secure_url}")
        return secure_url
    except Exception as e:
        print(f"Error uploading image: {e}")
        raise