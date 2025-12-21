"""
Research Agent - Handles simple queries with RAG + Web Search

Uses memory integration for personalized context.
"""

from typing import Dict, Any, List
import logging

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from lex_bot.agents.base_agent import BaseAgent
from lex_bot.tools.db_search import search_tool
from lex_bot.tools.session_cache import get_session_cache
from lex_bot.tools.reranker import rerank_documents
from lex_bot.memory.user_memory import UserMemoryManager
from lex_bot.config import MEM0_ENABLED

logger = logging.getLogger(__name__)


RESEARCH_PROMPT = """You are a legal research assistant specializing in Indian Law.

Your role is to provide accurate, well-cited answers to legal queries for advocates, lawyers, and law students.

{memory_context}

**Context from Search:**
{context}

**Query:**
{query}

**Instructions:**
1. Answer based on the provided context
2. Cite sources using [Number] format
3. Distinguish between Statutes (Acts/Sections) and Case Law (Precedents)
4. If context is insufficient, acknowledge it and provide general legal principles
5. Be professional, precise, and legally sound
6. For students: explain concepts clearly
7. For practitioners: focus on practical application

**Answer:**"""


class ResearchAgent(BaseAgent):
    """
    Research Agent for handling simple legal queries.
    
    Workflow:
    1. Retrieve relevant memories for user context
    2. Enhance query for better search
    3. Search database (fallback to web)
    4. Cache results in session
    5. Generate answer
    6. Store key facts in memory
    """
    
    def __init__(self, mode: str = "fast"):
        """Initialize with specified LLM mode."""
        super().__init__(mode=mode)
        self.session_cache = get_session_cache()
    
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute research workflow.
        
        Args:
            state: AgentState dictionary
            
        Returns:
            Updated state with context and answer
        """
        # Get task from router (for complex queries) or fallback to original
        task = state.get("agent_tasks", {}).get("research_agent", {})
        query = task.get("instruction", state.get("original_query", ""))
        
        user_id = state.get("user_id")
        session_id = state.get("session_id", "default")
        
        logger.info(f"🔬 ResearchAgent processing: {query[:50]}...")
        
        # 1. Get memory context
        memory_context = ""
        if MEM0_ENABLED and user_id:
            try:
                memory_mgr = UserMemoryManager(user_id)
                memories = memory_mgr.search(query, limit=3)
                memory_context = memory_mgr.format_for_context(memories)
            except Exception as e:
                logger.warning(f"Memory retrieval failed: {e}")
        
        # 2. Enhance query
        enhanced_query = self.enhance_query(query, agent_type="law")
        logger.info(f"Enhanced query: {enhanced_query}")
        
        # 3. Search (DB or Web)
        context_str, search_results = search_tool.run(enhanced_query)
        
        # 4. Cache results in session
        if search_results and session_id:
            self.session_cache.add_documents(session_id, search_results)
        
        # 5. Rerank results (Search + Document Context)
        document_context = state.get("document_context", [])
        all_candidates = (search_results or []) + document_context
        
        if all_candidates:
            top_results = rerank_documents(query, all_candidates, top_n=10)
        else:
            top_results = []
        
        # Format context
        formatted_context = self._format_context(top_results)
        
        # 6. Generate answer
        prompt = ChatPromptTemplate.from_template(RESEARCH_PROMPT)
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            answer = chain.invoke({
                "memory_context": memory_context,
                "context": formatted_context,
                "query": query
            })
        except Exception as e:
            logger.error(f"Answer generation failed: {e}")
            answer = f"I encountered an error while generating the answer: {e}"
        
        # 7. Store in memory
        if MEM0_ENABLED and user_id and answer:
            try:
                memory_mgr = UserMemoryManager(user_id)
                memory_mgr.add([
                    {"role": "user", "content": query},
                    {"role": "assistant", "content": answer[:500]}
                ])
            except Exception as e:
                logger.warning(f"Memory storage failed: {e}")
        
        # 8. Return result based on complexity
        complexity = state.get("complexity", "simple")
        
        result = {
            "law_context": top_results,
            "memory_context": [{"content": memory_context}] if memory_context else []
        }
        
        # Only return final_answer if we are the sole agent (simple mode)
        if complexity != "complex":
            result["final_answer"] = answer
        else:
            # In complex mode, return answer as a tool result for the manager to aggregate
            result["tool_results"] = [{
                "agent": "research_agent",
                "type": "research",
                "content": answer
            }]
            
        return result
    
    def _format_context(self, results: List[Dict]) -> str:
        """Format search results for prompt."""
        if not results:
            return "No relevant documents found."
        
        context_parts = []
        for i, doc in enumerate(results, 1):
            title = doc.get('title', 'Unknown')
            source = doc.get('source', 'Web')
            url = doc.get('url', '')
            text = doc.get('search_hit') or doc.get('snippet') or doc.get('text', '')
            
            context_parts.append(
                f"[{i}] **{title}** ({source})\n"
                f"URL: {url}\n"
                f"{text[:800]}\n"
            )
        
        return "\n---\n".join(context_parts)


# Singleton instance
research_agent = ResearchAgent()
