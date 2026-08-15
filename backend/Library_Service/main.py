from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
from dotenv import load_dotenv
from database import engine, Base
from sqlalchemy import text
from routers import clients, cases, hearings, calendar, video_links, case_tracking, notes, bookmarks, indiankanoon, bareacts, ecourts

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure folders and documents columns exist in library_cases table for production DMS integration
try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE library_cases ADD COLUMN IF NOT EXISTS folders JSONB DEFAULT '[]'::jsonb;"))
        conn.execute(text("ALTER TABLE library_cases ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;"))
        conn.commit()
        logger.info("Checked and updated library_cases schema for DMS compatibility.")
except Exception as schema_err:
    logger.warning(f"Schema update check completed with notice: {schema_err}")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="DraftMate Library Service", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Setup
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS = (
    ["*"]
    if ENVIRONMENT == "development"
    else [
        os.getenv("FRONTEND_URL_PROD", "https://draftmate.ai"),
        os.getenv("FRONTEND_URL_DEV", "http://localhost:5173"),
    ]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy", "service": "library"}


# Integration Status Endpoint
from pydantic import BaseModel
from typing import List, Optional

class Provider(BaseModel):
    id: str
    name: Optional[str] = None
    status: str
    health: Optional[str] = None
    configured: bool
    features: Optional[List[str]] = None

class IntegrationStatusResponse(BaseModel):
    overall: str
    providers: List[Provider]


@app.get("/api/v1/library/integrations/status", tags=["integrations"], response_model=IntegrationStatusResponse)
async def get_integration_status():
    # Check Indian Kanoon status
    ik_healthy = False
    try:
        from services.indiankanoon_service import IndianKanoonService
        ik_service = IndianKanoonService()
        if ik_service.api_key:
            ik_healthy = True
    except:
        pass
    
    # For development mode, e-Courts is always healthy
    ec_healthy = True
    
    providers = [
        Provider(
            id="indiankanoon",
            name="Indian Kanoon",
            status="connected",
            health="healthy" if ik_healthy else "degraded",
            configured=True,
            features=["Judgment Search", "Judgment Details", "AI Summary"]
        ),
        Provider(
            id="ecourts",
            name="e-Courts India",
            status="connected" if ec_healthy else "not_configured",
            health="healthy" if ec_healthy else "degraded",
            configured=ec_healthy,
            features=["CNR Search", "Case Status Tracking", "Order Download", "Judgment Download", "Cause List"]
        ),
        Provider(
            id="surepass",
            name="Surepass",
            status="not_configured",
            configured=False
        )
    ]
    
    overall = "healthy"
    for p in providers:
        if p.status == "not_configured":
            continue
        if p.health != "healthy":
            overall = "degraded"
            break
    
    return IntegrationStatusResponse(overall=overall, providers=providers)


# Include routers with prefix /api/v1/library
app.include_router(clients.router, prefix="/api/v1/library")
app.include_router(cases.router, prefix="/api/v1/library")
app.include_router(hearings.router, prefix="/api/v1/library")
app.include_router(calendar.router, prefix="/api/v1/library")
app.include_router(video_links.router, prefix="/api/v1/library")
app.include_router(case_tracking.router, prefix="/api/v1/library")
app.include_router(notes.router, prefix="/api/v1/library")
app.include_router(bookmarks.router, prefix="/api/v1/library")

# Include Indian Kanoon router (already has prefix)
app.include_router(indiankanoon.router)
# Include Bare Acts router (already has prefix)
app.include_router(bareacts.router)
# Include e-Courts router (already has prefix)
app.include_router(ecourts.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)
