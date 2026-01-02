from fastapi import FastAPI, HTTPException, Body, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
import httpx
from dotenv import load_dotenv

# Import the logic function from legal_draft.py
# Assuming legal_draft.py is in the same directory
from legal_draft import generate_legal_draft

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Legal Draft Generator API",
    description="API for generating legal drafts using Google Gemini",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth:8009")

async def verify_token(request: Request):
    """
    Verify session token with Auth Service.
    Expects 'Authorization: Bearer <session_id>' or 'session_id' in body.
    """
    # 1. Try Authorization header
    auth_header = request.headers.get("Authorization")
    session_id = None
    if auth_header and auth_header.startswith("Bearer "):
        session_id = auth_header.split(" ")[1]
    
    # 2. Try body
    if not session_id:
        try:
            body = await request.json()
            session_id = body.get("session_id")
        except:
            pass

    if not session_id:
        raise HTTPException(status_code=401, detail="Missing session_id or Authorization header")

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{AUTH_SERVICE_URL}/verify_session/{session_id}")
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            return resp.json().get("user_id")
    except httpx.RequestError as e:
        print(f"Auth service connection failed: {e}")
        raise HTTPException(status_code=500, detail="Auth service unavailable")

class DraftRequest(BaseModel):
    case_context: str
    legal_documents: Optional[str] = None
    document_type: Optional[str] = None
    api_key: Optional[str] = None
    session_id: Optional[str] = None # Added for auth

@app.get("/")
def read_root():
    return {"message": "Legal Draft Generator API is running"}

@app.post("/generate")
def generate_draft_endpoint(request: DraftRequest, user_id: str = Depends(verify_token)):
    try:
        # Use provided API key or fall back to environment variable
        api_key = os.getenv("GOOGLE_API_KEY")
        
        draft = generate_legal_draft(
            case_context=request.case_context,
            legal_documents=request.legal_documents,
            document_type=request.document_type
        )
        return {"draft": draft}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("Drafter:app", host="0.0.0.0", port=8003, reload=True)
