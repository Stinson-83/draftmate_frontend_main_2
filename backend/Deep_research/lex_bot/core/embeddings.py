import logging
import threading
from typing import Any, List
from lex_bot.config import EMBEDDING_MODEL_NAME

logger = logging.getLogger(__name__)

_embedding_model = None
_inference_lock = threading.Lock()

def get_embedding_model() -> Any:
    """
    Lazy-load and return the SentenceTransformer singleton.
    This prevents loading the ~1.5GB model multiple times across different modules,
    and avoids loading it at startup if it's never actually used.
    """
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"🔍 Loading global Embedding Model: {EMBEDDING_MODEL_NAME}...")
            # Use CPU to avoid blocking / VRAM issues in multi-threaded setup unless GPU is specified
            _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME, device='cpu')
            logger.info("✅ Global Embedding Model loaded successfully")
        except ImportError:
            logger.error("SentenceTransformers not installed.")
        except Exception as e:
            logger.error(f"❌ Global Model Loading Failed: {e}")
            
    return _embedding_model

def get_query_embedding(query: str) -> List[float]:
    """Thread-safe CPU inference wrapper for the embedding model."""
    model = get_embedding_model()
    if not model:
        return []
        
    with _inference_lock:
        return model.encode([query], normalize_embeddings=True)[0].tolist()
