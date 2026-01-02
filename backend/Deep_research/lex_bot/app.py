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

# Path setup
import sys
if current_dir not in sys.path:
    sys.path.append(os.path.dirname(current_dir))
    sys.path.append(current_dir)

from lex_bot.graph import run_query
from lex_bot.memory import UserMemoryManager
from lex_bot.memory.chat_store import ChatStore
from lex_bot.config import MEM0_ENABLED
from lex_bot.tools.session_cache import get_session_cache
from lex_bot.core.observability import setup_langsmith

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)
logger = logging.getLogger("lex_bot.api")

# Initialize stores
chat_store = ChatStore()


# ============ Lifespan ============
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Lex Bot v2 starting up...")
    
    # Initialize LangSmith tracing (if API key is set)
    setup_langsmith()
    
    # Check Database Connection
    from sqlalchemy import create_engine, text
    from lex_bot.config import DATABASE_URL
    
    try:
        if not DATABASE_URL:
            raise ValueError("DATABASE_URL not set in .env")
            
        engine = create_engine(DATABASE_URL)
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
        print("If running locally without Docker:")
        print("1. Install PostgreSQL")
        print("2. Create a database")
        print("3. Set DATABASE_URL in .env")
        print("4. Enable pgvector extension: CREATE EXTENSION vector;")
        print("="*60 + "\n")
        # We don't exit here to allow debugging, but the app might fail later
        
    yield
    logger.info("👋 Lex Bot v2 shutting down...")


# ============ FastAPI App ============
app = FastAPI(
    title="Lex Bot v2 API",
    description="Production-Ready Indian Law Research Bot",
    version="2.0.0",
    lifespan=lifespan
)

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
        session_cache.set_file_path(session_id, file_path)
            
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
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{AUTH_SERVICE_URL}/verify_session/{session_id}")
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            return resp.json().get("user_id")
    except httpx.RequestError as e:
        logger.error(f"Auth service connection failed: {e}")
        raise HTTPException(status_code=500, detail="Auth service unavailable")


# ============ Endpoints ============
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
    # Override user_id from token if present
    if user_id:
        request.user_id = user_id
    return await _process_chat(request, llm_mode="fast", include_cot=False)


