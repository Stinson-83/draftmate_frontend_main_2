"""
Citation Agent - Traces case citation networks and statutory references.

Finds how cases have been cited, affirmed, distinguished, or overruled.
Now capable of analyzing statutory citations (IPC/BNS).
"""

from typing import Dict, Any, List
import logging
import re

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from lex_bot.agents.base_agent import BaseAgent
from lex_bot.tools.indian_kanoon import IndianKanoonScraper
from lex_bot.tools.penal_code_lookup import PenalCodeLookup

logger = logging.getLogger(__name__)


CITATION_PROMPT = """You are a legal research specialist analyzing citation networks in Indian case law.

**Case Being Analyzed:** (if applicable)
{case_name}

**Statutory References Detected:**
{statutes}

**Cases That Cite This Case / Statute:**
{citing_cases}

**Your Analysis:**
Provide a structured analysis of how this legal precedent or statute has been interpreted.

## 1. Citation Summary
Overview of how this case/statute is treated by courts.

## 2. Treatment Analysis
Categorize the citations:
- **Followed/Approved**: Cases that followed this precedent
- **Distinguished**: Cases that acknowledged but distinguished this case
- **Questioned/Overruled**: Cases that questioned or overruled it

## 3. Statutory Interpretation (Crucial)
How have courts interpreted the specific Sections mentioned ({statutes})?
- Did they expand or restrict the scope?
- Any constitutional challenges?

## 4. Practitioner Note
Is this still good law? What caution should a lawyer exercise?
"""


class CitationAgent(BaseAgent):
    """
    Citation Network Agent for tracing case precedents and statute usage.
    """
    
    def __init__(self, mode: str = "reasoning"):
        """Initialize with reasoning mode for analysis."""
        super().__init__(mode=mode)
        self.kanoon = IndianKanoonScraper()
        self.statute_lookup = PenalCodeLookup()
    
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute citation analysis workflow.
        Returns 'citation_context' for synthesis.
        """
        # Get task from router
        task = state.get("agent_tasks", {}).get("citation_agent", {})
        instruction = task.get("instruction", "")
        
        if not instruction:
            # Fallback
            instruction = state.get("original_query", "")
        
        logger.info(f"🔗 CitationAgent Task: {instruction[:60]}...")
        
        # 1. Extract potential case name and sections
        case_name = self._extract_case_name(instruction)
        sections = self._extract_sections(instruction)
        
        # 2. Look up statutes
        statute_details = []
        if sections:
            for sec in sections:
                info = self.statute_lookup.get_section(sec)
                if info:
                    statute_details.append(f"Section {info.get('section')} {info.get('code')}: {info.get('offense')}")
        
        statute_str = "\n".join(statute_details) if statute_details else "No specific sections identified."
        
        # 3. Search for Citing Cases (Priority: Case Name -> Statute)
        citing_results = []
        main_case_title = case_name
        
        if case_name and len(case_name) > 5:
            # Search for cases citing the specific case
            citing_query = f'"{case_name}" cited'
            citing_results = self.kanoon.search(citing_query, max_results=8)
        elif sections:
            # Search for cases citing the statute
            sec_query = f'Section {sections[0]} cited'
            citing_results = self.kanoon.search(sec_query, max_results=8)
            main_case_title = f"Statutes: {', '.join(sections)}"
        
        if not citing_results:
            logger.warning("No citing cases found.")
            return {
                "citation_context": [{"content": "No citation data found.", "source": "CitationAgent"}]
            }
            
        # 4. Generate Analysis using LLM
        citing_context = self._format_citing_cases(citing_results)
        
        prompt = ChatPromptTemplate.from_template(CITATION_PROMPT)
        chain = prompt | self.llm | StrOutputParser()
        
        analysis = "Analysis failed."
        try:
            analysis = chain.invoke({
                "case_name": main_case_title,
                "statutes": statute_str,
                "citing_cases": citing_context
            })
        except Exception as e:
            logger.error(f"Citation analysis failed: {e}")
        
        # 5. Return as context for Manager
        return {
            "citation_context": [{
                "content": analysis,
                "source": "CitationAgent",
                "meta": {
                    "case": main_case_title, 
                    "statutes": sections,
                    "citing_cases_count": len(citing_results)
                }
            }]
        }
    
    def _extract_case_name(self, text: str) -> str:
        """Extract potential case name."""
        # Simple heuristic: remove common words
        clean = re.sub(r'(citation|citations|cited|cite|how|has|been|of|the|case|section|ipc|bns|act)\s*', '', text, flags=re.IGNORECASE)
        return clean.strip()

    def _extract_sections(self, text: str) -> List[str]:
        """Extract section numbers (e.g., '302', '103')."""
        matches = re.findall(r'\b(\d+[A-Za-z]?)\b', text)
        return matches[:3] # Limit to top 3
    
    def _format_citing_cases(self, cases: List[Dict]) -> str:
        """Format citing cases for analysis."""
        parts = []
        for i, case in enumerate(cases, 1):
            title = case.get('title', 'Unknown')
            snippet = case.get('snippet', '')[:250]
            parts.append(f"{i}. **{title}**\n   {snippet}")
        return "\n\n".join(parts)


# Singleton
citation_agent = CitationAgent()
