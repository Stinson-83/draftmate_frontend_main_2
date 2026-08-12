import os
import sys
import urllib.request
import zipfile
import socket
import time
from huggingface_hub import snapshot_download

def safe_snapshot_download(**kwargs):
    try:
        snapshot_download(**kwargs)
    except Exception as e:
        print(f"⚠️ Warning: failed to download {kwargs.get('repo_id', '')}: {e}")
        return False
    return True

# EasyOCR/HuggingFace downloads pull from CDNs that frequently reset the
# connection mid-transfer. Give sockets a generous timeout and retry on failure.
socket.setdefaulttimeout(300)

MAX_RETRIES = 5
RETRY_BACKOFF_SECONDS = 10


def _with_retries(label, fn, cleanup=None):
    """Run fn(), retrying on any exception with linear backoff."""
    last_err = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn()
        except Exception as err:  # noqa: BLE001 - network errors vary widely
            last_err = err
            print(f"⚠️ {label} failed (attempt {attempt}/{MAX_RETRIES}): {err}")
            if cleanup:
                cleanup()
            if attempt < MAX_RETRIES:
                wait = RETRY_BACKOFF_SECONDS * attempt
                print(f"   retrying in {wait}s...")
                time.sleep(wait)
    raise RuntimeError(f"{label} failed after {MAX_RETRIES} attempts") from last_err


def download_models():
    # Define paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(script_dir, "models")
    embed_path = os.path.join(models_dir, "embedding")
    rerank_path = os.path.join(models_dir, "rerank")
    easyocr_path = os.path.join(models_dir, "easyocr")

    os.makedirs(models_dir, exist_ok=True)

    # 1. Embedding Model
    print(f"⬇️ Downloading embedding model to: {embed_path}")
    ok = safe_snapshot_download(
        repo_id="sentence-transformers/all-MiniLM-L6-v2",
        local_dir=embed_path,
        local_dir_use_symlinks=False
    )
    if ok:
        print("✅ Embedding model download complete.")
    else:
        print("⚠️ Embedding model not available locally; continuing without it.")

    # 2. Rerank Model
    print(f"⬇️ Downloading rerank model to: {rerank_path}")
    ok = safe_snapshot_download(
        repo_id="cross-encoder/ms-marco-MiniLM-L-6-v2",
        local_dir=rerank_path,
        local_dir_use_symlinks=False
    )
    if ok:
        print("✅ Rerank model download complete.")
    else:
        print("⚠️ Rerank model not available locally; continuing without it.")

    # 3. EasyOCR Models
    print(f"⬇️ Downloading EasyOCR models to: {easyocr_path}")
    os.makedirs(easyocr_path, exist_ok=True)
    
    # Downloads required files for English OCR
    easyocr_urls = {
        "english_g2.zip": "https://github.com/JaidedAI/EasyOCR/releases/download/v1.3/english_g2.zip",
        "craft_mlt_25k.zip": "https://github.com/JaidedAI/EasyOCR/releases/download/pre-v1.1.6/craft_mlt_25k.zip"
    }

    for filename, url in easyocr_urls.items():
        dest_zip = os.path.join(easyocr_path, filename)
        try:
            if not os.path.exists(dest_zip.replace(".zip", ".pth")):
                print(f"Downloading {filename}...")
                urllib.request.urlretrieve(url, dest_zip)
                print(f"Extracting {filename}...")
                with zipfile.ZipFile(dest_zip, 'r') as zip_ref:
                    zip_ref.extractall(easyocr_path)
                os.remove(dest_zip)
                print(f"✅ {filename} extracted.")
            else:
                print(f"EasyOCR model {filename} already exists.")
        except Exception as e:
            print(f"⚠️ Warning: failed to download/extract {filename}: {e}")
            continue

    print("✅ Model download step finished (some models may be missing).")


if __name__ == "__main__":
    try:
        download_models()
    except Exception as e:
        print(f"⚠️ Warning: download_models raised an unexpected error: {e}")
        # Do not fail the process in build stage — models can be provided at runtime
        sys.exit(0)
