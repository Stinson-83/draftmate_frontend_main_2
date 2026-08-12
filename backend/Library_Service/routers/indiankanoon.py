"""
Indian Kanoon FastAPI Router

Exposes Indian Kanoon service methods as REST endpoints.
"""

import time
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from services import (
    IndianKanoonService,
    IndianKanoonAPIError,
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    NormalizedJudgment
)

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(
    prefix="/api/v1/library/indiankanoon",
    tags=["Indian Kanoon"]
)

# Initialize service
ik_service = IndianKanoonService()


# Pydantic Models
class PingResponse(BaseModel):
    status: str = Field(..., example="ok")
    provider: str = Field(..., example="Indian Kanoon")


class SuccessResponse(BaseModel):
    success: bool = Field(..., example=True)
    data: Optional[dict | list] = Field(None)
    source: Optional[str] = Field(None, example="Indian Kanoon")


class ErrorResponse(BaseModel):
    success: bool = Field(..., example=False)
    error: str = Field(..., example="An error occurred")


class NormalizedJudgmentModel(BaseModel):
    id: str
    title: str
    court: str
    citation: str
    date: str
    judges: List[str]
    summary: str
    pdf_url: str
    source: str = "Indian Kanoon"


@router.get("/ping", response_model=PingResponse)
async def ping():
    """
    Health check endpoint for Indian Kanoon service.
    """
    start_time = time.perf_counter()
    logger.info("Received ping request to /api/v1/library/indiankanoon/ping")
    
    try:
        response = PingResponse(status="ok", provider="Indian Kanoon")
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /ping | Status: 200 | Execution time: %.4fs",
            end_time - start_time
        )
        return response
    except Exception as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /ping | Status: 500 | Execution time: %.4fs | Error: %s",
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail="Ping failed")


@router.get("/search", response_model=SuccessResponse)
async def search_judgments_endpoint(
    query: str = Query(..., min_length=1, max_length=200, description="Search query"),
    page: int = Query(1, ge=1, description="Page number (1-based)")
):
    """
    Search for judgments on Indian Kanoon.
    
    Args:
        query: Search query string (1-200 characters).
        page: Page number for pagination (minimum 1).
        
    Returns:
        Normalized success response with search results.
    """
    start_time = time.perf_counter()
    logger.info(
        "Received search request: /search | query: %s | page: %d",
        query[:100],
        page
    )
    
    try:
        results = await ik_service.search_judgments(query, page)
        results_dicts = [
            NormalizedJudgmentModel(**result.__dict__).model_dump()
            for result in results
        ]
        
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /search | Query: %s | Status: 200 | Results: %d | Execution time: %.4fs",
            query[:100],
            len(results),
            end_time - start_time
        )
        
        return SuccessResponse(
            success=True,
            data={"results": results_dicts, "page": page, "count": len(results_dicts)},
            source="Indian Kanoon"
        )
    except AuthenticationError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search | Query: %s | Status: 401 | Execution time: %.4fs | Error: %s",
            query[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=401, detail=str(e))
    except RateLimitError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search | Query: %s | Status: 429 | Execution time: %.4fs | Error: %s",
            query[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=429, detail=str(e))
    except NotFoundError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search | Query: %s | Status: 404 | Execution time: %.4fs | Error: %s",
            query[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=404, detail=str(e))
    except IndianKanoonAPIError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search | Query: %s | Status: 500 | Execution time: %.4fs | Error: %s",
            query[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/document/{doc_id}", response_model=SuccessResponse)
async def get_document_endpoint(doc_id: str):
    """
    Get full text of a document.
    
    Args:
        doc_id: Indian Kanoon document ID.
        
    Returns:
        Normalized success response with document text.
    """
    start_time = time.perf_counter()
    logger.info("Received get document request: /document/%s", doc_id)
    
    try:
        doc_text = await ik_service.get_document(doc_id)
        
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /document/%s | Status: 200 | Execution time: %.4fs",
            doc_id,
            end_time - start_time
        )
        
        return SuccessResponse(
            success=True,
            data={"id": doc_id, "text": doc_text},
            source="Indian Kanoon"
        )
    except AuthenticationError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /document/%s | Status: 401 | Execution time: %.4fs | Error: %s",
            doc_id,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=401, detail=str(e))
    except RateLimitError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /document/%s | Status: 429 | Execution time: %.4fs | Error: %s",
            doc_id,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=429, detail=str(e))
    except NotFoundError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /document/%s | Status: 404 | Execution time: %.4fs | Error: %s",
            doc_id,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=404, detail=str(e))
    except IndianKanoonAPIError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /document/%s | Status: 500 | Execution time: %.4fs | Error: %s",
            doc_id,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/document/{doc_id}/metadata", response_model=SuccessResponse)
