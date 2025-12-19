from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
import os
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

class DraftRequest(BaseModel):
    case_context: str
    legal_documents: Optional[str] = None
    document_type: Optional[str] = None
    api_key: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Legal Draft Generator API is running"}

@app.post("/generate")
def generate_draft_endpoint(request: DraftRequest):
    try:
        # Use provided API key or fall back to environment variable
        api_key =os.getenv("GOOGLE_API_KEY")
        
        draft = generate_legal_draft(
            case_context=request.case_context,
            legal_documents=request.legal_documents,
            document_type=request.document_type
        )
        return {"draft": draft}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("Drafter:app", host="0.0.0.0", port=8001, reload=True)