@app.post("/chat/reasoning", response_model=ChatResponse)
async def chat_reasoning(request: ChatRequest, user_id: str = Depends(verify_token)):
    """
    Reasoning mode - same model as normal, but with chain-of-thought enabled.
    """
    if user_id:
        request.user_id = user_id
    return await _process_chat(request, llm_mode="reasoning", include_cot=True)


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest): # Streaming is tricky with Depends, handling manually inside if needed or via query param
    """
    Streaming chat with token-by-token response.
    Uses Server-Sent Events (SSE) to push:
    - status: Progress updates with legal terminology
    - token: Answer chunks (typewriter effect)
    - answer_complete: Full answer when done
    - followups: Suggested follow-up questions
    - done: Final metadata
    """
    # Manual verification for streaming to avoid breaking SSE flow immediately
    # Ideally should be protected, but for now we'll check if session_id is valid via internal logic if needed
    # For strict security, we should verify here:
    # try:
    #    await verify_token(Request(scope={"type": "http", "headers": [], "query_string": f"session_id={request.session_id}".encode()}))
    # except:
    #    pass 
    
    async def event_generator():
        session_id = request.session_id or str(uuid.uuid4())
        
        # Verify Token Manually for Stream
        try:
             async with httpx.AsyncClient() as client:
                resp = await client.get(f"{AUTH_SERVICE_URL}/verify_session/{session_id}")
                if resp.status_code != 200:
                     yield f"data: {json.dumps({'event': 'error', 'message': 'Unauthorized'})}\n\n"
                     return
        except Exception:
             # Fail open or closed? Closed for security.
             yield f"data: {json.dumps({'event': 'error', 'message': 'Auth check failed'})}\n\n"
             return

        start_time = time.time()
        
        try:
            # Status: Analyzing
            yield f"data: {json.dumps({'event': 'status', 'message': 'Examining the pleadings...'})}\n\n"
            await asyncio.sleep(0.1)
            
            # Status: Searching
            yield f"data: {json.dumps({'event': 'status', 'message': 'Researching precedents and statutes...'})}\n\n"
            
            # Run the query (this is the heavy lifting)
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: run_query(
                    query=request.query,
                    user_id=request.user_id,
                    session_id=session_id,
                    llm_mode="fast",
                    file_path=get_session_cache().get_file_path(session_id) if session_id else None
                )
            )
            
            # Status: Generating
            yield f"data: {json.dumps({'event': 'status', 'message': 'Drafting the legal opinion...'})}\n\n"
            await asyncio.sleep(0.05)
            
            answer = result.get("final_answer", "No answer generated.")
            
            # Stream answer in chunks (typewriter effect)
            words = answer.split(' ')
            chunk_size = 5  # Send 5 words at a time
            accumulated = ""
            
            for i in range(0, len(words), chunk_size):
                chunk = ' '.join(words[i:i+chunk_size])
                accumulated += chunk + ' '
                yield f"data: {json.dumps({'event': 'token', 'chunk': chunk + ' ', 'accumulated': accumulated.strip()})}\n\n"
                await asyncio.sleep(0.02)  # Small delay for visual effect
            
            # Signal answer complete
            yield f"data: {json.dumps({'event': 'answer_complete', 'content': answer})}\n\n"
            
            # Generate follow-ups
            yield f"data: {json.dumps({'event': 'status', 'message': 'Preparing suggestions...'})}\n\n"
            suggested_followups = []
            try:
                from lex_bot.core.llm_factory import get_llm
                followup_llm = get_llm(mode="fast")
                followup_prompt = f"""Based on this legal query and answer, suggest 3 brief follow-up questions.

Query: {request.query}
Answer: {answer[:500]}

Return ONLY a JSON array: ["Q1?", "Q2?", "Q3?"]"""
                followup_response = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: followup_llm.invoke(followup_prompt)
                )
                import re
                json_match = re.search(r'\[.*\]', followup_response.content, re.DOTALL)
                if json_match:
                    suggested_followups = json.loads(json_match.group())[:3]
            except Exception as e:
                logger.warning(f"Follow-up generation failed: {e}")
            
            if suggested_followups:
                yield f"data: {json.dumps({'event': 'followups', 'questions': suggested_followups})}\n\n"
            
            # Extract sources for clickable citations
            sources = []
            law_ctx = result.get("law_context", [])
            case_ctx = result.get("case_context", [])
            all_sources = law_ctx + case_ctx
            
            # Map internal source names to user-friendly labels
            source_name_map = {
                "Tavily": "Web",
                "DuckDuckGo": "Web",
                "Serper": "Web",
                "Google": "Web",
                "Database": "Legal Database",
                "Indian Kanoon": "Case Law",
                "eCourts": "Court Records",
            }
            
            for i, doc in enumerate(all_sources, 1):  # No limit - show all cited sources
                raw_source = doc.get("source", "Web")
                friendly_source = source_name_map.get(raw_source, raw_source)
                
                source = {
                    "index": i,
                    "title": doc.get("title", "Untitled"),
                    "url": doc.get("url", ""),
                    "type": friendly_source,
                    "citation": doc.get("citation", "")
                }
                if source["url"]:  # Only include if URL exists
                    sources.append(source)
            
            if sources:
                yield f"data: {json.dumps({'event': 'sources', 'sources': sources})}\n\n"
            
            # Store messages
            if request.user_id:
                chat_store.add_message(request.user_id, session_id, "user", request.query)
                chat_store.add_message(request.user_id, session_id, "assistant", answer)
            
            # Done event with metadata
            processing_time = int((time.time() - start_time) * 1000)
            yield f"data: {json.dumps({'event': 'done', 'session_id': session_id, 'complexity': result.get('complexity'), 'agents_used': result.get('selected_agents'), 'processing_time_ms': processing_time})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'event': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

