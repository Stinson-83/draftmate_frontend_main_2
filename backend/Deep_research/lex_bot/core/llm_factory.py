"""
LLM Factory - Dual Mode LLM Provider with Fallback

Supports two modes:
- Fast: gemini-2.5-flash / gpt-4o-mini (quick responses, lower cost)
- Reasoning: gemini-2.5-pro / gpt-4o (complex analysis, higher accuracy)

Features:
- Automatic fallback to OpenAI when Gemini quota is exceeded
- Rate limit error handling
"""

import logging
import functools
from typing import Literal, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.language_models.chat_models import BaseChatModel

from lex_bot.config import (
    GOOGLE_API_KEY,
    OPENAI_API_KEY,
    LLM_PROVIDER,
    LLM_MODE,
    GEMINI_FAST_MODEL,
    GEMINI_REASONING_MODEL,
    OPENAI_FAST_MODEL,
    OPENAI_REASONING_MODEL,
)

logger = logging.getLogger(__name__)

# Track if Gemini is currently rate limited
_gemini_quota_exhausted = False

@functools.lru_cache(maxsize=16)
def _get_cached_llm(model_name: str, provider: str, temperature: float) -> BaseChatModel:
    """Instantiate and cache the actual LangChain client based on exact parameters."""
    if provider == "gemini":
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=GOOGLE_API_KEY,
            temperature=temperature,
        )
    elif provider == "openai":
        return ChatOpenAI(
            model=model_name,
            api_key=OPENAI_API_KEY,
            temperature=temperature,
        )
    else:
        raise ValueError(f"Unknown provider: {provider}")


class LLMFactory:
    """
    Factory for creating LLM instances based on mode and provider.
    
    Usage:
        llm = LLMFactory.create()  # Uses defaults from config
        llm = LLMFactory.create(mode="reasoning", provider="openai")
    """
    
    @staticmethod
    def create(
        mode: Literal["fast", "reasoning"] = None,
        provider: Literal["gemini", "openai"] = None,
        temperature: float = 0.0,
    ) -> BaseChatModel:
        """
        Create an LLM instance with automatic fallback and caching.
        
        Args:
            mode: "fast" or "reasoning". Defaults to config.LLM_MODE
            provider: "gemini" or "openai". Defaults to config.LLM_PROVIDER
            temperature: Model temperature. Default 0.0 for consistency.
            
        Returns:
            BaseChatModel instance (Gemini or OpenAI)
        """
        global _gemini_quota_exhausted
        
        mode = mode or LLM_MODE
        provider = provider or LLM_PROVIDER
        
        # Auto-switch to OpenAI if Gemini quota is exhausted
        if provider == "gemini" and _gemini_quota_exhausted and OPENAI_API_KEY:
            logger.warning("⚠️ Gemini quota exhausted, falling back to OpenAI")
            provider = "openai"
            
        # Resolve provider fallbacks based on missing API keys
        if provider == "gemini" and not GOOGLE_API_KEY:
            if OPENAI_API_KEY:
                logger.warning("GOOGLE_API_KEY not set, falling back to OpenAI")
                provider = "openai"
            else:
                raise ValueError("GOOGLE_API_KEY not set. Cannot use Gemini provider.")
                
        if provider == "openai" and not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set. Cannot use OpenAI provider.")
            
        # Resolve deterministic model name
        if provider == "gemini":
            model_name = GEMINI_REASONING_MODEL if mode == "reasoning" else GEMINI_FAST_MODEL
        elif provider == "openai":
            model_name = OPENAI_REASONING_MODEL if mode == "reasoning" else OPENAI_FAST_MODEL
        else:
            raise ValueError(f"Unknown provider: {provider}. Use 'gemini' or 'openai'.")
            
        # Return the strictly cached instance (Step 17)
        return _get_cached_llm(model_name, provider, temperature)
    
    @staticmethod
    def mark_gemini_quota_exhausted():
        """Mark Gemini as quota exhausted to enable fallback."""
        global _gemini_quota_exhausted
        _gemini_quota_exhausted = True
        logger.warning("🔴 Gemini quota marked as exhausted - will use OpenAI fallback")
    
    @staticmethod
    def reset_gemini_quota():
        """Reset Gemini quota status (e.g., after some time)."""
        global _gemini_quota_exhausted
        _gemini_quota_exhausted = False
        logger.info("🟢 Gemini quota reset - will use Gemini again")
    
    @staticmethod
    def get_model_name(
        mode: Literal["fast", "reasoning"] = None,
        provider: Literal["gemini", "openai"] = None,
    ) -> str:
        """Get the model name that would be used for given mode/provider."""
        mode = mode or LLM_MODE
        provider = provider or LLM_PROVIDER
        
        if provider == "gemini":
            return GEMINI_REASONING_MODEL if mode == "reasoning" else GEMINI_FAST_MODEL
        else:
            return OPENAI_REASONING_MODEL if mode == "reasoning" else OPENAI_FAST_MODEL


# Convenience function
def get_llm(
    mode: Literal["fast", "reasoning"] = None,
    provider: Literal["gemini", "openai"] = None,
) -> BaseChatModel:
    """Convenience wrapper for LLMFactory.create()"""
    return LLMFactory.create(mode=mode, provider=provider)
