import os
import shutil
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

SHARED_STORAGE_PATH = os.getenv("SHARED_STORAGE_PATH", "/app/shared_drafts")

def upload_to_s3(local_path: str, s3_key: str) -> Tuple[str, str]:
    """
    Saves converted file to local EFS shared storage volume.
    """
    try:
        dest_path = os.path.join(SHARED_STORAGE_PATH, s3_key)
        if os.path.abspath(local_path) != os.path.abspath(dest_path):
            os.makedirs(os.path.dirname(dest_path), exist_ok=True)
            shutil.copy2(local_path, dest_path)
        return dest_path, dest_path
    except Exception as e:
        logger.error(f"EFS converter save failed: {e}")
        return local_path, local_path
