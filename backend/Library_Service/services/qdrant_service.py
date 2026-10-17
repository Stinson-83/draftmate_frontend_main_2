import logging
import os
from typing import Any, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.http.models import FieldCondition, Filter, MatchValue, SparseVector

logger = logging.getLogger(__name__)


class QdrantUnavailable(Exception):
    """Raised when the search index cannot be queried."""


def qdrant_url() -> str:
    host = os.getenv("QDRANT_HOST", "").strip()
    port = os.getenv("QDRANT_PORT", "6333").strip() or "6333"
    # Inside Docker, QDRANT_HOST is the service name. A localhost QDRANT_URL
    # from the developer env file must not override that.
    if host and host not in ("localhost", "127.0.0.1"):
        return f"http://{host}:{port}"
    explicit = os.getenv("QDRANT_URL", "").strip()
    if explicit:
        return explicit
    return f"http://{host or 'localhost'}:{port}"


class QdrantService:
    def __init__(self):
        self.url = qdrant_url()
        api_key = os.getenv("QDRANT_API_KEY", "").strip()
        self.client = QdrantClient(url=self.url, api_key=api_key or None, timeout=20, check_compatibility=False)

    def collection_dense_size(self, collection_name: str) -> int:
        try:
            info = self.client.get_collection(collection_name)
        except Exception as exc:
            raise QdrantUnavailable("Search index is unavailable") from exc
        vectors = info.config.params.vectors
        dense = vectors.get("dense") if isinstance(vectors, dict) else None
        if dense is None or not getattr(dense, "size", None):
            raise QdrantUnavailable("Search index is missing the dense vector")
        return int(dense.size)

    def search_named(
        self,
        collection_name: str,
        query: Any,
        using: str,
        limit: int = 20,
        metadata_filter: Optional[dict] = None,
    ) -> list:
        """Retrieve with one named vector: 'dense' or 'sparse'."""
        qfilter = _metadata_filter(metadata_filter)
        try:
            result = self.client.query_points(
                collection_name=collection_name,
                query=query,
                using=using,
                limit=limit,
                query_filter=qfilter,
                with_payload=True,
            )
            return list(result.points)
        except Exception as exc:
            logger.error("Qdrant %s retrieval failed: %s", using, type(exc).__name__)
            raise QdrantUnavailable(f"{using} retrieval failed") from exc

    def search_dense(self, collection_name: str, dense_vector: list, limit: int = 20, metadata_filter: Optional[dict] = None) -> list:
        return self.search_named(collection_name, dense_vector, "dense", limit, metadata_filter)

    def search_sparse(self, collection_name: str, sparse_vector: dict, limit: int = 20, metadata_filter: Optional[dict] = None) -> list:
        if not sparse_vector or not sparse_vector.get("indices"):
            raise QdrantUnavailable("BM25 sparse vector is empty")
        query = SparseVector(indices=sparse_vector["indices"], values=sparse_vector["values"])
        return self.search_named(collection_name, query, "sparse", limit, metadata_filter)


def reciprocal_rank_fusion(rankings: List[list], k: int = 60) -> List[dict]:
    """Fuse ordered point lists. Each point must have id, score, and payload."""
    scores = {}
    payloads = {}
    dense_score = {}
    sparse_score = {}
    for leg_index, points in enumerate(rankings):
        for rank, point in enumerate(points, start=1):
            point_id = str(point.id)
            scores[point_id] = scores.get(point_id, 0.0) + 1.0 / (k + rank)
            if point.payload:
                payloads[point_id] = point.payload
            if leg_index == 0:
                dense_score[point_id] = float(point.score or 0)
            elif leg_index == 1:
                sparse_score[point_id] = float(point.score or 0)
    fused = []
    for point_id, score in scores.items():
        fused.append({
            "id": point_id,
            "score": score,
            "payload": payloads.get(point_id) or {},
            "dense_score": dense_score.get(point_id),
            "sparse_score": sparse_score.get(point_id),
            "sparse_hit": point_id in sparse_score,
            "dense_hit": point_id in dense_score,
        })
    fused.sort(key=lambda item: item["score"], reverse=True)
    return fused


def _metadata_filter(metadata_filter: Optional[dict]) -> Optional[Filter]:
    if not metadata_filter:
        return None
    conditions = [
        FieldCondition(key=key, match=MatchValue(value=value))
        for key, value in metadata_filter.items()
        if value is not None and value != ""
    ]
    if not conditions:
        return None
    return Filter(must=conditions)
