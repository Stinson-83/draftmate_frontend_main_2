"""Hybrid judgment search over Open India Law records.

Dense retrieval and BM25 sparse retrieval both run, then Reciprocal Rank
Fusion combines them. Chunk hits are grouped into one judgment.
"""
import logging
import os
import re
import time
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import extract, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models import LegalCitation, LegalCourt, LegalJudgment, LegalProvider, LegalSource
from services.embedding_service import get_embedding_service
from services.qdrant_service import QdrantService, QdrantUnavailable, reciprocal_rank_fusion

logger = logging.getLogger(__name__)

_qdrant = None
_links_ready = False


class LegalSearchError(Exception):
    def __init__(self, public_message: str, status_code: int = 503):
        super().__init__(public_message)
        self.public_message = public_message
        self.status_code = status_code


def judgments_collection() -> str:
    provider = os.getenv("EMBEDDING_PROVIDER", "local").lower()
    if provider == "voyage":
        return os.getenv("LEGAL_JUDGMENTS_COLLECTION", "draftmate_legal_judgments_voyage")
    return os.getenv("LEGAL_JUDGMENTS_COLLECTION", "draftmate_legal_judgments_dev")


def _qdrant_service() -> QdrantService:
    global _qdrant
    if _qdrant is None:
        _qdrant = QdrantService()
    return _qdrant


def normalize_query(query: str) -> str:
    return re.sub(r"\s+", " ", (query or "").strip())


def _excerpt(raw: str, limit: int = 420) -> str:
    text_value = (raw or "").strip()
    if text_value.startswith("Case:"):
        parts = text_value.split("\n\n", 1)
        if len(parts) == 2 and parts[1].strip():
            text_value = parts[1].strip()
    text_value = re.sub(r"\s+", " ", text_value)
    if len(text_value) <= limit:
        return text_value
    cut = text_value[:limit].rsplit(" ", 1)[0]
    return cut + "…"


def _chunk_sort_key(chunk_index: str):
    match = re.search(r"_(\d+)_", chunk_index or "")
    return (int(match.group(1)) if match else 10**9, chunk_index or "")


_STOPWORDS = {
    "section", "article", "court", "india", "versus", "with", "from", "under",
    "that", "this", "have", "been", "were", "para", "body", "case", "act",
    "the", "and", "for", "not",
}


def _body_text(raw: str) -> str:
    value = raw or ""
    if value.startswith("Case:"):
        parts = value.split("\n\n", 1)
        if len(parts) == 2:
            value = parts[1]
    return value


def _significant_tokens(query: str) -> List[str]:
    tokens = []
    for token in re.findall(r"[a-z0-9]+", (query or "").lower()):
        if token in _STOPWORDS:
            continue
        if token.isdigit() and len(token) >= 2:
            tokens.append(token)
        elif len(token) >= 4:
            tokens.append(token)
    return tokens


def _token_in(text: str, token: str) -> bool:
    if token.isdigit():
        return re.search(rf"(?<!\d){re.escape(token)}(?!\d)", text) is not None
    return re.search(rf"\b{re.escape(token)}\b", text) is not None


def _lexical_hit(query: str, *parts: str) -> bool:
    tokens = _significant_tokens(query)
    haystack = _body_text(" ".join(part or "" for part in parts)).lower()
    numbered = re.search(r"(article|section|sec\.|s\.)\s*([0-9]+[a-z]?)", (query or "").lower())
    if numbered:
        label, number = numbered.group(1), numbered.group(2)
        if re.search(rf"{re.escape(label)}\s*{re.escape(number)}\b", haystack):
            return True
        tokens = [token for token in tokens if token != number]
    if not tokens:
        return False
    return any(_token_in(haystack, token) for token in tokens)


def ensure_reference_rows(db: Session) -> None:
    """Fill court, citation, and source rows from canonical judgment fields."""
    global _links_ready
    if _links_ready:
        return
    try:
        db.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_library_legal_chunks_judgment "
            "ON library_legal_judgment_chunks (judgment_id)"
        ))
        if not db.query(LegalSource).filter(LegalSource.name == "Open India Law").first():
            db.add(LegalSource(name="Open India Law"))
        seen_courts = {row[0] for row in db.query(LegalCourt.name).all()}
        seen_citations = {
            (row.judgment_id, row.citation)
            for row in db.query(LegalCitation.judgment_id, LegalCitation.citation).all()
        }
        judgments = (
            db.query(LegalJudgment)
            .join(LegalJudgmentChunk, LegalJudgmentChunk.judgment_id == LegalJudgment.id)
            .distinct()
            .all()
        )
        for judgment in judgments:
            if judgment.court and judgment.court not in seen_courts:
                jurisdiction = "India" if "india" in judgment.court.lower() else None
                db.add(LegalCourt(name=judgment.court, jurisdiction=jurisdiction))
                seen_courts.add(judgment.court)
            if judgment.citation and (judgment.id, judgment.citation) not in seen_citations:
                db.add(LegalCitation(judgment_id=judgment.id, citation=judgment.citation))
                seen_citations.add((judgment.id, judgment.citation))
        db.commit()
        _links_ready = True
    except SQLAlchemyError as exc:
        db.rollback()
        logger.warning("Reference row sync skipped: %s", type(exc).__name__)


