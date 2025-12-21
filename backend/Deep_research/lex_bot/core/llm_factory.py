"""
LLM Factory - Dual Mode LLM Provider

Supports two modes:
- Fast: gemini-2.5-flash / gpt-4o-mini (quick responses, lower cost)
- Reasoning: gemini-2.5-pro / gpt-4o (complex analysis, higher accuracy)
"""

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
        Create an LLM instance.
        
        Args:
            mode: "fast" or "reasoning". Defaults to config.LLM_MODE
            provider: "gemini" or "openai". Defaults to config.LLM_PROVIDER
            temperature: Model temperature. Default 0.0 for consistency.
            
        Returns:
            BaseChatModel instance (Gemini or OpenAI)
        """
        mode = mode or LLM_MODE
        provider = provider or LLM_PROVIDER
        
        # Select model based on mode and provider
        if provider == "gemini":
            model_name = GEMINI_REASONING_MODEL if mode == "reasoning" else GEMINI_FAST_MODEL
            
            if not GOOGLE_API_KEY:
                raise ValueError("GOOGLE_API_KEY not set. Cannot use Gemini provider.")
            
            return ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=GOOGLE_API_KEY,
                temperature=temperature,
            )
        
        elif provider == "openai":
            model_name = OPENAI_REASONING_MODEL if mode == "reasoning" else OPENAI_FAST_MODEL
            
            if not OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY not set. Cannot use OpenAI provider.")
            
            return ChatOpenAI(
                model=model_name,
                api_key=OPENAI_API_KEY,
                temperature=temperature,
            )
        
        else:
            raise ValueError(f"Unknown provider: {provider}. Use 'gemini' or 'openai'.")
    
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
