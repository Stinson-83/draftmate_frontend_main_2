"""
Fallback Handler - Web search fallback when agents fail

Provides graceful degradation by falling back to web search
when specialized agents encounter errors or timeouts.
"""

import logging
from typing import Dict, Any, Optional
from functools import wraps
import asyncio

from lex_bot.tools.web_search import web_search_tool
from lex_bot.config import WEB_SEARCH_MAX_RESULTS

logger = logging.getLogger(__name__)


class FallbackHandler:
    """
    Handles agent failures with graceful fallback to web search.
    
    Usage:
        fallback = FallbackHandler()
        result = fallback.execute_with_fallback(agent.run, state)
    """
    
    def __init__(self, timeout_seconds: int = 30):
        self.timeout = timeout_seconds
        self.fallback_count = 0
    
    def execute_with_fallback(
        self,
        func,
        state: Dict[str, Any],
        agent_name: str = "unknown"
    ) -> Dict[str, Any]:
        """
        Execute a function with fallback on failure.
        
        Args:
            func: The agent function to execute
            state: Agent state dictionary
            agent_name: Name of the agent for logging
            
        Returns:
            Result dict, either from agent or fallback
        """
        try:
            result = func(state)
            return result
            
        except Exception as e:
            logger.warning(f"⚠️ {agent_name} failed: {e}. Triggering fallback...")
            self.fallback_count += 1
            return self._fallback_web_search(state)
    
    def _fallback_web_search(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fallback to web search when agent fails.
        
        Returns:
            State update with web search results
        """
        query = state.get("original_query", "")
        
        try:
            logger.info(f"🌐 Fallback: Web search for '{query[:50]}...'")
            
            # Use web search tool
            context_str, results = web_search_tool.search(
                query=query,
                max_results=WEB_SEARCH_MAX_RESULTS
            )
            
            return {
                "law_context": results or [],
                "tool_results": [{
                    "agent": "fallback",
                    "type": "web_search",
                    "source": "web_fallback",
                    "result_count": len(results) if results else 0
                }]
            }
            
        except Exception as e:
            logger.error(f"❌ Fallback web search also failed: {e}")
            return {
                "law_context": [],
                "errors": [f"All search methods failed: {e}"]
            }


# Router decision cache for optimization
class RouterCache:
    """
    Caches router decisions to avoid redundant LLM calls.
    
    Simple pattern matching for common query types.
    Saves ~500-1000ms by skipping router LLM call.
    """
    
    # Pattern -> (complexity, suggested_agents)
    # Keep this list SHORT and SPECIFIC — broad patterns misclassify complex queries.
    # The LLM router handles everything else correctly; only bypass it when we're certain.
    PATTERNS = {
        # IPC sections (common)
        "section 302": ("simple", []),
        "section 304": ("simple", []),
        "section 304b": ("simple", []),
        "section 306": ("simple", []),
        "section 307": ("simple", []),
        "section 323": ("simple", []),
        "section 325": ("simple", []),
        "section 354": ("simple", []),
        "section 363": ("simple", []),
        "section 376": ("simple", []),
        "section 377": ("simple", []),
        "section 379": ("simple", []),
        "section 392": ("simple", []),
        "section 395": ("simple", []),
        "section 406": ("simple", []),
        "section 409": ("simple", []),
        "section 420": ("simple", []),
        "section 498a": ("simple", []),
        "section 499": ("simple", []),
        "section 506": ("simple", []),
        "section 120b": ("simple", []),
        # BNS sections (IPC replacements)
        "section 103": ("simple", []),   # murder
        "section 64": ("simple", []),    # rape
        "section 316": ("simple", []),   # cheating
        "section 85": ("simple", []),    # cruelty by husband
        # CrPC / BNSS key sections
        "section 41": ("simple", []),    # arrest without warrant
        "section 154": ("simple", []),   # FIR
        "section 161": ("simple", []),   # examination of witnesses
        "section 164": ("simple", []),   # confession
        "section 167": ("simple", []),   # remand
        "section 438": ("simple", []),   # anticipatory bail
        "section 439": ("simple", []),   # bail
        "section 482": ("simple", []),   # inherent powers / BNSS bail
        # Constitution articles
        "article 14": ("simple", []),
        "article 19": ("simple", []),
        "article 21": ("simple", []),
        "article 22": ("simple", []),
        "article 32": ("simple", []),
        "article 226": ("simple", []),
        "article 136": ("simple", []),
        # IPC section with common alternate spellings
        "section 144": ("simple", []),

        # Explicit complex-task signals — safe to fast-path to specialist agents
        "analyze strategy": ("complex", ["strategy_agent", "law_agent"]),
        "legal strategy": ("complex", ["strategy_agent"]),
        "draft petition": ("complex", ["strategy_agent", "law_agent"]),
        "prepare argument": ("complex", ["strategy_agent", "case_agent"]),
        "arguments for": ("complex", ["strategy_agent"]),
    }
    
    @classmethod
    def check_cache(cls, query: str) -> Optional[Dict[str, Any]]:
        """
        Check if query matches a cached pattern.
        
        Returns:
            Dict with complexity and agents if cached, None otherwise
        """
        query_lower = query.lower().strip()
        
        for pattern, (complexity, agents) in cls.PATTERNS.items():
            if pattern in query_lower:
                logger.info(f"📦 Router cache hit: {pattern} → {complexity}")
                return {
                    "complexity": complexity,
                    "selected_agents": agents,
                    "cached": True
                }
        
        return None


# Singleton instances
fallback_handler = FallbackHandler(timeout_seconds=30)
router_cache = RouterCache()
