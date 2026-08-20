import time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

from services.ecourts_service import ECourtsService, ECourtsAPIError

router = APIRouter(tags=["e-Courts Integration"])

class ECourtsStatusResponse(BaseModel):
    connected: bool
    authenticated: bool
    latency: int
    api_version: str
    account: str
    last_checked: Optional[float]
    error: Optional[str]

@router.get("/api/v1/integrations/ecourts/status", response_model=ECourtsStatusResponse)
async def get_ecourts_status():
    ec_service = ECourtsService()
    return ECourtsStatusResponse(
        connected=True if ec_service.api_key else False,
        authenticated=False,
        latency=0,
        api_version="v1",
        account="e-Courts India",
        last_checked=None,
        error=None
    )

@router.post("/api/v1/integrations/ecourts/test", response_model=ECourtsStatusResponse)
async def test_ecourts_connection():
    ec_service = ECourtsService()
    start_time = time.perf_counter()
    
    if not ec_service.api_key:
        return ECourtsStatusResponse(
            connected=False,
            authenticated=False,
            latency=0,
            api_version="v1",
            account="e-Courts India",
            last_checked=time.time(),
            error="API key not configured"
        )
        
    try:
        # Bypass the internal health_check boolean to get the exact exception
        await ec_service._make_request("/health")
        latency = int((time.perf_counter() - start_time) * 1000)
        return ECourtsStatusResponse(
            connected=True,
            authenticated=True,
            latency=latency,
            api_version="v1",
            account="e-Courts India",
            last_checked=time.time(),
            error=None
        )
    except Exception as e:
        latency = int((time.perf_counter() - start_time) * 1000)
        return ECourtsStatusResponse(
            connected=False,
            authenticated=False,
            latency=latency,
            api_version="v1",
            account="e-Courts India",
            last_checked=time.time(),
            error=str(e)
        )
