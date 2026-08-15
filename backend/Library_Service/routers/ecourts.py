"""
e-Courts India FastAPI Router

Exposes e-Courts service methods as REST endpoints.
"""

import time
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from services.ecourts_service import (
    ECourtsService,
    ECourtsAPIError,
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    NormalizedCase,
    NormalizedOrder,
    NormalizedJudgment,
    NormalizedCauseListItem
)

logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter(
    prefix="/api/v1/library/ecourts",
    tags=["e-Courts India"]
)

# Initialize service
ec_service = ECourtsService()


# Pydantic Models
class HealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    provider: str = Field(..., example="e-Courts India")


class SuccessResponse(BaseModel):
    success: bool = Field(..., example=True)
    data: Optional[dict | list] = Field(None)
    source: Optional[str] = Field(None, example="e-Courts India")


class ErrorResponse(BaseModel):
    success: bool = Field(..., example=False)
    error: str = Field(..., example="An error occurred")


class NormalizedCaseModel(BaseModel):
    id: str
    cnr: str
    case_type: str
    case_number: str
    filing_date: str
    registration_date: str
    first_hearing_date: str
    next_hearing_date: str
    court: str
    petitioner: str
    respondent: str
    case_status: str
    source: str = "e-Courts India"


class NormalizedOrderModel(BaseModel):
    id: str
    date: str
    title: str
    description: str
    order_url: str
    source: str = "e-Courts India"


class NormalizedJudgmentModel(BaseModel):
    id: str
    title: str
    court: str
    citation: str
    date: str
    judges: List[str]
    summary: str
    pdf_url: str
    source: str = "e-Courts India"


class NormalizedCauseListItemModel(BaseModel):
    id: str
    case_number: str
    case_type: str
    petitioner: str
    respondent: str
    judge: str
    purpose: str
    source: str = "e-Courts India"


@router.get("/health", response_model=HealthResponse)
async def health():
    """
    Health check endpoint for e-Courts service.
    """
    start_time = time.perf_counter()
    logger.info("Received health request to /api/v1/library/ecourts/health")
    
    try:
        # For development mode, always return ok
        response = HealthResponse(status="ok", provider="e-Courts India")
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /health | Status: 200 | Execution time: %.4fs",
            end_time - start_time
        )
        return response
    except Exception as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /health | Status: 500 | Execution time: %.4fs | Error: %s",
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail="Health check failed")


@router.get("/search", response_model=SuccessResponse)
async def search_by_cnr_endpoint(
    cnr: str = Query(..., min_length=1, max_length=50, description="CNR number to search for")
):
    """
    Search for a case by CNR number on e-Courts.
    
    Args:
        cnr: CNR (Case Number Reference) (1-50 characters).
        
    Returns:
        Normalized success response with search result.
    """
    start_time = time.perf_counter()
    logger.info(
        "Received search request: /search | cnr: %s",
        cnr
    )
    
    try:
        result = await ec_service.search_by_cnr(cnr)
        
        if not result:
            end_time = time.perf_counter()
            logger.warning(
                "Endpoint: /search | CNR: %s | Status: 404 | Execution time: %.4fs | Error: Case not found",
                cnr,
                end_time - start_time
            )
            raise HTTPException(status_code=404, detail="Case not found")
        
        result_dict = NormalizedCaseModel(**result.__dict__).model_dump()
        
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /search | CNR: %s | Status: 200 | Execution time: %.4fs",
            cnr,
            end_time - start_time
        )
        
        return SuccessResponse(
            success=True,
            data=result_dict,
            source="e-Courts India"
        )
    except AuthenticationError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search | CNR: %s | Status: 401 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=401, detail=str(e))
    except RateLimitError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search | CNR: %s | Status: 429 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=429, detail=str(e))
    except NotFoundError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search | CNR: %s | Status: 404 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=404, detail=str(e))
    except ECourtsAPIError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /search | CNR: %s | Status: 500 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status", response_model=SuccessResponse)
async def get_case_status_endpoint(
    cnr: str = Query(..., min_length=1, max_length=50, description="CNR number to get status for")
):
    """
    Get current case status by CNR number.
    
    Args:
        cnr: CNR (Case Number Reference) (1-50 characters).
        
    Returns:
        Normalized success response with case status.
    """
    start_time = time.perf_counter()
    logger.info(
        "Received status request: /status | cnr: %s",
        cnr
    )
    
    try:
        result = await ec_service.get_case_status(cnr)
        
        if not result:
            end_time = time.perf_counter()
            logger.warning(
                "Endpoint: /status | CNR: %s | Status: 404 | Execution time: %.4fs | Error: Case not found",
                cnr,
                end_time - start_time
            )
            raise HTTPException(status_code=404, detail="Case not found")
        
        result_dict = NormalizedCaseModel(**result.__dict__).model_dump()
        
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /status | CNR: %s | Status: 200 | Execution time: %.4fs",
            cnr,
            end_time - start_time
        )
        
        return SuccessResponse(
            success=True,
            data=result_dict,
            source="e-Courts India"
        )
    except AuthenticationError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /status | CNR: %s | Status: 401 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=401, detail=str(e))
    except RateLimitError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /status | CNR: %s | Status: 429 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=429, detail=str(e))
    except NotFoundError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /status | CNR: %s | Status: 404 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=404, detail=str(e))
    except ECourtsAPIError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /status | CNR: %s | Status: 500 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/orders", response_model=SuccessResponse)