async def _process_chat(
    request: ChatRequest,
    llm_mode: str,
    include_cot: bool
) -> ChatResponse:
    """Core chat processing logic."""
    start_time = time.time()
    session_id = request.session_id or str(uuid.uuid4())
    
    logger.info(f"📨 [{llm_mode.upper()}] Query: {request.query[:50]}...")
    
    try:
        # Store user message
        if request.user_id:
            chat_store.add_message(
                user_id=request.user_id,
                session_id=session_id,
                role="user",
                content=request.query,
                msg_metadata={"llm_mode": llm_mode}
            )
        
        # Run query through graph
        result = run_query(
            query=request.query,
            user_id=request.user_id,
            session_id=session_id,
            llm_mode=llm_mode,
            file_path=get_session_cache().get_file_path(session_id) if session_id else None
        )
        
        answer = result.get("final_answer", "No answer generated.")
        
        # Generate follow-up suggestions
        suggested_followups = None
        try:
            from lex_bot.core.llm_factory import get_llm
            followup_llm = get_llm(mode="fast")
            followup_prompt = f"""Based on this legal query and answer, suggest 3 brief follow-up questions.

Query: {request.query}
Answer: {answer[:500]}

Return ONLY a JSON array of 3 short questions, e.g.: ["Question 1?", "Question 2?", "Question 3?"]"""
            followup_response = followup_llm.invoke(followup_prompt)
            import re
            json_match = re.search(r'\[.*\]', followup_response.content, re.DOTALL)
            if json_match:
                suggested_followups = json.loads(json_match.group())[:3]
        except Exception as e:
            logger.warning(f"Follow-up generation failed: {e}")
        
        # Store assistant response
        if request.user_id:
            chat_store.add_message(
                user_id=request.user_id,
                session_id=session_id,
                role="assistant",
                content=answer,
                msg_metadata={
                    "complexity": result.get("complexity"),
                    "agents": result.get("selected_agents")
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
    return SessionResponse(
        session_id=session_id,
        user_id=user_id,
        title="New Chat",
        messages=[],
        created_at=datetime.now().isoformat()
    )


@app.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, user_id: str):
    """Get session history."""
    messages = chat_store.get_session_history(user_id, session_id, limit=100)
    
    # Extract title from first user message
    title = "Chat"
    for msg in messages:
        if msg.get("role") == "user":
            title = msg.get("content", "Chat")[:50]
            break
    
    return SessionResponse(
        session_id=session_id,
        user_id=user_id,
        title=title,
        messages=messages,
        created_at=messages[0].get("timestamp") if messages else None
    )


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user_id: str):
    """Delete a session."""
    success = chat_store.delete_session(user_id, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"success": True, "message": "Session deleted"}


@app.get("/users/{user_id}/sessions", response_model=SessionListResponse)
async def list_user_sessions(user_id: str, limit: int = 20):
    """List all sessions for a user."""
    session_ids = chat_store.get_user_sessions(user_id, limit=limit)
    
    sessions = []
    for sid in session_ids:
        messages = chat_store.get_session_history(user_id, sid, limit=1)
        title = "Chat"
        created_at = None
        if messages:
            if messages[0].get("role") == "user":
                title = messages[0].get("content", "Chat")[:50]
            created_at = messages[0].get("timestamp")
        
        sessions.append({
            "session_id": sid,
            "title": title,
            "created_at": created_at
        })
    
    return SessionListResponse(sessions=sessions, total=len(sessions))


# ============ Memory Endpoints ============
@app.post("/memory", response_model=MemoryResponse)
async def memory_endpoint(request: MemoryRequest):
    """User memory operations."""
    if not MEM0_ENABLED:
        return MemoryResponse(success=False, message="Memory disabled")
    
    try:
        memory_manager = UserMemoryManager(user_id=request.user_id)
        
        if request.action == "get":
            memories = memory_manager.get_all()
            return MemoryResponse(success=True, memories=memories, message=f"Found {len(memories)} memories")
        
        elif request.action == "search":
            if not request.query:
                raise HTTPException(status_code=400, detail="Query required")
            memories = memory_manager.search(request.query)
            return MemoryResponse(success=True, memories=memories, message=f"Found {len(memories)} relevant memories")
        
        elif request.action == "clear":
            success = memory_manager.clear_all()
            return MemoryResponse(success=success, message="Memories cleared" if success else "Failed")
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {request.action}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Memory error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Request Logging Middleware ============
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing."""
    request_id = str(uuid.uuid4())[:8]
    start = time.time()
    
    response = await call_next(request)
    
    duration = int((time.time() - start) * 1000)
    logger.info(f"[{request_id}] {request.method} {request.url.path} → {response.status_code} ({duration}ms)")
    
    return response


# ============ Main ============
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Lex Bot v2 Production Server...")
    uvicorn.run(app, host="0.0.0.0", port=8004)

