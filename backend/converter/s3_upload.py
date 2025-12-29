import boto3
import os
from botocore.exceptions import BotoCoreError, ClientError
from fastapi import HTTPException
from typing import Tuple

# Load env vars (App Runner injects them automatically)
AWS_REGION = os.getenv("AWS_REGION")                 # e.g. us-east-1
S3_BUCKET_REGION = os.getenv("S3_BUCKET_REGION")     # e.g. ap-south-1
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

# Create S3 client using IAM role (NO ACCESS KEYS)
s3 = boto3.client(
    "s3",
    region_name=S3_BUCKET_REGION
)

def upload_to_s3(local_path: str, s3_key: str) -> Tuple[str, str]:
    """
    Uploads a local HTML file to S3 and returns its HTTPS URL and S3 URI.
    """
    try:
        s3.upload_file(
            Filename=local_path,
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            ExtraArgs={"ContentType": "text/html"}
        )

        s3_uri = f"s3://{S3_BUCKET_NAME}/{s3_key}"
        https_url = (
            f"https://{S3_BUCKET_NAME}.s3."
            f"{S3_BUCKET_REGION}.amazonaws.com/{s3_key}"
        )

        return https_url, s3_uri

    except (BotoCoreError, ClientError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"S3 upload failed: {e}"
        )