from typing import Dict, Any
from .base_agent import BaseAgent
from ..tools.db_search import search_tool
from ..tools.reranker import rerank_documents
from ..config import PREFERRED_DOMAINS

class LawAgent(BaseAgent):
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes the Law Agent workflow.
        Retrieves statutory context based on assigned task.
        """
        # Get specific instruction from router's agent_tasks
        task = state.get("agent_tasks", {}).get("law_agent", {})
        instruction = task.get("instruction", "")
        
        if not instruction:
            # Fallback to original query if no specific task
            instruction = state.get("original_query", "")
        
        if not instruction:
            return {"law_context": []}
            
        print(f"⚖️ Law Agent Task: {instruction[:80]}...")
        
        # 1. Enhance Query
        enhanced_query = self.enhance_query(instruction, "law")
        print(f"   Enhanced: {enhanced_query[:80]}...")
        
        # 2. Define Domains
        domains = PREFERRED_DOMAINS 
        
        # 3. Hybrid Search Strategy (DB + Web Aggregation)
        # Inspired by robust "Branch 2" logic
        all_results = []
        
        # A. Primary Search (DB preferred, auto-fallback to Web if empty)
        _, primary_results = search_tool.run(enhanced_query, domains)
        all_results.extend(primary_results)
        
        # B. Web Augmentation
        # If primary search came from Local DB, we force a Web Search to ensure completeness (e.g. missing Acts)
        # If primary search already fell back to Web (source != Database), we skip to avoid dupes/cost.
        is_local_result = primary_results and primary_results[0].get('source') == "Database"
        
        if is_local_result:
            print(f"   🌐 Logic: DB results found. Augmenting with Web Search for completeness...")
            try:
                from ..tools.web_search import web_search_tool
                _, web_results = web_search_tool.run(enhanced_query, domains)
                all_results.extend(web_results)
            except Exception as e:
                print(f"   ⚠️ Web augmentation failed: {e}")
        
        # 4. Rerank against original instruction
        # (Reranker handles the combined list)
        reranked = rerank_documents(instruction, all_results, top_n=10)
        
        # 5. Return update
        return {"law_context": reranked} 

law_agent = LawAgent()