def _provider(db: Session) -> Optional[LegalProvider]:
    return db.query(LegalProvider).filter(LegalProvider.name == "Open India Law").first()


def _year(judgment: LegalJudgment) -> Optional[int]:
    if judgment.judgment_date:
        return judgment.judgment_date.year
    return None


def _public_hit(judgment: LegalJudgment, provider: Optional[LegalProvider], excerpt: str, relevance: float, chunk_index: str, chunk_id: str) -> Dict[str, Any]:
    year = _year(judgment)
    publisher = judgment.publisher or None
    return {
        "id": str(judgment.id),
        "case_id": judgment.external_id,
        "title": judgment.title,
        "court": judgment.court or None,
        "citation": judgment.citation or None,
        "judgment_date": judgment.judgment_date.isoformat() if judgment.judgment_date else None,
        "year": year,
        "excerpt": excerpt,
        "source": provider.name if provider else "Open India Law",
        "source_url": judgment.source_url or None,
        "source_publisher": publisher,
        "relevance": round(float(relevance), 6),
        "metadata": {
            "chunk_index": chunk_index,
            "chunk_id": chunk_id,
            "provider": provider.name if provider else "Open India Law",
            "provider_url": provider.base_url if provider else None,
        },
    }


def _group_points(points: List[dict]) -> List[dict]:
    grouped: Dict[str, dict] = {}
    for point in points:
        payload = point.get("payload") or {}
        case_id = payload.get("case_id") or payload.get("judgment_id")
        if not case_id:
            continue
        current = grouped.get(case_id)
        if current is None or point["score"] > current["score"]:
            grouped[case_id] = {
                "case_id": payload.get("case_id") or case_id,
                "judgment_id": payload.get("judgment_id"),
                "score": point["score"],
                "dense_score": point.get("dense_score"),
                "sparse_score": point.get("sparse_score"),
                "sparse_hit": point.get("sparse_hit", False),
                "title": payload.get("title") or "",
                "court": payload.get("court") or "",
                "citation": payload.get("citation") or "",
                "excerpt_source": payload.get("text") or "",
                "chunk_index": payload.get("chunk_id") or "",
                "chunk_id": str(point.get("id") or ""),
            }
    return list(grouped.values())


def _keep_group(group: dict, query: str) -> bool:
    """Keep a fused hit when the query's significant terms appear in the judgment.

    Dense and sparse scores still decide order. This gate stops a tiny corpus
    from returning an unrelated nearest neighbor for a query it does not contain.
    """
    return _lexical_hit(
        query,
        group.get("title"),
        group.get("citation"),
        group.get("court"),
        group.get("excerpt_source"),
    )


def _apply_generic_signals(group: dict, query: str) -> float:
    score = float(group["score"])
    lowered = query.lower()
    title = (group.get("title") or "").lower()
    citation = (group.get("citation") or "").lower()
    court = (group.get("court") or "").lower()
    if lowered and lowered in title:
        score += 0.05
    if citation and citation in lowered:
        score += 0.05
    if court and court in lowered:
        score += 0.02
    section = re.search(r"(?:section|article|sec\.|s\.)\s*([0-9]+[a-zA-Z]?)", lowered)
    if section and section.group(1).lower() in (group.get("excerpt_source") or "").lower():
        score += 0.03
    return score


