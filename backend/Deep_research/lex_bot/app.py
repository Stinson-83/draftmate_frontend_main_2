"""
Lex Bot v2 - FastAPI Application (Production)

Endpoints:
- GET  /                      : Health check
- POST /chat/fast             : Fast mode (quick responses)
- POST /chat/reasoning        : Reasoning mode (chain-of-thought)
- POST /sessions              : Create new session
- GET  /sessions/{session_id} : Get session history
- DELETE /sessions/{session_id}: Delete session
- GET  /users/{user_id}/sessions: List user sessions
- POST /memory                : User memory operations
"""

import os
import uuid
import time
import json
import asyncio
import logging
import httpx
from typing import Optional, List
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv

# Load env
current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(current_dir, ".env"))

# Path setup - CRITICAL FIX for backend.query import
import sys
# Add the root 'backend' parent directory to sys.path so we can import 'backend.query'
root_dir = os.path.abspath(os.path.join(current_dir, "../../../"))
if root_dir not in sys.path:
    sys.path.append(root_dir)

# Also keep existing path setup for local imports
if current_dir not in sys.path:
    sys.path.append(os.path.dirname(current_dir))
    sys.path.append(current_dir)

from lex_bot.graph import run_query
from lex_bot.memory import UserMemoryManager
from lex_bot.memory.chat_store import ChatStore
from lex_bot.config import MEM0_ENABLED, DATABASE_URL
from lex_bot.tools.session_cache import get_session_cache
from lex_bot.core.observability import setup_langsmith
# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)
logger = logging.getLogger("lex_bot.api")

try:
    from backend.query.sql import start_tunnel_and_pool, _get_tunneled_dsn
except ImportError:
    logger.warning("Could not import backend.query.sql. Using mock functions.")
    def start_tunnel_and_pool(): pass
    def _get_tunneled_dsn(): return None

# Initialize stores
chat_store = ChatStore()

# ============ Lifespan ============
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Lex Bot v2 starting up...")
    
    # Initialize LangSmith tracing (if API key is set)
    setup_langsmith()
    
    AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth:8009")
    logger.info(f"🔗 Auth Service URL: {AUTH_SERVICE_URL}")
    
    # Start SSH Tunnel (if configured)
    start_tunnel_and_pool()
    
    # Initialize ChatStore with tunneled DSN
    tunneled_dsn = _get_tunneled_dsn()
    if tunneled_dsn:
        # Convert postgres:// to postgresql:// for SQLAlchemy
        tunneled_db_url = tunneled_dsn.replace("postgres://", "postgresql://")
        global chat_store
        chat_store = ChatStore(db_url=tunneled_db_url)
    
    # Check Database Connection
    from sqlalchemy import create_engine, text
    
    try:
        db_url = tunneled_db_url if 'tunneled_db_url' in locals() and tunneled_db_url else DATABASE_URL
        if not db_url:
            raise ValueError("DATABASE_URL not set in .env")
            
        engine = create_engine(
            db_url,
            connect_args={
                "keepalives": 1,
                "keepalives_idle": 30,
                "keepalives_interval": 10,
                "keepalives_count": 5,
            }
        )
        with engine.connect() as conn:
            # Check connection
            conn.execute(text("SELECT 1"))
            logger.info("✅ Database connected")
            
            # Check pgvector extension
            result = conn.execute(text("SELECT * FROM pg_extension WHERE extname = 'vector'"))
            if not result.fetchone():
                logger.warning("⚠️ 'vector' extension not found. Attempting to create...")
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                    conn.commit()
                    logger.info("✅ 'vector' extension created")
                except Exception as ext_e:
                    logger.error(f"❌ Failed to create 'vector' extension: {ext_e}")
                    logger.error("Please run 'CREATE EXTENSION vector;' in your database manually.")
            else:
                logger.info("✅ 'vector' extension verified")
                
    except Exception as e:
        logger.error(f"❌ Database Error: {e}")
        print("\n" + "="*60)
        print("❌ CRITICAL ERROR: Database Connection Failed")
        print("="*60)
        print(f"Error: {e}")
        print("\nPlease ensure PostgreSQL is running and DATABASE_URL is correct.")
        
    yield
    logger.info("👋 Lex Bot v2 shutting down...")
    await http_client.aclose()


# ============ FastAPI App ============
app = FastAPI(
    title="Lex Bot v2 API",
    description="Production-Ready Indian Law Research Bot",
    version="2.0.0",
    lifespan=lifespan
)

