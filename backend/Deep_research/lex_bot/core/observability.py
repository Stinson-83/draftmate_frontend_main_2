"""
LangSmith Observability - Token tracking and cost monitoring

Integrates with LangSmith for production observability.
"""

import os
import logging
from typing import Dict, Any, Optional, Callable
from functools import wraps
from datetime import datetime

logger = logging.getLogger(__name__)

# LangSmith config
LANGSMITH_API_KEY = os.getenv("LANGSMITH_API_KEY")
LANGSMITH_PROJECT = os.getenv("LANGSMITH_PROJECT", "lex-bot-v2")

# Token limits
MAX_TOKENS_PER_QUERY = int(os.getenv("MAX_TOKENS_PER_QUERY", 50000))
MAX_TOKENS_PER_USER_DAILY = int(os.getenv("MAX_TOKENS_PER_USER_DAILY", 500000))


class TokenTracker:
    """
    Tracks token usage per user/session.
    
    For production, this would integrate with a database.
    For now, uses in-memory tracking.
    """
    
    def __init__(self):
        self._usage: Dict[str, Dict[str, int]] = {}  # user_id -> {date: tokens}
    
    def add_usage(self, user_id: str, tokens: int) -> bool:
        """
        Add token usage for a user.
        
        Returns:
            True if within limits, False if exceeded
        """
        today = datetime.now().strftime("%Y-%m-%d")
        
        if user_id not in self._usage:
            self._usage[user_id] = {}
        
        current = self._usage[user_id].get(today, 0)
        new_total = current + tokens
        
        if new_total > MAX_TOKENS_PER_USER_DAILY:
            logger.warning(f"⚠️ User {user_id} exceeded daily token limit ({new_total}/{MAX_TOKENS_PER_USER_DAILY})")
            return False
        
        self._usage[user_id][today] = new_total
        logger.info(f"📊 Token usage: {user_id} → {new_total}/{MAX_TOKENS_PER_USER_DAILY}")
        return True
    
    def get_usage(self, user_id: str) -> int:
        """Get today's token usage for a user."""
        today = datetime.now().strftime("%Y-%m-%d")
        return self._usage.get(user_id, {}).get(today, 0)
    
    def check_limit(self, user_id: str, estimated_tokens: int) -> bool:
        """Check if user can make a query with estimated tokens."""
        current = self.get_usage(user_id)
        return (current + estimated_tokens) <= MAX_TOKENS_PER_USER_DAILY


def setup_langsmith():
    """
    Setup LangSmith tracing if API key is available.
    
    Call this at application startup.
    """
    if not LANGSMITH_API_KEY:
        logger.info("📊 LangSmith not configured (no API key)")
        return False
    
    try:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = LANGSMITH_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = LANGSMITH_PROJECT
        
        logger.info(f"📊 LangSmith enabled → Project: {LANGSMITH_PROJECT}")
        return True
        
    except Exception as e:
        logger.error(f"❌ LangSmith setup failed: {e}")
        return False


def estimate_tokens(text: str) -> int:
    """
    Rough token estimation (4 chars per token average).
    
    For production, use tiktoken for accurate counts.
    """
    return len(text) // 4


# Singleton
token_tracker = TokenTracker()
