import os
from abc import ABC, abstractmethod
from typing import List, Dict, Any
from qdrant_client import QdrantClient

class EmbeddingProvider(ABC):
    @abstractmethod
    def embed_query_dense(self, query: str) -> List[float]:
        pass

    @abstractmethod
    def embed_documents_dense(self, documents: List[str]) -> List[List[float]]:
        pass

class VoyageEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        import voyageai
        self.voyage_api_key = os.getenv("VOYAGE_API_KEY", "")
        self.model = os.getenv("VOYAGE_EMBEDDING_MODEL", "voyage-4")
        if not self.voyage_api_key:
            raise Exception("VOYAGE_API_KEY is not configured for VoyageEmbeddingProvider.")
        self.voyage_client = voyageai.Client(api_key=self.voyage_api_key)

    def embed_query_dense(self, query: str) -> List[float]:
        result = self.voyage_client.embed([query], model=self.model, input_type="query")
        return result.embeddings[0]

    def embed_documents_dense(self, documents: List[str]) -> List[List[float]]:
        # For actual ingestion, batch properly
        result = self.voyage_client.embed(documents, model=self.model, input_type="document")
        return result.embeddings

def _local_model_name() -> str:
    configured = os.getenv("LOCAL_EMBEDDING_MODEL", "").strip()
    if configured:
        return configured
    bundled = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models", "all-MiniLM-L6-v2"))
    if os.path.isdir(bundled):
        return bundled
    return "sentence-transformers/all-MiniLM-L6-v2"


class LocalEmbeddingProvider(EmbeddingProvider):
    def __init__(self):
        from sentence_transformers import SentenceTransformer
        self.model_name = _local_model_name()
        self.model = SentenceTransformer(self.model_name)

    def embed_query_dense(self, query: str) -> List[float]:
        embedding = self.model.encode(query, normalize_embeddings=True)
        return embedding.tolist()

    def embed_documents_dense(self, documents: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(documents, normalize_embeddings=True)
        return embeddings.tolist()

class EmbeddingService:
    def __init__(self):
        self.provider_type = os.getenv("EMBEDDING_PROVIDER", "local").lower()
        if self.provider_type == "voyage":
            self.provider = VoyageEmbeddingProvider()
            self.model_name = os.getenv("VOYAGE_EMBEDDING_MODEL", "voyage-4")
            self.dimension = int(os.getenv("VOYAGE_EMBEDDING_DIMENSION", "1024"))
        else:
            self.provider_type = "local"
            self.provider = LocalEmbeddingProvider()
            self.model_name = self.provider.model_name
            self.dimension = int(os.getenv("LOCAL_EMBEDDING_DIMENSION", "384"))

        from services.qdrant_service import qdrant_url
        self.qdrant_url = qdrant_url()
        self.qdrant_api_key = os.getenv("QDRANT_API_KEY", "")
        self.qclient = QdrantClient(
            url=self.qdrant_url,
            api_key=self.qdrant_api_key if self.qdrant_api_key else None,
            check_compatibility=False,
        )

        try:
            from fastembed import SparseTextEmbedding
            cache_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "models", "fastembed"))
            os.makedirs(cache_dir, exist_ok=True)
            # The BM25 weights are cached locally. Fastembed treats HF_HUB_OFFLINE as
            # local_files_only and then misses this cache layout, so allow cache reads
            # for this load only.
            previous_offline = os.environ.pop("HF_HUB_OFFLINE", None)
            previous_transformers = os.environ.pop("TRANSFORMERS_OFFLINE", None)
            try:
                import huggingface_hub.constants as hf_constants
                hf_constants.HF_HUB_OFFLINE = False
                self.bm25_model = SparseTextEmbedding(model_name="Qdrant/bm25", cache_dir=cache_dir, local_files_only=False)
            finally:
                if previous_offline is not None:
                    os.environ["HF_HUB_OFFLINE"] = previous_offline
                if previous_transformers is not None:
                    os.environ["TRANSFORMERS_OFFLINE"] = previous_transformers
        except ImportError:
            self.bm25_model = None

    @property
    def provider_name(self) -> str:
        return self.provider_type

    def embed_query_dense(self, query: str) -> List[float]:
        """Embed a search query using configured provider."""
        return self.provider.embed_query_dense(query)

    def embed_documents_dense(self, documents: List[str]) -> List[List[float]]:
        """Embed a batch of documents using configured provider."""
        return self.provider.embed_documents_dense(documents)

    def embed_query_sparse(self, query: str) -> Dict[str, Any]:
        """Embed a search query using Qdrant/bm25."""
        if not self.bm25_model:
            raise RuntimeError("BM25 sparse embedding is unavailable")

        embeddings = list(self.bm25_model.query_embed(query))
        if embeddings:
            res = embeddings[0]
            return {"indices": res.indices.tolist(), "values": res.values.tolist()}
        return {"indices": [], "values": []}

    def embed_documents_sparse(self, documents: List[str]) -> List[Dict[str, Any]]:
        if not self.bm25_model:
            return [{"indices": [], "values": []} for _ in documents]

        # embed() is specifically used for documents in open india law
        embeddings = list(self.bm25_model.embed(documents))
        return [{"indices": res.indices.tolist(), "values": res.values.tolist()} for res in embeddings]


_embedding_service = None


def get_embedding_service() -> EmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
