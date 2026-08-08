import os
import shutil
import logging

logger = logging.getLogger(__name__)

SHARED_STORAGE_PATH = os.getenv("SHARED_STORAGE_PATH", "/app/shared_drafts")

def get_s3_client():
    return None

def upload_file_to_s3(local_path: str, s3_key: str):
    """EFS storage handler: ensures file is stored on persistent shared EFS volume."""
    try:
        if not os.path.exists(local_path):
            return False
        dest_path = os.path.join(SHARED_STORAGE_PATH, s3_key)
        if os.path.abspath(local_path) != os.path.abspath(dest_path):
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            shutil.copy2(local_path, dest_path)
            logger.info(f"EFS Storage: Saved file {local_path} to {dest_path}")
        return True
    except Exception as e:
        logger.error(f"EFS storage save error: {e}")
        return False

def upload_file_to_s3_background(local_path: str, s3_key: str):
    upload_file_to_s3(local_path, s3_key)

def download_file_from_s3(s3_key: str, local_path: str):
    try:
        source_path = os.path.join(SHARED_STORAGE_PATH, s3_key)
        if os.path.isfile(source_path):
            if os.path.abspath(source_path) != os.path.abspath(local_path):
                os.makedirs(os.path.dirname(local_path), exist_ok=True)
                shutil.copy2(source_path, local_path)
            return True
        return False
    except Exception as e:
        logger.error(f"EFS storage read error: {e}")
        return False

def ensure_file_exists_locally(s3_key: str, local_path: str):
    if os.path.isfile(local_path):
        return True
    return download_file_from_s3(s3_key, local_path)
