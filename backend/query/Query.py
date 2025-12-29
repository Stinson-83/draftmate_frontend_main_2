from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import traceback
from pathlib import Path
from dotenv import load_dotenv
import boto3
import psycopg2

from contextlib import asynccontextmanager

from QueryParsing import normalize_query
from main_file import get_best_template, download_from_s3
from parse_s3_uri import parse_s3_uri
import sql

# ============================================================
# ENV & AWS CLIENT (IAM ROLE BASED)
# ============================================================

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_REGION = os.getenv("S3_BUCKET_REGION", AWS_REGION)
POSTGRES_DSN = os.getenv("POSTGRES_DSN")

if not POSTGRES_DSN:
    raise RuntimeError("POSTGRES_DSN is required")

s3_client = boto3.client(
    "s3",
    region_name=S3_BUCKET_REGION
)

# ============================================================
# FastAPI Lifecycle
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Direct DB pool – NO SSH TUNNEL on App Runner
    sql.init_pool(POSTGRES_DSN)
    yield
    sql.close_pool()

app = FastAPI(title="Legal Query Service", lifespan=lifespan)

# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Models
# ============================================================

class QueryRequest(BaseModel):
    user_query: str
    language: Optional[str] = "en"

class TemplateResult(BaseModel):
    title: str
    doc_id: str
    score: float
    s3_path: str
    alternatives: List[dict]

class DownloadRequest(BaseModel):
    s3_path: str

class HealthResponse(BaseModel):
    ok: bool
    service: str

# ============================================================
# Health & Diagnostics
# ============================================================

@app.get("/", response_model=HealthResponse)
async def health():
    return {"ok": True, "service": "legal-query"}

@app.get("/diag")
async def diagnostics():
    try:
        # DB check
        try:
            conn = psycopg2.connect(POSTGRES_DSN)
            conn.close()
            db_status = "connected"
        except Exception as e:
            db_status = f"failed: {str(e)[:120]}"

        # IAM role check (S3)
        iam_ok = True
        try:
            s3_client.list_buckets()
        except Exception:
            iam_ok = False

        return {
            "ok": True,
            "postgres_status": db_status,
            "iam_role_active": iam_ok,
            "aws_region": AWS_REGION
        }

    except Exception as e:
        return {
            "ok": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

# ============================================================
# Core API
# ============================================================

@app.post("/search", response_model=TemplateResult)
async def search_template(request: QueryRequest):
    try:
        result, scored = get_best_template(request.user_query)

        if not result:
            raise HTTPException(status_code=404, detail="No matching templates found")

        return TemplateResult(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Search error: {str(e)}"
        )

# ============================================================
# Downloads
# ============================================================

@app.post("/download-template")
async def download_template(request: DownloadRequest):
    try:
        local_path = download_from_s3(request.s3_path)

        return {
            "ok": True,
            "s3_path": request.s3_path,
            "local_path": local_path,
            "filename": Path(local_path).name
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Download error: {str(e)}"
        )

@app.post("/download-template-html", response_class=HTMLResponse)
async def download_template_html(request: DownloadRequest):
    try:
        bucket, key = parse_s3_uri(request.s3_path)
        obj = s3_client.get_object(Bucket=bucket, Key=key)

        html_text = obj["Body"].read().decode("utf-8", errors="replace")
        return HTMLResponse(content=html_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================
# Global Error Handler
# ============================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return {
        "ok": False,
        "error": str(exc),
        "traceback": traceback.format_exc()
    }