# Global HTTP Client
http_client = httpx.AsyncClient()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    session_id: str = Form(...)
):
    """
    Upload a file for temporary processing.
    Requires session_id to associate the file with a conversation.
    """
    try:
        # Create uploads directory if not exists
        upload_dir = os.path.join(current_dir, "data", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1]
        unique_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, unique_name)
        
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        # Store in session cache
        session_cache = get_session_cache()
        session_cache.add_file_path(session_id, file_path)
            
        print(f"📂 File uploaded for session {session_id}: {file_path}")
        return {
            "file_path": file_path, 
            "filename": file.filename,
            "session_id": session_id,
            "message": "File uploaded and linked to session."
        }
        
    except Exception as e:
        print(f"❌ Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Request/Response Models ============
class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000, description="Legal query")
    user_id: Optional[str] = Field(None, description="User ID for memory")
    session_id: Optional[str] = Field(None, description="Session ID")
    
    @field_validator('query')
    @classmethod
    def sanitize_query(cls, v: str) -> str:
        """Basic input sanitization."""
        v = v.strip()
        # Remove excessive whitespace
        v = ' '.join(v.split())
        return v


class ChatResponse(BaseModel):
    answer: str
    session_id: str
    complexity: Optional[str] = None
    agents_used: Optional[List[str]] = None
    chain_of_thought: Optional[str] = None  # For reasoning mode
    memory_used: bool = False
    processing_time_ms: int
    suggested_followups: Optional[List[str]] = None  # Follow-up questions


class SessionResponse(BaseModel):
    session_id: str
    user_id: str
    title: Optional[str] = None
    messages: List[dict] = []
    created_at: Optional[str] = None


class SessionListResponse(BaseModel):
    sessions: List[dict] = []
    total: int = 0


class MemoryRequest(BaseModel):
    user_id: str
    action: str = Field(..., description="Action: 'get', 'search', 'clear'")
    query: Optional[str] = None


class MemoryResponse(BaseModel):
    success: bool
    memories: list = []
    message: str = ""


class LLMConfigRequest(BaseModel):
    model: str = Field(..., description="Model: 'gemini-2.5-flash', 'gemini-2.5-pro', 'gpt-4o', 'gpt-4o-mini'")


class LLMConfigResponse(BaseModel):
    current_model: str
    available_models: List[str]
    modes: dict


# Available models
AVAILABLE_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-pro", 
    "gpt-4o",
    "gpt-4o-mini"
]

# Runtime config - single model for both modes
_runtime_config = {
    "model": os.getenv("LLM_MODEL", "gemini-2.5-flash")
}


# ============ Endpoints ============
# ============ Auth Dependency ============
import httpx

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth:8009")

async def verify_token(request: Request):
    """
    Verify session token with Auth Service.
    Expects 'Authorization: Bearer <session_id>' or 'session_id' in body/query.
    """
    # 1. Try Authorization header
    auth_header = request.headers.get("Authorization")
    session_id = None
    if auth_header and auth_header.startswith("Bearer "):
        session_id = auth_header.split(" ")[1]
    
    # 2. Try body (for some endpoints)
    if not session_id:
        try:
            body = await request.json()
            session_id = body.get("session_id")
        except:
            pass
            
    # 3. Try query param
    if not session_id:
        session_id = request.query_params.get("session_id")
        
    # 4. Try form data (for upload)
    if not session_id:
        try:
            form = await request.form()
            session_id = form.get("session_id")
        except:
            pass

    if not session_id:
        raise HTTPException(status_code=401, detail="Missing session_id or Authorization header")

    try:
        url = f"{AUTH_SERVICE_URL}/verify_session/{session_id}"
        resp = await http_client.get(url)
        if resp.status_code != 200:
            logger.warning(f"Auth check failed for {session_id}: {resp.status_code} {resp.text}")
            raise HTTPException(status_code=401, detail="Invalid session")
        return resp.json().get("user_id")
    except httpx.RequestError as e:
        logger.error(f"Auth service connection failed to {url}: {repr(e)}")
        raise HTTPException(status_code=500, detail="Auth service unavailable")


@app.get("/")
def health_check():
    """Health check endpoint."""
    return {
        "status": "active",
        "system": "Lex Bot v2",
        "version": "2.0.0",
        "memory_enabled": MEM0_ENABLED,
        "current_model": _runtime_config["model"],
        "timestamp": datetime.now().isoformat()
    }


