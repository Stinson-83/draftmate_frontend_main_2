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

# Set thread limits BEFORE PyTorch or SentenceTransformers are imported
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

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

from lex_bot.graph import run_query, prepare_initial_state, app as langgraph_app
from lex_bot.memory import UserMemoryManager
from lex_bot.memory.chat_store import ChatStore
from lex_bot.config import MEM0_ENABLED, DATABASE_URL
from lex_bot.tools.session_cache import get_session_cache
from lex_bot.core.observability import setup_langsmith
from lex_bot.graph import MEM0_ENABLED, _get_memory_manager
# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)
logger = logging.getLogger("lex_bot.api")
DEV_BYPASS_AUTH = os.getenv("DEV_BYPASS_AUTH", "false").lower() == "true"

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
            logger.info("Database connected")
            
            # Check pgvector extension
            result = conn.execute(text("SELECT * FROM pg_extension WHERE extname = 'vector'"))
            if not result.fetchone():
                logger.warning(" 'vector' extension not found. Attempting to create...")
                try:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                    conn.commit()
                    logger.info(" 'vector' extension created")
                except Exception as ext_e:
                    logger.error(f" Failed to create 'vector' extension: {ext_e}")
                    logger.error("Please run 'CREATE EXTENSION vector;' in your database manually.")
            else:
                logger.info(" 'vector' extension verified")
                
    except Exception as e:
        logger.error(f" Database Error: {e}")
        print("\n" + "="*60)
        print("CRITICAL ERROR: Database Connection Failed")
        print("="*60)
        print(f"Error: {e}")
        print("\nPlease ensure PostgreSQL is running and DATABASE_URL is correct.")
        
    # Pre-load Reranker model at startup (Step 10a)
    # Avoids cold-start penalty on first request (~2-5s model load)
    try:
        from lex_bot.tools.reranker import get_reranker
        logger.info("Pre-loading reranker model...")
        reranker = get_reranker()
        if reranker:
            logger.info("✅ Reranker model pre-loaded")
        else:
            logger.warning("⚠️ Reranker not available (sentence-transformers missing?)")
    except Exception as e:
        logger.warning(f"⚠️ Reranker pre-load failed (non-fatal): {e}")
        
    # Start the memory worker
    memory_worker_task = asyncio.create_task(_memory_worker())
        
    yield
    logger.info("👋 Lex Bot v2 shutting down...")
    memory_worker_task.cancel()
    try:
        await memory_worker_task
    except asyncio.CancelledError:
        pass
    await http_client.aclose()


# ============ FastAPI App ============
app = FastAPI(
    title="Lex Bot v2 API",
    description="Production-Ready Indian Law Research Bot",
    version="2.0.0",
    lifespan=lifespan
)

# Global HTTP Client
http_client = httpx.AsyncClient(timeout=30.0)

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
        print(f" Upload Error: {e}")
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

memory_queue = asyncio.Queue(maxsize=100)

def _store_memory_sync(user_id: str, query: str, answer: str):
    """Synchronous function to interact with mem0."""
    if not user_id or not MEM0_ENABLED:
        return
    memory_manager = _get_memory_manager(user_id)
    messages = [
        {"role": "user", "content": query},
        {"role": "assistant", "content": answer[:1000]}  # Truncate
    ]
    memory_manager.add(messages)
    logger.info(f"💾 Sequentially stored conversation to mem0 for user {user_id}")

