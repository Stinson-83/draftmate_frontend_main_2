from typing import Dict, Any
from .base_agent import BaseAgent
from ..tools.web_search import web_search_tool
from ..tools.reranker import rerank_documents
from ..config import TARGET_CASE_SITE

class CaseAgent(BaseAgent):
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the Case Agent workflow.
        Retrieves case law context based on assigned task.
        """
        # Get specific instruction from router's agent_tasks
        task = state.get("agent_tasks", {}).get("case_agent", {})
        instruction = task.get("instruction", "")
        
        if not instruction:
            # Fallback to original query if no specific task
            instruction = state.get("original_query", "")
        
        if not instruction:
            return {"case_context": []}
            
        print(f"🏛️ Case Agent Task: {instruction[:80]}...")
        
        # 1. Enhance Query
        enhanced_query = self.enhance_query(instruction, "case")
        print(f"   Enhanced: {enhanced_query[:80]}...")
        
        # 2. Define Domains - prioritize Indian Kanoon
        domains = [TARGET_CASE_SITE]
        
        # 3. Web Search
        context_str, results = web_search_tool.run(enhanced_query, domains)
        
        # 4. Rerank against original instruction
        reranked = rerank_documents(instruction, results, top_n=10)
        
        # 5. Return update
        return {"case_context": reranked}

case_agent = CaseAgent()