@app.get("/config/llm", response_model=LLMConfigResponse)
def get_llm_config():
    """Get current LLM configuration."""
    return LLMConfigResponse(
        current_model=_runtime_config["model"],
        available_models=AVAILABLE_MODELS,
        modes={
            "normal": "Fast response, no chain-of-thought",
            "reasoning": "Same model + chain-of-thought enabled"
        }
    )


@app.post("/config/llm", response_model=LLMConfigResponse)
def set_llm_config(request: LLMConfigRequest):
    """
    Switch LLM model at runtime.
    
    The same model is used for both normal and reasoning modes.
    Reasoning mode just adds chain-of-thought.
    
    Example: {"model": "gpt-4o"}
    """
    if request.model not in AVAILABLE_MODELS:
        raise HTTPException(status_code=400, detail=f"Invalid model. Choose from: {AVAILABLE_MODELS}")
    
    _runtime_config["model"] = request.model
    os.environ["LLM_MODEL"] = request.model
    logger.info(f"🔄 Model switched to: {request.model}")
    
    return get_llm_config()


@app.post("/chat", response_model=ChatResponse)
async def chat_normal(request: ChatRequest, user_id: str = Depends(verify_token)):
    """
    Normal mode - standard response without chain-of-thought.
    """
    return await _process_chat(request, user_id, reasoning_mode=False)


@app.post("/chat/reasoning", response_model=ChatResponse)
async def chat_reasoning(request: ChatRequest, user_id: str = Depends(verify_token)):
    """
    Reasoning mode - activates chain-of-thought.
    """
    return await _process_chat(request, user_id, reasoning_mode=True)


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest, user_id: str = Depends(verify_token)):
    """
    Streaming endpoint for chat.
    """
    return StreamingResponse(
        _stream_chat(request, user_id),
        media_type="text/event-stream"
    )

def generate_title(query: str) -> str:
    """Generate a short 3-5 word title for the chat session."""
    try:
        logger.info(f"Generating title for query: {query[:50]}...")
        # Simple heuristic for very short queries
        if len(query.split()) <= 5:
            logger.info("Query short enough, using as title")
            return query[:50]
            
        # Use LLM to summarize
        from backend.query.QueryParsing import GenerativeModel
        model = GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            f"Summarize this query into a concise 3-5 word title. Do not use quotes. Query: {query}"
        )
        title = response.text.strip()
        logger.info(f"Generated title: {title}")
        return title
    except Exception as e:
        logger.error(f"Title generation failed: {e}")
        return query[:50]

async def _stream_chat(request: ChatRequest, user_id: str):
    """Generator for streaming responses."""
    logger.info(f"➡️ _stream_chat called for user_id={user_id}, session_id={request.session_id}")
    session_id = request.session_id or str(uuid.uuid4())
    
    # Send status update
    logger.info("Yielding status update...")
    yield f"data: {json.dumps({'event': 'status', 'message': 'Initializing...', 'quote': 'Preparing research environment...'})}\n\n"
    
    # Store user message
    if user_id:
        logger.info("Storing user message...")
        chat_store.add_message(
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=request.query
        )
        
        # Generate and store title if it's a new session (or check if title exists)
        current_title = chat_store.get_session_title(session_id)
        if not current_title or current_title == "New Chat":
            logger.info("Generating title...")
            new_title = generate_title(request.query)
            chat_store.update_session_title(session_id, user_id, new_title)

    try:
        logger.info(f"🚀 Calling run_query for session {session_id}...")
        
        # Run run_query in a separate thread to allow yielding keep-alive pings
        loop = asyncio.get_running_loop()
        future = loop.run_in_executor(
            None, 
            lambda: run_query(
                query=request.query,
                user_id=user_id,
                session_id=session_id,
                llm_mode="fast"
            )
        )
        
        # Wait for result while yielding pings
        while not future.done():
            await asyncio.sleep(2)  # Check every 2 seconds
            # Yield a ping/status update to keep connection alive
            yield f"data: {json.dumps({'event': 'ping', 'message': 'Processing...'})}\n\n"
            
        result = await future
        logger.info("✅ run_query returned successfully")
        
        answer = result.get("final_answer", "I apologize, but I couldn't generate a response.")
        suggested_followups = result.get("suggested_followups", [])
        sources = result.get("sources", [])
        
        # Yield the final answer
        yield f"data: {json.dumps({'event': 'answer', 'content': answer})}\n\n"
        
        # Yield followups
        if suggested_followups:
            yield f"data: {json.dumps({'event': 'followups', 'questions': suggested_followups})}\n\n"
            
        # Yield sources
        if sources:
            yield f"data: {json.dumps({'event': 'sources', 'sources': sources})}\n\n"

        yield f"data: {json.dumps({'event': 'done', 'message': 'Complete'})}\n\n"
        
        # Store assistant response
        if user_id:
            chat_store.add_message(
                user_id=user_id,
                session_id=session_id,
                role="assistant",
                content=answer,
                msg_metadata={
                    "complexity": result.get("complexity"),
                    "agents": result.get("selected_agents"),
                    "sources": sources,
                    "suggested_followups": suggested_followups
                }
            )
            
    except Exception as e:
        logger.error(f"Stream error: {e}")
        yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"


