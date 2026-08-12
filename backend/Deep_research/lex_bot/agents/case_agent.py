from typing import Dict, Any
from .base_agent import BaseAgent
from ..tools import indian_kanoon_api as ik

class CaseAgent(BaseAgent):
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Retrieves case law from Indian Kanoon API (replaced HTML scraping).
        """
        task = state.get("agent_tasks", {}).get("case_agent", {})
        instruction = task.get("instruction", "") or state.get("original_query", "")

        if not instruction:
            return {"case_context": []}

        try:
            print(f"🏛️ Case Agent Task: {instruction[:80]}...")

            enhanced_query = self.enhance_query(instruction, "case")
            print(f"   Enhanced: {enhanced_query[:80]}...")

            results = ik.search(enhanced_query, max_results=10)

            # Fallback to web search if IK API returned nothing
            if not results:
                from ..tools.web_search import web_search_tool
                _, results = web_search_tool.run(enhanced_query)

            return {"case_context": results[:15]}
        except Exception as e:
            print(f"❌ Case Agent Failed: {e}")
            return {"case_context": [], "errors": [f"Case Agent failed: {str(e)}"]}

case_agent = CaseAgent()

