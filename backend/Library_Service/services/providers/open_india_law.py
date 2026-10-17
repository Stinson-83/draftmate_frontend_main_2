import logging
import os
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from models import LegalAct, LegalProvider
from services.embedding_service import get_embedding_service
from services.legal_search import search_judgments, get_judgment_detail, LegalSearchError
from services.qdrant_service import QdrantService, QdrantUnavailable, reciprocal_rank_fusion
from .base import BaseLegalProvider

logger = logging.getLogger(__name__)


class OpenIndiaLawProvider(BaseLegalProvider):
    """Open India Law corpus stored in PostgreSQL and Qdrant."""

    def __init__(self, db_session: Session):
        self.db = db_session
        self.qdrant_service = QdrantService()
        self.embedding_service = get_embedding_service()
        provider_name = os.getenv("EMBEDDING_PROVIDER", "local").lower()
        if provider_name == "voyage":
            self.acts_collection = os.getenv("LEGAL_ACTS_COLLECTION", "draftmate_acts_voyage")
        else:
            self.acts_collection = os.getenv("LEGAL_ACTS_COLLECTION", "draftmate_acts_dev")
        self.provider = self.db.query(LegalProvider).filter(LegalProvider.name == "Open India Law").first()

    async def search_judgments(self, query: str, **kwargs) -> List[Dict]:
        page_size = kwargs.get("limit") or kwargs.get("page_size") or 10
        result = search_judgments(self.db, query=query, page=kwargs.get("page", 1), page_size=page_size)
        return result["results"]

    async def get_judgment(self, judgment_id: str) -> Optional[Dict]:
        try:
            return get_judgment_detail(self.db, judgment_id)
        except LegalSearchError as exc:
            if exc.status_code == 404:
                return None
            raise

    async def search_legislation(self, query: str, **kwargs) -> List[Dict]:
        if not self.provider or not query.strip():
            return []
        limit = kwargs.get("limit", 10)
        dense_vec = self.embedding_service.embed_query_dense(query)
        sparse_raw = self.embedding_service.embed_query_sparse(query)
        try:
            dense_points = self.qdrant_service.search_dense(self.acts_collection, dense_vec, limit)
            sparse_points = self.qdrant_service.search_sparse(self.acts_collection, sparse_raw, limit)
        except QdrantUnavailable:
            logger.error("Open India Law legislation index is unavailable")
            return []
        fused = reciprocal_rank_fusion([dense_points, sparse_points])[:limit]
        results = []
        for point in fused:
            payload = point.get("payload") or {}
            results.append({
                "id": payload.get("act_id") or point.get("id"),
                "title": payload.get("title", ""),
                "act_number": payload.get("section_number", ""),
                "year": str(payload.get("year") or ""),
            })
        return results

    async def get_act(self, act_id: str) -> Optional[Dict]:
        act = self.db.query(LegalAct).filter(LegalAct.external_id == act_id).first()
        if not act:
            return None
        return {
            "id": str(act.id),
            "title": act.title,
            "act_number": act.act_number or "",
            "year": act.year,
        }
