import os
from sentence_transformers import SentenceTransformer

model_name = "sentence-transformers/all-MiniLM-L6-v2"
cache_folder = os.getenv("SENTENCE_TRANSFORMERS_HOME", "/app/models")

print(f"Downloading {model_name} to {cache_folder}...")
model = SentenceTransformer(model_name, cache_folder=cache_folder)
print("Download complete.")