def _filtered_judgments(db: Session, ids: List[str], filters: dict) -> Dict[str, LegalJudgment]:
    if not ids:
        return {}
    try:
        uuid_ids = [uuid.UUID(value) for value in ids]
    except ValueError as exc:
        raise LegalSearchError("Search index returned an invalid judgment id", 500) from exc

    query = db.query(LegalJudgment).filter(LegalJudgment.id.in_(uuid_ids))
    query = query.filter(~LegalJudgment.external_id.like("oil_judgment_%"))
    court = (filters.get("court") or "").strip()
    if court and court.lower() != "all":
        query = query.filter(LegalJudgment.court.ilike(f"%{court}%"))
    citation = (filters.get("citation") or "").strip()
    if citation:
        query = query.filter(LegalJudgment.citation.ilike(f"%{citation}%"))
    if filters.get("year_from"):
        query = query.filter(extract("year", LegalJudgment.judgment_date) >= int(filters["year_from"]))
    if filters.get("year_to"):
        query = query.filter(extract("year", LegalJudgment.judgment_date) <= int(filters["year_to"]))
    jurisdiction = (filters.get("jurisdiction") or "").strip()
    if jurisdiction:
        query = query.filter(LegalJudgment.court.ilike(f"%{jurisdiction}%"))
    source = (filters.get("source") or "").strip()
    if source:
        query = query.outerjoin(LegalProvider, LegalJudgment.provider_id == LegalProvider.id).filter(
            (LegalProvider.name.ilike(f"%{source}%")) | (LegalJudgment.publisher.ilike(f"%{source}%"))
        )
    rows = query.all()
    found = {str(row.id): row for row in rows}
    act = (filters.get("act") or "").strip()
    section = (filters.get("section") or "").strip()
    if not act and not section:
        return found
    kept = {}
    for judgment_id, judgment in found.items():
        chunks = db.query(LegalJudgmentChunk.text).filter(LegalJudgmentChunk.judgment_id == judgment.id).all()
        blob = " ".join(chunk.text or "" for chunk in chunks)
        blob_l = blob.lower()
        title_l = (judgment.title or "").lower()
        if act and act.lower() not in blob_l and act.lower() not in title_l:
            continue
        if section and not re.search(rf"(?:section|article|sec\.|s\.)\s*{re.escape(section)}\b", blob_l + " " + title_l, re.I):
            continue
        kept[judgment_id] = judgment
    return kept


def _browse_without_query(db: Session, filters: dict, page: int, page_size: int, provider: Optional[LegalProvider], sort: str = "relevance") -> dict:
    query = (
        db.query(LegalJudgment)
        .join(LegalJudgmentChunk, LegalJudgmentChunk.judgment_id == LegalJudgment.id)
        .filter(~LegalJudgment.external_id.like("oil_judgment_%"))
        .distinct()
    )
    court = (filters.get("court") or "").strip()
    if court and court.lower() != "all":
        query = query.filter(LegalJudgment.court.ilike(f"%{court}%"))
    citation = (filters.get("citation") or "").strip()
    if citation:
        query = query.filter(LegalJudgment.citation.ilike(f"%{citation}%"))
    if filters.get("year_from"):
        query = query.filter(extract("year", LegalJudgment.judgment_date) >= int(filters["year_from"]))
    if filters.get("year_to"):
        query = query.filter(extract("year", LegalJudgment.judgment_date) <= int(filters["year_to"]))
    jurisdiction = (filters.get("jurisdiction") or "").strip()
    if jurisdiction:
        query = query.filter(LegalJudgment.court.ilike(f"%{jurisdiction}%"))
    source = (filters.get("source") or "").strip()
    if source:
        query = query.outerjoin(LegalProvider, LegalJudgment.provider_id == LegalProvider.id).filter(
            (LegalProvider.name.ilike(f"%{source}%")) | (LegalJudgment.publisher.ilike(f"%{source}%"))
        )
    id_rows = query.with_entities(LegalJudgment.id).distinct().all()
    judgment_ids = [row[0] for row in id_rows]
    rows = []
    if judgment_ids:
            query = db.query(LegalJudgment).filter(LegalJudgment.id.in_(judgment_ids))
            if sort == "oldest":
                query = query.order_by(LegalJudgment.judgment_date.asc().nulls_last(), LegalJudgment.title.asc())
            else:
                query = query.order_by(LegalJudgment.judgment_date.desc().nulls_last(), LegalJudgment.title.asc())
            rows = query.all()
    act = (filters.get("act") or "").strip()
    section = (filters.get("section") or "").strip()
    if act or section:
        allowed = _filtered_judgments(db, [str(row.id) for row in rows], {"act": act, "section": section})
        rows = [row for row in rows if str(row.id) in allowed]
    total = len(rows)
    start = (page - 1) * page_size
    page_rows = rows[start:start + page_size]
    results = []
    for judgment in page_rows:
        chunk = (
            db.query(LegalJudgmentChunk)
            .filter(LegalJudgmentChunk.judgment_id == judgment.id)
            .order_by(LegalJudgmentChunk.chunk_index.asc())
            .first()
        )
        results.append(_public_hit(
            judgment,
            provider,
            _excerpt(chunk.text if chunk else ""),
            0,
            chunk.chunk_index if chunk else "",
            str(chunk.id) if chunk else "",
        ))
    total_pages = (total + page_size - 1) // page_size if total else 0
    return _page(results, page, page_size, total, total_pages, "")


