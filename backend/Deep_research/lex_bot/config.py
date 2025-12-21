import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from lex_bot directory
_this_dir = Path(__file__).parent
load_dotenv(_this_dir / ".env")

# --- API KEYS ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")  # Fallback search
GOOGLE_SERP_API_KEY = os.getenv("GOOGLE_SERP_API_KEY")  # Fallback search
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
VOYAGE_API_KEY = os.getenv("VOYAGE_API_KEY")  # Future: voyage-law-2

# --- LLM MODES ---
# "fast" = quick responses, lower cost
# "reasoning" = complex analysis, higher accuracy
LLM_MODE = os.getenv("LLM_MODE", "fast")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")  # "gemini" or "openai"

# Fast Mode Models
GEMINI_FAST_MODEL = "gemini-2.5-flash"
OPENAI_FAST_MODEL = "gpt-4o-mini"

# Reasoning Mode Models
GEMINI_REASONING_MODEL = "gemini-2.5-pro"
OPENAI_REASONING_MODEL = "gpt-4o"

# Legacy compatibility
LLM_MODEL_NAME = GEMINI_FAST_MODEL

# --- EMBEDDING MODEL ---
EMBEDDING_MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
RERANK_MODEL = os.getenv("RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

# --- SEARCH CONFIG ---
DB_SEARCH_LIMIT_PRE = 200
DB_SEARCH_LIMIT_FINAL = 20
WEB_SEARCH_MAX_RESULTS = 5

# --- RATE LIMITING ---
SCRAPE_DELAY_SECONDS = float(os.getenv("SCRAPE_DELAY", 2.5))

# --- MEMORY (mem0) ---
MEM0_ENABLED = os.getenv("MEM0_ENABLED", "true").lower() == "true"

# --- SESSION CACHE ---
SESSION_CACHE_TTL_MINUTES = int(os.getenv("SESSION_CACHE_TTL", 30))

# --- TARGET WEBSITES ---
TARGET_CASE_SITE = "indiankanoon.org"

PREFERRED_DOMAINS = [
    "indiankanoon.org",
    "legalserviceindia.com",
    "scconline.com",
    "livelaw.in",
    "barandbench.com",
    "sci.gov.in",
    "indiacode.nic.in",
    "ecourts.gov.in",
]

# --- LANGSMITH OBSERVABILITY ---
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_PROJECT = os.getenv("LANGSMITH_PROJECT", "lex-bot-v2")

# --- TOKEN LIMITS ---
MAX_TOKENS_PER_QUERY = int(os.getenv("MAX_TOKENS_PER_QUERY", 50000))
MAX_TOKENS_PER_USER_DAILY = int(os.getenv("MAX_TOKENS_PER_USER_DAILY", 500000))

# --- TIMEOUT SETTINGS ---
AGENT_TIMEOUT_SECONDS = int(os.getenv("AGENT_TIMEOUT", 30))
TOTAL_REQUEST_TIMEOUT_SECONDS = int(os.getenv("REQUEST_TIMEOUT", 90))

# --- GUARDRAILS ---
MAX_QUERY_LENGTH = int(os.getenv("MAX_QUERY_LENGTH", 2000))
MAX_REQUESTS_PER_MINUTE = int(os.getenv("RATE_LIMIT_RPM", 10))

# --- MEMORY RETENTION ---
CHAT_HISTORY_RETENTION_DAYS = int(os.getenv("CHAT_RETENTION_DAYS", 15))
MEM0_RETENTION_DAYS = int(os.getenv("MEM0_RETENTION_DAYS", 15))



