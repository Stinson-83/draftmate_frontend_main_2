import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Optional

from database import get_db
from services.legal_search import LegalSearchError, list_filter_options
from services.indiankanoon_service import IndianKanoonService
from services.providers.open_india_law import OpenIndiaLawProvider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/legal", tags=["Legal Search"])
ik_service = IndianKanoonService()


class JudgmentHit(BaseModel):
    id: str
    case_id: Optional[str] = None
    title: str
    court: Optional[str] = None
    citation: Optional[str] = None
    judgment_date: Optional[str] = None
    year: Optional[int] = None
    excerpt: Optional[str] = None
    source: Optional[str] = None
    source_url: Optional[str] = None
    source_publisher: Optional[str] = None
    relevance: float = 0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class JudgmentSearchResponse(BaseModel):
    results: List[JudgmentHit]
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool
    query: str = ""


class JudgmentDetailResponse(BaseModel):
    id: str
    case_id: Optional[str] = None
    title: str
    court: Optional[str] = None
    citation: Optional[str] = None
    judgment_date: Optional[str] = None
    year: Optional[int] = None
    text: str = ""
    excerpts: List[Dict[str, Any]] = Field(default_factory=list)
    source: Optional[str] = None
    source_url: Optional[str] = None
    source_publisher: Optional[str] = None
    mirror_url: Optional[str] = None
    provider: Optional[str] = None
    provenance: Dict[str, Any] = Field(default_factory=dict)


class FilterOptionsResponse(BaseModel):
    courts: List[str]
    years: List[int]
    sources: List[str]
    corpus_count: int = 0


class LegalActResponse(BaseModel):
    id: str
    title: str
    act_number: Optional[str] = None
    year: Optional[str] = None

    class Config:
        from_attributes = True


def _raise_search_error(exc: LegalSearchError) -> None:
    raise HTTPException(status_code=exc.status_code, detail=exc.public_message)


@router.get("/judgments/search", response_model=JudgmentSearchResponse)
async def search_legal_judgments(
    q: str = Query("", max_length=500),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    court: str = Query("", max_length=255),
    year_from: Optional[int] = Query(None, ge=1800, le=2100),
    year_to: Optional[int] = Query(None, ge=1800, le=2100),
    jurisdiction: str = Query("", max_length=255),
    citation: str = Query("", max_length=512),
    act: str = Query("", max_length=255),
    section: str = Query("", max_length=64),
    source: str = Query("", max_length=255),
    sort: str = Query("relevance", max_length=64),
):
    request_id = uuid.uuid4().hex[:12]
    filters = {
        "court": court,
        "year_from": year_from,
        "year_to": year_to,
        "citation": citation,
        "act": act,
        "section": section,
        "sort": sort,
    }

    try:
        results = await ik_service.search_judgments(q, page=page, filters=filters)

        hits = []
        for r in results:
            # Extract year from date string if possible
            year = None
            if r.date:
                import re
                m = re.search(r'\b(19|20)\d{2}\b', r.date)
                if m:
                    year = int(m.group())

            hits.append(JudgmentHit(
                id=r.id,
                case_id=r.id,
                title=r.title,
                court=r.court,
                citation=r.citation,
                judgment_date=r.date,
                year=year,
                excerpt=r.summary,
                source="Indian Kanoon",
                source_url=r.pdf_url,
                source_publisher="Indian Kanoon",
                relevance=1.0,
                metadata={"judges": r.judges}
            ))

        return JudgmentSearchResponse(
            results=hits[:page_size],
            page=page,
            page_size=page_size,
            total=1000, # IK doesn't return exact total easily without parsing DOM, fake for pagination UI
            total_pages=100,
            has_next=len(hits) > 0,
            has_previous=page > 1,
            query=q
        )
    except Exception as exc:
        logger.exception("IK Search Error")
        raise HTTPException(status_code=500, detail="Search failed")


@router.get("/judgments/recent", response_model=JudgmentSearchResponse)
async def get_recent_judgments(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50)
):
    filters = {"sort": "newest"}
    try:
        results = await ik_service.search_judgments("", page=page, filters=filters)
        hits = []
        for r in results:
            year = None
            if r.date:
                import re
                m = re.search(r'\b(19|20)\d{2}\b', r.date)
                if m:
                    year = int(m.group())

            hits.append(JudgmentHit(
                id=r.id,
                case_id=r.id,
                title=r.title,
                court=r.court,
                citation=r.citation,
                judgment_date=r.date,
                year=year,
                excerpt=r.summary,
                source="Indian Kanoon",
                source_url=r.pdf_url,
                source_publisher="Indian Kanoon",
                relevance=1.0
            ))

        return JudgmentSearchResponse(
            results=hits[:page_size],
            page=page,
            page_size=page_size,
            total=1000,
            total_pages=100,
            has_next=len(hits) > 0,
            has_previous=page > 1,
            query=""
        )
    except Exception as exc:
        logger.exception("IK Recent Search Error")
        raise HTTPException(status_code=500, detail="Recent fetch failed")


