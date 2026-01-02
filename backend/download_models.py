import os
from sentence_transformers import SentenceTransformer, CrossEncoder
import easyocr

def download_models():
    # Define explicit paths
    base_dir = "/app/models"
    embed_path = os.path.join(base_dir, "embedding")
    rerank_path = os.path.join(base_dir, "rerank")
    easyocr_path = os.path.join(base_dir, "easyocr")

    os.makedirs(base_dir, exist_ok=True)

    # 1. Embedding Model
    # We use the hardcoded HF ID for downloading, but save to the path expected by the app
    source_embed_model = "sentence-transformers/all-MiniLM-L6-v2"
    print(f"⬇️ Downloading embedding model: {source_embed_model}")
    model = SentenceTransformer(source_embed_model)
    model.save(embed_path)
    print(f"✅ Embedding model saved to: {embed_path}")

    # 2. Rerank Model
    source_rerank_model = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    print(f"⬇️ Downloading rerank model: {source_rerank_model}")
    model = CrossEncoder(source_rerank_model)
    model.save(rerank_path)
    print(f"✅ Rerank model saved to: {rerank_path}")

    # 3. EasyOCR Models
    print(f"⬇️ Downloading EasyOCR models...")
    if not os.path.exists(easyocr_path):
        os.makedirs(easyocr_path, exist_ok=True)
    easyocr.Reader(['en'], gpu=False, model_storage_directory=easyocr_path)
    print(f"✅ EasyOCR models saved to: {easyocr_path}")

if __name__ == "__main__":
    download_models()
