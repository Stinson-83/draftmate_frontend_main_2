"""
Minimal test server for Indian Kanoon endpoints.
"""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
project_root = Path(__file__).parent.parent.parent
env_path = project_root / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"Loaded .env from {env_path}")

# Fix import paths
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Create a temporary module cache entry for routers
import importlib.util

# Import indiankanoon.py directly
ik_path = Path(__file__).parent / "routers" / "indiankanoon.py"
spec = importlib.util.spec_from_file_location("ik_router", ik_path)
ik_module = importlib.util.module_from_spec(spec)
sys.modules["ik_router"] = ik_module
spec.loader.exec_module(ik_module)

# Import bareacts.py directly
bareacts_path = Path(__file__).parent / "routers" / "bareacts.py"
bareacts_spec = importlib.util.spec_from_file_location("bareacts_router", bareacts_path)
bareacts_module = importlib.util.module_from_spec(bareacts_spec)
sys.modules["bareacts_router"] = bareacts_module
bareacts_spec.loader.exec_module(bareacts_module)

app = FastAPI(title="Indian Kanoon Test Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ik_module.router)
app.include_router(bareacts_module.router)


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
def get_integration_status():
    providers = [
        Provider(
            id="indiankanoon",
            name="Indian Kanoon",
            status="connected",
            health="healthy",
            configured=True,
            features=["Judgment Search", "Judgment Details", "AI Summary"]
        ),
        Provider(
            id="ecourts",
            name="e-Courts India",
            status="not_configured",
            configured=False
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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8010)