@router.get("/judgments/filters", response_model=FilterOptionsResponse)
def judgment_filters(db: Session = Depends(get_db)):
    try:
        return list_filter_options(db)
    except LegalSearchError as exc:
        _raise_search_error(exc)


@router.get("/judgments/{judgment_id}", response_model=JudgmentDetailResponse)
async def get_legal_judgment(judgment_id: str):
    try:
        metadata = await ik_service.get_document_metadata(judgment_id)
        text = await ik_service.get_document(judgment_id)

        year = None
        if metadata and metadata.date:
            import re
            m = re.search(r'\b(19|20)\d{2}\b', metadata.date)
            if m:
                year = int(m.group())

        return JudgmentDetailResponse(
            id=judgment_id,
            case_id=judgment_id,
            title=metadata.title if metadata else f"Judgment {judgment_id}",
            court=metadata.court if metadata else None,
            citation=metadata.citation if metadata else None,
            judgment_date=metadata.date if metadata else None,
            year=year,
            text=text or "",
            excerpts=[],
            source="Indian Kanoon",
            source_url=f"https://indiankanoon.org/doc/{judgment_id}/",
            source_publisher="Indian Kanoon",
            provider="indian_kanoon",
            provenance={"provider_url": f"https://indiankanoon.org/doc/{judgment_id}/"}
        )
    except Exception as exc:
        logger.exception("IK Detail Error")
        raise HTTPException(status_code=500, detail="Failed to fetch judgment details")

@router.get("/judgments/{judgment_id}/pdf")
async def get_judgment_pdf(judgment_id: str):
    try:
        metadata = await ik_service.get_document_metadata(judgment_id)
        text = await ik_service.get_document(judgment_id)

        # Build HTML content
        html_content = f"""
        <html>
        <head>
            <style>
                @page {{ size: a4 portrait; margin: 2cm; }}
                body {{ font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; }}
                h1 {{ text-align: center; font-size: 18px; margin-bottom: 20px; }}
                .meta {{ margin-bottom: 20px; }}
                .meta p {{ margin: 2px 0; }}
                .content {{ text-align: justify; }}
            </style>
        </head>
        <body>
            <h1>{metadata.title if metadata else 'Judgment'}</h1>
            <div class="meta">
                {f'<p><strong>Court:</strong> {metadata.court}</p>' if metadata and metadata.court else ''}
                {f'<p><strong>Citation:</strong> {metadata.citation}</p>' if metadata and metadata.citation else ''}
                {f'<p><strong>Date:</strong> {metadata.date}</p>' if metadata and metadata.date else ''}
            </div>
            <hr/>
            <div class="content">
                {text or "No judgment text available."}
            </div>
        </body>
        </html>
        """

        from xhtml2pdf import pisa
        from io import BytesIO

        pdf_file = BytesIO()
        pisa_status = pisa.CreatePDF(html_content, dest=pdf_file)

        if pisa_status.err:
            raise HTTPException(status_code=500, detail="PDF generation failed")

        pdf_file.seek(0)

        headers = {
            'Content-Disposition': f'attachment; filename="Judgment_{judgment_id}.pdf"'
        }

        return Response(content=pdf_file.read(), media_type="application/pdf", headers=headers)

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("PDF Generation Error")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")



@router.get("/acts/search", response_model=List[LegalActResponse])
async def search_acts(
    q: str = Query(..., min_length=1, max_length=500),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    try:
        provider = OpenIndiaLawProvider(db)
        return await provider.search_legislation(query=q, limit=limit) or []
    except Exception:
        logger.exception("Legislation search failed")
        raise HTTPException(status_code=503, detail="Legislation search is temporarily unavailable.")


@router.get("/acts/{act_id}", response_model=LegalActResponse)
async def get_act(act_id: str, db: Session = Depends(get_db)):
    provider = OpenIndiaLawProvider(db)
    result = await provider.get_act(act_id)
    if not result:
        raise HTTPException(status_code=404, detail="Act not found")
    return result
