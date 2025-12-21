import boto3
from dotenv import load_dotenv
import os
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException
from typing import Tuple

load_dotenv()
AWS_ACCESS_KEY_ID= os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY= os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION= os.getenv("AWS_REGION")

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
)

# bucket_name="user-upload-s3-bucket"

# def upload_to_s3(file_path: str, s3_key: str):
#     s3.upload_file(file_path, bucket_name, s3_key)
#     url = f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"
#     return url

def upload_to_s3(local_path: str, s3_key: str) -> Tuple[str, str]:
    """
    Uploads a local HTML file to S3 and returns its S3 URL.
    """
    bucket_name=os.getenv("S3_BUCKET_NAME")
    try:
        s3.upload_file(
            Filename=local_path,
            Bucket=bucket_name,
            Key=s3_key,
            ExtraArgs={"ContentType": "text/html"}  # so browser knows it’s HTML
        )
        s3_uri = f"s3://{bucket_name}/{s3_key}"
        https_url = f"https://{bucket_name}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    except (BotoCoreError, ClientError) as e:
        raise HTTPException(status_code=500, detail=f"S3 upload failed: {e}")

    
    return https_url, s3_uri  #f"https://{bucket_name}.s3.amazonaws.com/{s3_key}"