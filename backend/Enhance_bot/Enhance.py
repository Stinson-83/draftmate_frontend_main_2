from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
import os

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from bot import enhance_content, enhance_clause, create_placeholders

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EnhanceContentRequest(BaseModel):
    selected_text: str
    user_context: str

class EnhanceClauseRequest(BaseModel):
    selected_text: str
    case_context: str

class CreatePlaceholdersRequest(BaseModel):
    html_content: str

@app.post("/enhance_content")
async def enhance_content_endpoint(request: EnhanceContentRequest):
    try:
        print(f"Received enhance content request...")
        
        # Call the new function
        enhanced_text = enhance_content(
            request.selected_text, 
            request.user_context
        )
        
        # Check for errors from backend
        if enhanced_text.startswith("Error:"):
            error_msg = enhanced_text[7:]
            if "429" in error_msg or "exhausted" in error_msg.lower():
                raise HTTPException(status_code=429, detail="API Quota Exceeded. Please try again later.")
            raise HTTPException(status_code=500, detail=error_msg)

        return {"enhanced_text": enhanced_text}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/enhance_clause")
async def enhance_clause_endpoint(request: EnhanceClauseRequest):
    try:
        print(f"Received enhance clause request...")
        
        # Call the clause enhancement function
        enhanced_text = enhance_clause(
            request.selected_text, 
            request.case_context
        )
        
        # Check for errors from backend
        if enhanced_text.startswith("Error:"):
            error_msg = enhanced_text[7:]
            if "429" in error_msg or "exhausted" in error_msg.lower():
                raise HTTPException(status_code=429, detail="API Quota Exceeded. Please try again later.")
            raise HTTPException(status_code=500, detail=error_msg)
        
        return {"enhanced_text": enhanced_text}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create_placeholders")
async def create_placeholders_endpoint(request: CreatePlaceholdersRequest):
    try:
        print("Received create placeholders request...")
        
        processed_html = create_placeholders(request.html_content)
        
        return {"processed_html": processed_html}

    except Exception as e:
        print(f"Error processing placeholder request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8002)