async def _process_chat(request: ChatRequest, user_id: str, reasoning_mode: bool = False) -> ChatResponse:
    """Core chat processing logic."""
    start_time = time.time()
    session_id = request.session_id or str(uuid.uuid4())
    
    # Store user message
    if user_id:
        chat_store.add_message(
            user_id=user_id,
            session_id=session_id,
            role="user",
            content=request.query
        )
        
        # Generate title
        current_title = chat_store.get_session_title(session_id)
        if not current_title or current_title == "New Chat":
            new_title = generate_title(request.query)
            chat_store.update_session_title(session_id, user_id, new_title)

    try:
        # Run LangGraph workflow
        result = run_query(
            query=request.query,
            user_id=user_id,
            session_id=session_id,
            llm_mode="reasoning" if reasoning_mode else "fast"
        )
        
        answer = result.get("final_answer", "I apologize, but I couldn't generate a response.")
        include_cot = reasoning_mode
        suggested_followups = result.get("suggested_followups", [])
        
        # Store assistant response
        if user_id:
            chat_store.add_message(
                user_id=user_id,
                session_id=session_id,
                role="assistant",
                content=answer,
                msg_metadata={
                    "complexity": result.get("complexity"),
                    "agents": result.get("selected_agents"),
                    "sources": result.get("sources", []),
                    "suggested_followups": suggested_followups
                }
            )
        
        processing_time = int((time.time() - start_time) * 1000)
        
        return ChatResponse(
            answer=answer,
            session_id=session_id,
            complexity=result.get("complexity"),
            agents_used=result.get("selected_agents"),
            chain_of_thought=result.get("reasoning_trace") if include_cot else None,
            memory_used=bool(result.get("memory_context")),
            processing_time_ms=processing_time,
            suggested_followups=suggested_followups
        )
        
    except Exception as e:
        logger.error(f"❌ Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============ Session Endpoints ============
@app.post("/sessions", response_model=SessionResponse)
async def create_session(user_id: str):
    """Create a new chat session."""
    session_id = str(uuid.uuid4())
    # Initialize session in DB
    chat_store.update_session_title(session_id, user_id, "New Chat")
    
    return SessionResponse(
        session_id=session_id,
        user_id=user_id,
        title="New Chat",
        messages=[],
        created_at=datetime.now().isoformat()
    )


@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, user_id: str = Depends(verify_token)):
    """Get session history."""
    messages = chat_store.get_session_history(user_id, session_id, limit=100)
    title = chat_store.get_session_title(session_id) or "Chat"
    
    return SessionResponse(
        session_id=session_id,
        user_id=user_id,
        title=title,
        messages=messages,
        created_at=messages[0].get("timestamp") if messages else datetime.now().isoformat()
    )


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user_id: str):
    """Delete a session."""
    success = chat_store.delete_session(user_id, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "message": "Session deleted"}


@app.get("/sessions", response_model=SessionListResponse)
async def list_sessions(user_id: str = Depends(verify_token), limit: int = 50):
    """List all sessions for the authenticated user."""
    # Get sessions with metadata from ChatSession table
    raw_sessions = chat_store.get_user_sessions(user_id, limit=limit)
    
    sessions = []
    for s in raw_sessions:
        sessions.append({
            "session_id": s["session_id"],
            "user_id": user_id,
            "title": s["title"] or "New Chat",
            "created_at": s["created_at"] or datetime.now().isoformat(),
            "messages": []
        })
        
    return SessionListResponse(sessions=sessions, total=len(sessions))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
