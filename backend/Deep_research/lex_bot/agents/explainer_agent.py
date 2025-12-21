"""
Explainer Agent - Simplifies legal concepts for students

Makes complex legal topics accessible and educational.
"""

from typing import Dict, Any, List
import logging

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from lex_bot.agents.base_agent import BaseAgent
from lex_bot.tools.db_search import search_tool
from lex_bot.tools.latin_phrases import LatinPhraseTool
from lex_bot.tools.penal_code_lookup import PenalCodeLookup

logger = logging.getLogger(__name__)


EXPLAINER_PROMPT = """You are a Law Professor explaining concepts to first-year law students in India.

Your teaching style:
- Use simple, clear language
- Provide real-world analogies
- Break down complex concepts step-by-step
- Use examples from Indian law
- Define Latin terms when used
- Connect theory to practical application

**Student's Question:**
{query}

**Reference Material:**
{context}

**Latin Terms (if relevant):**
{latin_context}

**Your Explanation:**
Provide a comprehensive yet accessible explanation:

## Simple Explanation
Start with a one-paragraph simple explanation that anyone can understand.

## Detailed Breakdown
Break down the concept into digestible parts with examples.

## Key Points to Remember
Bullet points of the most important takeaways.

## Practical Example
A hypothetical scenario showing how this applies in real life.

## Related Concepts
Briefly mention related topics the student should explore.

Remember: You're teaching, not showing off. Clarity over complexity."""


class ExplainerAgent(BaseAgent):
    """
    Explainer Agent for law students.
    
    Features:
    - Simplifies complex legal concepts
    - Explains Latin phrases
    - Provides examples and analogies
    - Educational and accessible tone
    """
    
    def __init__(self, mode: str = "fast"):
        """Initialize with fast mode for quick explanations."""
        super().__init__(mode=mode)
        self.latin_tool = LatinPhraseTool()
        self.penal_tool = PenalCodeLookup()
    
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute explanation workflow.
        
        Args:
            state: AgentState dictionary
            
        Returns:
            Updated state with explanation
        """
        # Get task from router
        task = state.get("agent_tasks", {}).get("explainer_agent", {})
        query = task.get("instruction", state.get("original_query", ""))
        
        logger.info(f"📚 ExplainerAgent explaining: {query[:50]}...")
        
        # Check if it's a Latin phrase query
        latin_context = ""
        latin_results = self.latin_tool.search(query, max_results=3)
        if latin_results:
            latin_context = "\n".join([
                f"- **{r['phrase']}**: {r.get('meaning', '')} - {r.get('usage', '')}"
                for r in latin_results
            ])
        
        # Check if it's a section query
        section_context = ""
        import re
        section_match = re.search(r'section\s*(\d+[A-Za-z]?)', query, re.IGNORECASE)
        if section_match:
            section = section_match.group(1)
            result = self.penal_tool.get_section(section)
            if result:
                section_context = self.penal_tool.format_section(result)
        
        # Get general context
        _, search_results = search_tool.run(query)
        context = self._format_context(search_results[:5])
        
        # Add section context if found
        if section_context:
            context = f"**Relevant Section:**\n{section_context}\n\n{context}"
        
        # Generate explanation
        prompt = ChatPromptTemplate.from_template(EXPLAINER_PROMPT)
        chain = prompt | self.llm | StrOutputParser()
        
        try:
            explanation = chain.invoke({
                "query": query,
                "context": context,
                "latin_context": latin_context or "No specific Latin terms identified."
            })
        except Exception as e:
            logger.error(f"Explanation generation failed: {e}")
            explanation = f"Failed to generate explanation: {e}"
        
        return {
            "tool_results": [{
                "agent": "explainer",
                "type": "explanation",
                "content": explanation,
                "latin_terms": latin_results,
                "section_info": section_context
            }]
        }
    
    def _format_context(self, results: List[Dict]) -> str:
        """Format context for explanation."""
        if not results:
            return "General legal knowledge will be applied."
        
        parts = []
        for i, doc in enumerate(results[:5], 1):
            title = doc.get('title', 'Unknown')
            text = doc.get('snippet') or doc.get('text', '')
            parts.append(f"[{i}] {title}:\n{text[:400]}")
        
        return "\n\n".join(parts)


# Singleton
explainer_agent = ExplainerAgent()