def _page(results, page, page_size, total, total_pages, query) -> dict:
    return {
        "results": results,
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1 and total_pages > 0,
        "query": query,
    }


def search_judgments(
    db: Session,
    query: str = "",
    page: int = 1,
    page_size: int = 9,
    court: str = "",
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
    jurisdiction: str = "",
    citation: str = "",
    act: str = "",
    section: str = "",
    source: str = "",
    sort: str = "relevance",
    request_id: str = "",
) -> dict:
    started = time.perf_counter()
    normalized = normalize_query(query)
    filters = {
        "court": court,
        "year_from": year_from,
        "year_to": year_to,
        "jurisdiction": jurisdiction,
        "citation": citation,
        "act": act,
        "section": section,
        "source": source,
    }
    try:
        ensure_reference_rows(db)
        provider = _provider(db)
    except SQLAlchemyError as exc:
        logger.error("Database unavailable during judgment search: %s", type(exc).__name__)
        raise LegalSearchError("Judgment search is temporarily unavailable because the database cannot be reached.") from exc

    has_filter = any(value not in (None, "", "All") for value in filters.values())
    if not normalized and not has_filter:
        return _page([], page, page_size, 0, 0, "")
    if not normalized:
        try:
            return _browse_without_query(db, filters, page, page_size, provider, sort)
        except SQLAlchemyError as exc:
            logger.error("Database filter browse failed: %s", type(exc).__name__)
            raise LegalSearchError("Judgment search is temporarily unavailable because the database cannot be reached.") from exc

    collection = judgments_collection()
    embeddings = get_embedding_service()
    qdrant = _qdrant_service()
    candidate_limit = int(os.getenv("LEGAL_SEARCH_CANDIDATES", "64"))

    embed_started = time.perf_counter()
    try:
        dense_vector = embeddings.embed_query_dense(normalized)
        sparse_vector = embeddings.embed_query_sparse(normalized)
    except Exception as exc:
        logger.error("Embedding failed: %s", type(exc).__name__)
        raise LegalSearchError("Judgment search is temporarily unavailable because text embedding failed.") from exc
    embed_ms = (time.perf_counter() - embed_started) * 1000

    if len(dense_vector) != embeddings.dimension:
        raise LegalSearchError("The embedding model dimension does not match the configured search profile.", 500)
    try:
        index_size = qdrant.collection_dense_size(collection)
    except QdrantUnavailable as exc:
        raise LegalSearchError("Judgment search is temporarily unavailable because the search index cannot be reached.") from exc
    if len(dense_vector) != index_size:
        raise LegalSearchError("The embedding dimension does not match the judgment search index.", 500)
    if not sparse_vector.get("indices"):
        raise LegalSearchError("Judgment search is temporarily unavailable because keyword search failed.")

    qdrant_started = time.perf_counter()
    try:
        dense_points = qdrant.search_dense(collection, dense_vector, candidate_limit)
        sparse_points = qdrant.search_sparse(collection, sparse_vector, candidate_limit)
    except QdrantUnavailable as exc:
        raise LegalSearchError("Judgment search is temporarily unavailable because the search index cannot be reached.") from exc
    qdrant_ms = (time.perf_counter() - qdrant_started) * 1000

    fused = reciprocal_rank_fusion([dense_points, sparse_points])
    grouped = _group_points(fused)
    grouped = [group for group in grouped if _keep_group(group, normalized)]
    for group in grouped:
        group["score"] = _apply_generic_signals(group, normalized)
    grouped.sort(key=lambda item: item["score"], reverse=True)

    ids = [group["judgment_id"] for group in grouped if group.get("judgment_id")]
    db_started = time.perf_counter()
    try:
        hydrated = _filtered_judgments(db, ids, filters)
    except SQLAlchemyError as exc:
        logger.error("Database hydration failed: %s", type(exc).__name__)
        raise LegalSearchError("Judgment search is temporarily unavailable because the database cannot be reached.") from exc
    db_ms = (time.perf_counter() - db_started) * 1000

    ordered = []
    for group in grouped:
        judgment = hydrated.get(group.get("judgment_id"))
        if not judgment:
            continue
        ordered.append(_public_hit(
            judgment,
            provider,
            _excerpt(group.get("excerpt_source") or ""),
            group["score"],
            group.get("chunk_index") or "",
            group.get("chunk_id") or "",
        ))

    if sort == "newest":
        ordered.sort(key=lambda x: x["judgment_date"] or "", reverse=True)
    elif sort == "oldest":
        ordered.sort(key=lambda x: x["judgment_date"] or "9999-99-99")

    total = len(ordered)
    total_pages = (total + page_size - 1) // page_size if total else 0
    start = (page - 1) * page_size
    page_results = ordered[start:start + page_size]
    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "legal_search request_id=%s endpoint=judgments/search collection=%s embedding_provider=%s "
        "dense_hits=%s sparse_hits=%s fused=%s grouped=%s results=%s embed_ms=%.1f qdrant_ms=%.1f db_ms=%.1f total_ms=%.1f",
        request_id or "-",
        collection,
        embeddings.provider_name,
        len(dense_points),
        len(sparse_points),
        len(fused),
        len(grouped),
        total,
        embed_ms,
        qdrant_ms,
        db_ms,
        elapsed_ms,
    )
    return _page(page_results, page, page_size, total, total_pages, normalized)


