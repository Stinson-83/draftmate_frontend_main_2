import os
import logging
import threading
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "draftmate-drafts-022104541864")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")

_s3_client = None

def get_s3_client():
    global _s3_client
    if _s3_client is None:
        if not S3_BUCKET_NAME:
            return None
        try:
            # Under AWS Fargate, boto3 automatically uses IAM Task Role if AWS credentials are not in env.
            # Locally, it will use ~/.aws/credentials.
            _s3_client = boto3.client("s3", region_name=AWS_REGION)
        except Exception as e:
            logger.warning(f"Could not initialize S3 client: {e}. S3 backup disabled.")
            return None
    return _s3_client

def upload_file_to_s3(local_path: str, s3_key: str):
    client = get_s3_client()
    if not client:
        return False
    try:
        logger.info(f"Uploading {local_path} to s3://{S3_BUCKET_NAME}/{s3_key}")
        client.upload_file(local_path, S3_BUCKET_NAME, s3_key)
        return True
    except ClientError as e:
        logger.error(f"Failed to upload to S3: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during S3 upload: {e}")
        return False

def upload_file_to_s3_background(local_path: str, s3_key: str):
    """Fire-and-forget background thread for S3 upload so we don't block API requests"""
    if not get_s3_client():
        return
    thread = threading.Thread(target=upload_file_to_s3, args=(local_path, s3_key))
    thread.daemon = True
    thread.start()

def download_file_from_s3(s3_key: str, local_path: str):
    client = get_s3_client()
    if not client:
        return False
    try:
        logger.info(f"Downloading s3://{S3_BUCKET_NAME}/{s3_key} to {local_path}")
        # Ensure directory exists
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        client.download_file(S3_BUCKET_NAME, s3_key, local_path)
        return True
    except ClientError as e:
        # 404 is normal if file has not been uploaded yet
        if e.response.get("Error", {}).get("Code") == "404":
            logger.info(f"File {s3_key} not found in S3 bucket.")
        else:
            logger.error(f"Failed to download from S3: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during S3 download: {e}")
        return False

def ensure_file_exists_locally(s3_key: str, local_path: str):
    """Checks local disk first. If missing, pulls from S3."""
    if os.path.isfile(local_path):
        return True
    # Try downloading from S3
    return download_file_from_s3(s3_key, local_path)