async def get_orders_endpoint(
    cnr: str = Query(..., min_length=1, max_length=50, description="CNR number to get orders for")
):
    """
    Get all orders for a case by CNR number.
    
    Args:
        cnr: CNR (Case Number Reference) (1-50 characters).
        
    Returns:
        Normalized success response with list of orders.
    """
    start_time = time.perf_counter()
    logger.info(
        "Received orders request: /orders | cnr: %s",
        cnr
    )
    
    try:
        results = await ec_service.get_orders(cnr)
        results_dicts = [
            NormalizedOrderModel(**result.__dict__).model_dump()
            for result in results
        ]
        
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /orders | CNR: %s | Status: 200 | Results: %d | Execution time: %.4fs",
            cnr,
            len(results),
            end_time - start_time
        )
        
        return SuccessResponse(
            success=True,
            data=results_dicts,
            source="e-Courts India"
        )
    except AuthenticationError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /orders | CNR: %s | Status: 401 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=401, detail=str(e))
    except RateLimitError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /orders | CNR: %s | Status: 429 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=429, detail=str(e))
    except NotFoundError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /orders | CNR: %s | Status: 404 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=404, detail=str(e))
    except ECourtsAPIError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /orders | CNR: %s | Status: 500 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/judgments", response_model=SuccessResponse)
async def get_judgments_endpoint(
    cnr: str = Query(..., min_length=1, max_length=50, description="CNR number to get judgments for")
):
    """
    Get all judgments for a case by CNR number.
    
    Args:
        cnr: CNR (Case Number Reference) (1-50 characters).
        
    Returns:
        Normalized success response with list of judgments.
    """
    start_time = time.perf_counter()
    logger.info(
        "Received judgments request: /judgments | cnr: %s",
        cnr
    )
    
    try:
        results = await ec_service.get_judgments(cnr)
        results_dicts = [
            NormalizedJudgmentModel(**result.__dict__).model_dump()
            for result in results
        ]
        
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /judgments | CNR: %s | Status: 200 | Results: %d | Execution time: %.4fs",
            cnr,
            len(results),
            end_time - start_time
        )
        
        return SuccessResponse(
            success=True,
            data=results_dicts,
            source="e-Courts India"
        )
    except AuthenticationError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /judgments | CNR: %s | Status: 401 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=401, detail=str(e))
    except RateLimitError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /judgments | CNR: %s | Status: 429 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=429, detail=str(e))
    except NotFoundError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /judgments | CNR: %s | Status: 404 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=404, detail=str(e))
    except ECourtsAPIError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /judgments | CNR: %s | Status: 500 | Execution time: %.4fs | Error: %s",
            cnr,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/causelist", response_model=SuccessResponse)
async def get_cause_list_endpoint(
    court: str = Query(..., min_length=1, max_length=200, description="Court name or identifier"),
    date: str = Query(..., min_length=1, max_length=20, description="Date (format DD-MM-YYYY)")
):
    """
    Get cause list for a specific court and date.
    
    Args:
        court: Court name or identifier (1-200 characters).
        date: Date (1-20 characters, format DD-MM-YYYY).
        
    Returns:
        Normalized success response with cause list.
    """
    start_time = time.perf_counter()
    logger.info(
        "Received cause list request: /causelist | court: %s | date: %s",
        court[:100],
        date
    )
    
    try:
        results = await ec_service.get_cause_list(court, date)
        results_dicts = [
            NormalizedCauseListItemModel(**result.__dict__).model_dump()
            for result in results
        ]
        
        end_time = time.perf_counter()
        logger.info(
            "Endpoint: /causelist | Court: %s | Date: %s | Status: 200 | Results: %d | Execution time: %.4fs",
            court[:100],
            date,
            len(results),
            end_time - start_time
        )
        
        return SuccessResponse(
            success=True,
            data=results_dicts,
            source="e-Courts India"
        )
    except AuthenticationError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /causelist | Court: %s | Date: %s | Status: 401 | Execution time: %.4fs | Error: %s",
            court[:100],
            date,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=401, detail=str(e))
    except RateLimitError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /causelist | Court: %s | Date: %s | Status: 429 | Execution time: %.4fs | Error: %s",
            court[:100],
            date,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=429, detail=str(e))
    except NotFoundError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /causelist | Court: %s | Date: %s | Status: 404 | Execution time: %.4fs | Error: %s",
            court[:100],
            date,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=404, detail=str(e))
    except ECourtsAPIError as e:
        end_time = time.perf_counter()
        logger.error(
            "Endpoint: /causelist | Court: %s | Date: %s | Status: 500 | Execution time: %.4fs | Error: %s",
            court[:100],
            date,
            end_time - start_time,
            str(e)
        )
        raise HTTPException(status_code=500, detail=str(e))