async def _memory_worker():
    """Background worker that processes memory storage sequentially with retries."""
    while True:
        try:
            user_id, query, answer = await memory_queue.get()
            
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    loop = asyncio.get_running_loop()
                    await loop.run_in_executor(None, _store_memory_sync, user_id, query, answer)
                    break
                except Exception as e:
                    logger.warning(f"Memory store failed (attempt {attempt+1}/{max_retries}): {e}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1.0 * (2 ** attempt)) # 1s, 2s
                    else:
                        logger.error(f"⚠️ Failed to store memory after {max_retries} attempts.")
            
            memory_queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Critical error in memory worker: {e}")

def _background_memory_store(user_id: str, query: str, answer: str):
    """(Step 16) Enqueues memory task non-blockingly."""
    try:
        memory_queue.put_nowait((user_id, query, answer))
    except asyncio.QueueFull:
        logger.error("⚠️ Memory queue full! Dropping memory to prevent OOM.")

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
    if DEV_BYPASS_AUTH:
        return "dev_user"
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
        
        # Add retries for intermittent timeouts
        max_retries = 3
        for attempt in range(max_retries):
            try:
                resp = await http_client.get(url, timeout=10.0)
                if resp.status_code != 200:
                    logger.warning(f"Auth check failed for {session_id}: {resp.status_code} {resp.text}")
                    raise HTTPException(status_code=401, detail="Invalid session")
                return resp.json().get("user_id")
            except httpx.ReadTimeout as e:
                if attempt == max_retries - 1:
                    logger.error(f"Auth service connection failed to {url} after {max_retries} attempts: {repr(e)}")
                    raise HTTPException(status_code=500, detail="Auth service unavailable")
                logger.warning(f"Auth service timeout (attempt {attempt+1}/{max_retries}), retrying...")
                await asyncio.sleep(1)
            except httpx.RequestError as e:
                logger.error(f"Auth service connection failed to {url}: {repr(e)}")
                raise HTTPException(status_code=500, detail="Auth service unavailable")
    except HTTPException:
        raise


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
    """Generate a short 3-5 word title for the chat session.
    Uses the shared get_llm() factory — no external GenerativeModel dependency.
    """
    try:
        logger.info(f"Generating title for query: {query[:50]}...")
        # Simple heuristic for very short queries
        if len(query.split()) <= 5:
            logger.info("Query short enough, using as title")
            return query[:50]
            
        # Use shared LLM factory (fast mode for titles)
        from lex_bot.core.llm_factory import get_llm
        from langchain_core.output_parsers import StrOutputParser
        from langchain_core.prompts import ChatPromptTemplate

        llm = get_llm(mode="fast")
        prompt = ChatPromptTemplate.from_template(
            "Summarize this query into a concise 3-5 word title. "
            "Do not use quotes. Output ONLY the title.\n\nQuery: {query}"
        )
        chain = prompt | llm | StrOutputParser()
        title = chain.invoke({"query": query}).strip()
        logger.info(f"Generated title: {title}")
        return title
    except Exception as e:
        logger.error(f"Title generation failed: {e}")
        return query[:50]


async def _background_generate_title(session_id: str, user_id: str, query: str):
    """Fire-and-forget title generation. Runs after streaming starts."""
    try:
        loop = asyncio.get_running_loop()
        title = await loop.run_in_executor(None, generate_title, query)
        chat_store.update_session_title(session_id, user_id, title)
        logger.info(f" Background title generated: {title}")
    except Exception as e:
        logger.error(f"Background title generation failed: {e}")


def _generate_followups_sync(query: str, answer: str, llm_mode: str = "fast") -> list:
    """
    Generate follow-up questions synchronously (runs in thread pool).
    Separated from agents so it runs post-stream, not on the critical path.
    """
    try:
        from lex_bot.core.llm_factory import get_llm
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import JsonOutputParser
        
        llm = get_llm(mode="fast")  # Always use fast mode for followups
        prompt = ChatPromptTemplate.from_template("""You are a helpful legal assistant.
Based on the user's query and your answer, suggest 3 relevant follow-up questions the user might want to ask next.

Query: {query}
Answer: {answer}

Return ONLY a JSON list of strings, e.g.: ["Question 1?", "Question 2?", "Question 3?"]""")
        chain = prompt | llm | JsonOutputParser()
        result = chain.invoke({"query": query, "answer": answer[:2000]})
        return result if isinstance(result, list) else []
    except Exception as e:
        logger.warning(f"Follow-up generation failed: {e}")
        return []


async def _stream_chat(request: ChatRequest, user_id: str):
    """Generator for streaming responses."""
    logger.info(f" _stream_chat called for user_id={user_id}, session_id={request.session_id}")
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
        
        # Generate title in background (non-blocking)
        current_title = chat_store.get_session_title(session_id)
        if not current_title or current_title == "New Chat":
            logger.info("Launching background title generation...")
            asyncio.create_task(_background_generate_title(session_id, user_id, request.query))

    try:
        logger.info(f"🚀 Calling graph for session {session_id} with node tracking...")
        
        import queue
        
        tracked_nodes = {
            "memory_recall", "router", "research_agent", "document_agent", 
            "law_agent", "case_agent", "citation_agent", "strategy_agent", 
            "explainer_agent", "manager_aggregate", "memory_store"
        }
        
        from lex_bot.core.timing import LatencyTracker
        tracker = LatencyTracker()
        
        loop = asyncio.get_running_loop()
        initial_state = await loop.run_in_executor(
            None,
            lambda: prepare_initial_state(
                query=request.query,
                user_id=user_id,
                session_id=session_id,
                llm_mode="fast",
                chat_store_instance=chat_store,
                tracker=tracker
            )
        )
        
        node_runs = {}
        result = None
        
        try:
            async for event in langgraph_app.astream_events(initial_state, version="v2"):
                kind = event["event"]
                name = event.get("name", "")
                run_id = event.get("run_id")
                
                if kind == "on_chain_start" and name in tracked_nodes:
                    node_runs[run_id] = name
                    yield f"data: {json.dumps({'event': 'node_update', 'node': name, 'status': 'running'})}\n\n"
                    
                elif kind == "on_chain_end" and name in tracked_nodes:
                    yield f"data: {json.dumps({'event': 'node_update', 'node': name, 'status': 'complete'})}\n\n"
                    
                elif kind == "on_chat_model_stream":
                    active_node = None
                    tags = event.get("tags", [])
                    
                    for tag in tags:
                        if tag.startswith("langgraph:node:"):
                            node_name = tag.replace("langgraph:node:", "")
                            if node_name in tracked_nodes:
                                active_node = node_name
                                break
                                
                    if not active_node:
                        for pid in event.get("parent_ids", []):
                            if pid in node_runs:
                                active_node = node_runs[pid]
                                break
                                
                    if active_node:
                        chunk = event.get("data", {}).get("chunk")
                        if chunk:
                            content = chunk.content if hasattr(chunk, "content") else str(chunk)
                            if content:
                                yield f"data: {json.dumps({'event': 'node_stream', 'node': active_node, 'chunk': content})}\n\n"
                                
                elif kind == "on_chain_end" and not event.get("parent_ids"):
                    result = event.get("data", {}).get("output")
        except Exception as e:
            logger.error(f"Error in astream_events: {e}")
            raise
            
        tracker.summary()
        if not result:
            result = {}
        result["latency"] = tracker.as_dict()
        logger.info(" Graph execution returned successfully")
        
        answer = result.get("final_answer", "I apologize, but I couldn't generate a response.")
        sources = result.get("sources", [])
        
        # Yield the final answer FIRST (user sees it immediately)
        yield f"data: {json.dumps({'event': 'answer', 'content': answer})}\n\n"
            
        # Yield sources immediately (don't wait for followups)
        if sources:
            yield f"data: {json.dumps({'event': 'sources', 'sources': sources})}\n\n"

        # Generate followups post-stream (Step 8) — non-blocking
        # User already has their answer, followups are a bonus
        followup_future = loop.run_in_executor(
            None,
            lambda: _generate_followups_sync(request.query, answer, "fast")
        )
        
        try:
            suggested_followups = await asyncio.wait_for(followup_future, timeout=15.0)
        except asyncio.TimeoutError:
            logger.warning("Follow-up generation timed out (15s)")
            suggested_followups = []

        if suggested_followups:
            yield f"data: {json.dumps({'event': 'followups', 'questions': suggested_followups})}\n\n"

        if "latency" in result:
            yield f"data: {json.dumps({'event': 'latency', 'latency': result['latency']})}\n\n"

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
                }
            )
            
            # (Step 16) Fire and forget mem0 storage
            _background_memory_store(user_id, request.query, answer)
            
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
        
        # Generate title in background (non-blocking)
        current_title = chat_store.get_session_title(session_id)
        if not current_title or current_title == "New Chat":
            asyncio.create_task(_background_generate_title(session_id, user_id, request.query))

    try:
        # Run LangGraph workflow
        result = run_query(
            query=request.query,
            user_id=user_id,
            session_id=session_id,
            llm_mode="reasoning" if reasoning_mode else "fast",
            chat_store_instance=chat_store
        )
        
        answer = result.get("final_answer", "I apologize, but I couldn't generate a response.")
        include_cot = reasoning_mode

        # Start follow-up generation in background while we do DB saves
        loop = asyncio.get_running_loop()
        followup_future = loop.run_in_executor(
            None, _generate_followups_sync,
            request.query, answer, "reasoning" if reasoning_mode else "fast"
        )
        suggested_followups = []

        # Store assistant response (runs concurrently with followup generation)
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
                }
            )

            # (Step 16) Fire and forget mem0 storage
            _background_memory_store(user_id, request.query, answer)

        # Collect followups — they've had time to generate during DB save above
        try:
            suggested_followups = await asyncio.wait_for(followup_future, timeout=3.0)
        except asyncio.TimeoutError:
            logger.info("Follow-up generation still running — returning without followups")
        
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
        logger.error(f" Chat error: {e}", exc_info=True)
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
