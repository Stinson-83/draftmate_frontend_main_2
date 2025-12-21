"""
Legal Strategy Agent - Outlines arguments for legal positions

Helps advocates analyze cases and develop legal strategies.
"""

from typing import Dict, Any, List
import logging

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from lex_bot.agents.base_agent import BaseAgent
from lex_bot.tools.db_search import search_tool
from lex_bot.tools.reranker import rerank_documents

logger = logging.getLogger(__name__)


STRATEGY_PROMPT = """You are a Senior Legal Advocate with 25+ years of experience in Indian courts.

You are analyzing a case to develop a legal strategy. Think like a seasoned litigator.

**Case/Query:**
{query}

**Relevant Legal Context:**
{context}

**Your Task:**
Provide a comprehensive legal strategy analysis with:

## 1. Issue Identification
- Key legal issues in this matter
- Sub-issues that need to be addressed

## 2. Arguments FOR (Petitioner/Plaintiff Perspective)
- Strong legal arguments
- Supporting precedents from context
- Constitutional/statutory basis

## 3. Arguments AGAINST (Respondent/Defendant Perspective)
- Counter-arguments to anticipate
- Potential weaknesses in the case
- Precedents that may work against

## 4. Key Precedents
- Most relevant cases from context
- How they apply to this situation
- Distinguish any adverse precedents

## 5. Strategic Recommendations
- Strongest approach to take
- Evidence/documents to gather
- Potential procedural advantages

## 6. Risk Assessment
- Weaknesses to address
- Likelihood of success (High/Medium/Low with reasoning)

Be thorough, practical, and cite specific sections/cases from the context where applicable."""


class LegalStrategyAgent(BaseAgent):
    """
    Legal Strategy Agent for complex case analysis.
    
    Provides:
    - Arguments for and against a legal position
    - Precedent analysis
    - Strategic recommendations
    - Risk assessment
    """
    
    def __init__(self, mode: str = "reasoning"):
        """Initialize with reasoning mode for complex analysis."""
        super().__init__(mode=mode)
    
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute strategy analysis workflow.
        
        Args:
            state: AgentState dictionary
            
        Returns:
            Updated state with strategy analysis
        """
        # Get task from router
        task = state.get("agent_tasks", {}).get("strategy_agent", {})
        query = task.get("instruction", state.get("original_query", ""))
        
        logger.info(f"⚖️ StrategyAgent analyzing: {query[:50]}...")
        
        # Search for relevant context
        law_query = f"legal provisions sections act {query}"
        case_query = f"case law precedent judgment {query}"
        
        # Get law context
        _, law_results = search_tool.run(law_query)
        # Get case context
        _, case_results = search_tool.run(case_query)
        
        # Combine and rerank
        all_results = (law_results or []) + (case_results or [])
        top_results = rerank_documents(query, all_results, top_n=15)
        
        # Format context
        context = self._format_context(top_results)
        
        # Generate strategy
        prompt = ChatPromptTemplate.from_template(STRATEGY_PROMPT)
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            strategy = chain.invoke({
                "query": query,
                "context": context
            })
        except Exception as e:
            logger.error(f"Strategy generation failed: {e}")
            strategy = f"Strategy analysis failed: {e}"
        
        return {
            "tool_results": [{
                "agent": "strategy",
                "type": "legal_strategy",
                "content": strategy
            }],
            "law_context": top_results[:5],
            "case_context": top_results[5:10] if len(top_results) > 5 else []
        }
    
    def _format_context(self, results: List[Dict]) -> str:
        """Format results for strategy prompt."""
        if not results:
            return "No relevant legal context found. Proceed with general legal principles."
        
        parts = []
        for i, doc in enumerate(results, 1):
            title = doc.get('title', 'Unknown')
            text = doc.get('search_hit') or doc.get('snippet') or doc.get('text', '')
            source = doc.get('source', 'Unknown')
            
            parts.append(f"[{i}] {title} ({source}):\n{text[:600]}")
        
        return "\n\n---\n\n".join(parts)


# Singleton
strategy_agent = LegalStrategyAgent()
