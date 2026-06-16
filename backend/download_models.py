import os
import urllib.request
import zipfile
from huggingface_hub import snapshot_download

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
    snapshot_download(
        repo_id="sentence-transformers/all-MiniLM-L6-v2",
        local_dir=embed_path,
        local_dir_use_symlinks=False
    )
    print("✅ Embedding model download complete.")

    # 2. Rerank Model
    print(f"⬇️ Downloading rerank model to: {rerank_path}")
    snapshot_download(
        repo_id="cross-encoder/ms-marco-MiniLM-L-6-v2",
        local_dir=rerank_path,
        local_dir_use_symlinks=False
    )
    print("✅ Rerank model download complete.")

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

    print("✅ All models downloaded successfully.")

if __name__ == "__main__":
    download_models()
