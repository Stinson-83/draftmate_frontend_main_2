from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from main_file import s3_client
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import traceback
from parse_s3_uri import parse_s3_uri
load_dotenv()

from QueryParsing import normalize_query
from main_file import get_best_template, download_from_s3

from contextlib import asynccontextmanager
import sql

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start tunnel and connection pool
    sql.start_tunnel_and_pool()
    yield
    # Shutdown: Stop tunnel and connection pool
    sql.stop_tunnel_and_pool()

app = FastAPI(title="Legal Query Service", lifespan=lifespan)

# CORS middleware- allows the front end to communictae to backend
#- here any frontend has access to our backend services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class QueryRequest(BaseModel):
    user_query: str
    language: Optional[str] = "en"

class TemplateResult(BaseModel):
    title: str
    doc_id: str
    score: float
    s3_path: str
    alternatives: List[dict]

class HealthResponse(BaseModel):
    ok: bool
    service: str

# ==================== Health & Diagnostics ====================

@app.get("/", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return {"ok": True, "service": "legal-query"}

@app.get("/diag")
async def diagnostics():
    """Diagnostics: check environment and database connectivity."""
    try:
        # Check .env loaded
        google_key = os.getenv("GOOGLE_API_KEY")
        postgres_dsn = os.getenv("POSTGRES_DSN")
        aws_key = os.getenv("AWS_ACCESS_KEY_ID")
        
        # Try to connect to DB
        db_status = "unknown"
        try:
            import psycopg2
            conn = psycopg2.connect(postgres_dsn)
            conn.close()
            db_status = "connected"
        except Exception as db_err:
            db_status = f"failed: {str(db_err)[:100]}"
        
        return {
            "ok": True,
            "google_api_configured": bool(google_key),
            "postgres_dsn_configured": bool(postgres_dsn),
            "aws_configured": bool(aws_key),
            "postgres_status": db_status,
            "env_path": str(Path(__file__).parent / "queries" / "env")
        }
    except Exception as e:
        return {
            "ok": False,
            "error": str(e),
            "traceback": traceback.format_exc()
       }

# ==================== Main Query Endpoints ====================

from fastapi.responses import StreamingResponse
import json
import asyncio

@app.post("/search")
async def search_template(request: QueryRequest):
    """
    Search for best matching legal template by user query.
    Uses StreamingResponse to prevent LB timeouts (504) by sending keep-alive whitespace.
    """
    async def generate():
        try:
            print(f"[search] query: {request.user_query} | lang: {request.language}")
            
            # Run search in background thread
            loop = asyncio.get_running_loop()
            future = loop.run_in_executor(
                None,
                lambda: get_best_template(request.user_query)
            )
            
            # Send keep-alive whitespace every 2 seconds
            while not future.done():
                yield " " 
                done, pending = await asyncio.wait([future], timeout=2.0)
                if done:
                    break
            
            # Get result
            result, scored = await future
            
            if not result:
                # Return 404-like JSON error structure since we can't change status code now
                # But frontend expects result or error.
                # If we yield valid JSON, response.json() works.
                # If we yield error JSON, frontend might need to check "error" field?
                # Existing frontend checks response.ok. 
                # StreamingResponse is always 200 OK once started.
                # So we must return a JSON that frontend handles gracefully or check if result is null.
                # DraftingModal.jsx: const result = await response.json();
                # It expects result.doc_id etc.
                # If we return empty object or specific error field?
                # Let's return a structure that causes a handled error or empty list.
                yield json.dumps({"error": "No matching templates found", "alternatives": []})
            else:
                yield json.dumps(result)
                
        except Exception as e:
            print(f"[search] error: {e}\n{traceback.format_exc()}")
            yield json.dumps({"error": str(e)})

    return StreamingResponse(
        generate(), 
        media_type="application/json",
        headers={"X-Accel-Buffering": "no"}
    )


@app.post("/download-template")
async def download_template(request: BaseModel):
    """
    Download a template from S3 to local storage.
    
    Args:
        s3_path: S3 URI (e.g., s3://bucket/docs/id/file.pdf)
    
    Returns:
        Local file path where the template was downloaded
    """
    try:
        s3_path = getattr(request, 's3_path', None) or request.dict().get('s3_path')
        if not s3_path:
            raise HTTPException(status_code=400, detail="s3_path required")
        
        print(f"[download-template] s3_path: {s3_path}")
        local_path = download_from_s3(s3_path)
        
        return {
            "ok": True,
            "s3_path": s3_path,
            "local_path": local_path,
            "filename": Path(local_path).name
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[download-template] error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Download error: {str(e)}")

@app.post("/download-template-html", response_class=HTMLResponse)
async def download_template_html(payload: dict):
    s3_path = payload.get("s3_path")
    if not s3_path:
        raise HTTPException(status_code=400, detail="s3_path required")

    try:
        bucket, key = parse_s3_uri(s3_path)
        obj = s3_client.get_object(Bucket=bucket, Key=key)

        # Read the raw bytes
        html_bytes = obj["Body"].read()

        # Decode to UTF-8 text (HTML)
        html_text = html_bytes.decode("utf-8", errors="replace")

        # Return raw HTML to frontend
        return HTMLResponse(content=html_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
# ==================== Error Handlers ====================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Catch-all exception handler for unhandled errors."""
    return {
        "ok": False,
        "error": str(exc),
        "detail": traceback.format_exc()
    }