def get_judgment_detail(db: Session, judgment_id: str) -> dict:
    try:
        parsed = uuid.UUID(judgment_id)
    except ValueError as exc:
        raise LegalSearchError("Judgment id is not valid", 400) from exc
    try:
        judgment = db.query(LegalJudgment).filter(LegalJudgment.id == parsed).first()
    except SQLAlchemyError as exc:
        logger.error("Database unavailable during judgment detail: %s", type(exc).__name__)
        raise LegalSearchError("The judgment could not be loaded because the database cannot be reached.") from exc
    if not judgment or (judgment.external_id or "").startswith("oil_judgment_"):
        raise LegalSearchError("Judgment not found", 404)
    chunks = (
        db.query(LegalJudgmentChunk)
        .filter(LegalJudgmentChunk.judgment_id == judgment.id)
        .all()
    )
    if not chunks:
        raise LegalSearchError("Judgment not found", 404)
    chunks.sort(key=lambda chunk: _chunk_sort_key(chunk.chunk_index))
    provider = None
    if judgment.provider_id:
        provider = db.query(LegalProvider).filter(LegalProvider.id == judgment.provider_id).first()
    citations = db.query(LegalCitation).filter(LegalCitation.judgment_id == judgment.id).all()
    citation = judgment.citation or (citations[0].citation if citations else None)
    text_parts = [chunk.text for chunk in chunks if chunk.text]
    return {
        "id": str(judgment.id),
        "case_id": judgment.external_id,
        "title": judgment.title,
        "court": judgment.court or None,
        "citation": citation,
        "judgment_date": judgment.judgment_date.isoformat() if judgment.judgment_date else None,
        "year": _year(judgment),
        "text": "\n\n".join(text_parts),
        "excerpts": [
            {"chunk_index": chunk.chunk_index, "text": chunk.text}
            for chunk in chunks
        ],
        "source": provider.name if provider else "Open India Law",
        "source_url": judgment.source_url or None,
        "source_publisher": judgment.publisher or None,
        "mirror_url": None,
        "provider": provider.name if provider else "Open India Law",
        "provenance": {
            "provider": provider.name if provider else "Open India Law",
            "provider_url": provider.base_url if provider else None,
            "source_url": judgment.source_url or None,
            "source_publisher": judgment.publisher or None,
            "case_id": judgment.external_id,
            "hosted_pdf": False,
        },
    }


def list_filter_options(db: Session) -> dict:
    try:
        rows = (
            db.query(LegalJudgment.court, LegalJudgment.judgment_date)
            .filter(~LegalJudgment.external_id.like("oil_judgment_%"))
            .distinct()
            .all()
        )
        corpus_count = db.query(LegalJudgment).filter(~LegalJudgment.external_id.like("oil_judgment_%")).count()
    except SQLAlchemyError as exc:
        raise LegalSearchError("Filter options are temporarily unavailable because the database cannot be reached.") from exc
    courts = sorted({row.court for row in rows if row.court})
    years = sorted({row.judgment_date.year for row in rows if row.judgment_date})
    return {"courts": courts, "years": years, "sources": ["Open India Law"], "corpus_count": corpus_count}