async def get_document_metadata_endpoint(doc_id: str):
    """
    Get metadata for a document without full text.
    
    Args:
        doc_id: Indian Kanoon document ID.
        
    Returns:
        Normalized success response with document metadata.
    """
    start_time = time.perf_counter()
    logger.info("Received get document metadata request: /document/%s/metadata", doc_id)
    
    try:
        metadata = await ik_service.get_document_metadata(doc_id)
        
        if not metadata:
            end_time = time.perf_counter()
            logger.warning(
                "Endpoint: /document/%s/metadata | Status: 404 | Execution time: %.4fs | Error: Document not found",
                doc_id,
                end_time - start_time
            )
            raise HTTPException(status_code=404, detail="Document metadata not found")
        
        metadata_dict = NormalizedJudgmentModel(**metadata.__dict__).model_dump()
        
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /document/%s/metadata | Status: 200 | Execution time: %.4fs",
            doc_id,
            end_time - start_time
        )
        
        return SuccessResponse(
            success=True,
            data=metadata_dict,
            source="Indian Kanoon"
        )
    except AuthenticationError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /document/%s/metadata | Status: 401 | Execution time: %.4fs | Error: %s",
            doc_id,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=401, detail=str(e))
    except RateLimitError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /document/%s/metadata | Status: 429 | Execution time: %.4fs | Error: %s",
            doc_id,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=429, detail=str(e))
    except NotFoundError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /document/%s/metadata | Status: 404 | Execution time: %.4fs | Error: %s",
            doc_id,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=404, detail=str(e))
    except IndianKanoonAPIError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /document/%s/metadata | Status: 500 | Execution time: %.4fs | Error: %s",
            doc_id,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/citation", response_model=SuccessResponse)
async def search_by_citation_endpoint(
    citation: str = Query(..., min_length=1, max_length=200, description="Citation to search for")
):
    """
    Search for judgments by citation.
    
    Args:
        citation: Citation string (1-200 characters).
        
    Returns:
        Normalized success response with search results.
    """
    start_time = time.perf_counter()
    logger.info("Received search by citation request: /search/citation | citation: %s", citation[:100])
    
    try:
        results = await ik_service.search_by_citation(citation)
        results_dicts = [
            NormalizedJudgmentModel(**result.__dict__).model_dump()
            for result in results
        ]
        
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /search/citation | Citation: %s | Status: 200 | Results: %d | Execution time: %.4fs",
            citation[:100],
            len(results),
            end_time - start_time
        )
        
        return SuccessResponse(
            success=True,
            data={"results": results_dicts, "count": len(results_dicts)},
            source="Indian Kanoon"
        )
    except AuthenticationError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search/citation | Citation: %s | Status: 401 | Execution time: %.4fs | Error: %s",
            citation[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=401, detail=str(e))
    except RateLimitError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search/citation | Citation: %s | Status: 429 | Execution time: %.4fs | Error: %s",
            citation[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=429, detail=str(e))
    except NotFoundError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search/citation | Citation: %s | Status: 404 | Execution time: %.4fs | Error: %s",
            citation[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=404, detail=str(e))
    except IndianKanoonAPIError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search/citation | Citation: %s | Status: 500 | Execution time: %.4fs | Error: %s",
            citation[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/act", response_model=SuccessResponse)
async def search_by_act_endpoint(
    act: str = Query(..., min_length=1, max_length=200, description="Act name to search for")
):
    """
    Search for judgments related to a specific act.
    
    Args:
        act: Act name (1-200 characters).
        
    Returns:
        Normalized success response with search results.
    """
    start_time = time.perf_counter()
    logger.info("Received search by act request: /search/act | act: %s", act[:100])
    
    try:
        results = await ik_service.search_by_act(act)
        results_dicts = [
            NormalizedJudgmentModel(**result.__dict__).model_dump()
            for result in results
        ]
        
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /search/act | Act: %s | Status: 200 | Results: %d | Execution time: %.4fs",
            act[:100],
            len(results),
            end_time - start_time
        )
        
        return SuccessResponse(
            success=True,
            data={"results": results_dicts, "count": len(results_dicts)},
            source="Indian Kanoon"
        )
    except AuthenticationError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search/act | Act: %s | Status: 401 | Execution time: %.4fs | Error: %s",
            act[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=401, detail=str(e))
    except RateLimitError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search/act | Act: %s | Status: 429 | Execution time: %.4fs | Error: %s",
            act[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=429, detail=str(e))
    except NotFoundError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search/act | Act: %s | Status: 404 | Execution time: %.4fs | Error: %s",
            act[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=404, detail=str(e))
    except IndianKanoonAPIError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search/act | Act: %s | Status: 500 | Execution time: %.4fs | Error: %s",
            act[:100],
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))
