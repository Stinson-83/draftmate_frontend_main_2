"""
Lex Bot v2 - LangGraph Workflow (Hierarchical Routing)

Flow:
1. Memory Recall - Fetch relevant user memories (if enabled)
2. Router - Classify query as Simple or Complex
3a. SIMPLE PATH: ResearchAgent -> Final Answer
3b. COMPLEX PATH: 
    - Manager Decompose (selects agents)
    - Fan-out to selected agents (Law, Case, Citation, Strategy)
    - Manager Aggregate
4. Memory Store - Save key facts

Architecture:
    ┌─────────────────┐
    │  Memory Recall  │
    └────────┬────────┘
             ▼
    ┌─────────────────┐
    │     Router      │ (classify_and_route)
    └────────┬────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼ (SIMPLE)        ▼ (COMPLEX)
┌──────────┐   ┌─────────────────┐
│ Research │   │Manager Decompose│
│  Agent   │   └────────┬────────┘
└────┬─────┘            │
     │         ┌────────┼────────┬────────┐
     │         ▼        ▼        ▼        ▼
     │    ┌─────┐  ┌──────┐ ┌────────┐ ┌────────┐
     │    │ Law │  │ Case │ │Citation│ │Strategy│
     │    └──┬──┘  └──┬───┘ └───┬────┘ └───┬────┘
     │       └────────┴─────────┴──────────┘
     │                     │
     │                     ▼
     │             ┌─────────────────┐
     │             │Manager Aggregate│
     │             └────────┬────────┘
     │                      │
     └──────────┬───────────┘
                ▼
       ┌─────────────────┐
       │  Memory Store   │
       └────────┬────────┘
                ▼
              [END]
"""

from typing import Dict, Any, List, Literal
from langgraph.graph import StateGraph, END
from .state import AgentState
from .agents.manager import manager_agent
from .agents.law_agent import law_agent
from .agents.case_agent import case_agent
from .agents.research_agent import research_agent
from .agents.citation_agent import citation_agent
from .agents.strategy_agent import strategy_agent
from .agents.explainer_agent import explainer_agent
from .agents.document_agent import document_agent
from .memory import UserMemoryManager
from .config import MEM0_ENABLED


def memory_recall_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch relevant memories for context enrichment.
    """
    user_id = state.get("user_id")
    if not user_id or not MEM0_ENABLED:
        return {"memory_context": []}
    
    try:
        memory_manager = UserMemoryManager(user_id=user_id)
        query = state.get("original_query", "")
        memories = memory_manager.search(query, limit=5)
        
        if memories:
            print(f"📚 Retrieved {len(memories)} relevant memories for user {user_id}")
        
        return {"memory_context": memories}
    except Exception as e:
        print(f"⚠️ Memory recall failed: {e}")
        return {"memory_context": []}


def memory_store_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Store key facts from the conversation for future reference.
    """
    user_id = state.get("user_id")
    if not user_id or not MEM0_ENABLED:
        return {}
    
    try:
        memory_manager = UserMemoryManager(user_id=user_id)
        
        # Create conversation context to store
        messages = [
            {"role": "user", "content": state.get("original_query", "")},
            {"role": "assistant", "content": state.get("final_answer", "")[:1000]}  # Truncate
        ]
        
        memory_manager.add(messages)
        print(f"💾 Stored conversation to memory for user {user_id}")
        
        return {}
    except Exception as e:
        print(f"⚠️ Memory store failed: {e}")
        return {}


def define_graph():
    """
    Build and compile the LangGraph workflow with hierarchical routing.
    """
    workflow = StateGraph(AgentState)
    
    # === NODES ===
    workflow.add_node("memory_recall", memory_recall_node)
    workflow.add_node("router", manager_agent.classify_and_route)
    
    # Simple path
    workflow.add_node("research_agent", research_agent.run)
    workflow.add_node("document_agent", document_agent.run)
    
    # Complex path - agents get tasks directly from router (no decompose needed)
    workflow.add_node("law_agent", law_agent.run)
    workflow.add_node("case_agent", case_agent.run)
    workflow.add_node("citation_agent", citation_agent.run)
    workflow.add_node("strategy_agent", strategy_agent.run)
    workflow.add_node("explainer_agent", explainer_agent.run)
    workflow.add_node("manager_aggregate", manager_agent.generate_response)
    
    # Memory
    workflow.add_node("memory_store", memory_store_node)
    
    # Clarification check for complex queries
    workflow.add_node("check_clarification", manager_agent.check_needs_clarification)
    
    # === EDGES ===
    # Entry point
    workflow.set_entry_point("memory_recall")
    workflow.add_edge("memory_recall", "router")
    
    # Router -> Simple or Complex (with clarification check)
    def route_by_complexity(state: AgentState) -> Literal["research_agent", "check_clarification", "document_agent"]:
        """Route based on query complexity."""
        # Only route to document agent if we haven't processed it yet
        if state.get("uploaded_file_path") and not state.get("document_context"):
            return "document_agent"
            
        complexity = state.get("complexity", "simple")
        if complexity == "complex":
            return "check_clarification"
        return "research_agent"
    
    workflow.add_conditional_edges(
        "router",
        route_by_complexity,
        {
            "research_agent": "research_agent",
            "check_clarification": "check_clarification",
            "document_agent": "document_agent"
        }
    )
    
    # Clarification check -> either ask for clarification (end) or proceed to agents
    def route_after_clarification(state: AgentState) -> Literal["law_agent", "case_agent", "citation_agent", "strategy_agent", "explainer_agent", "research_agent", "manager_aggregate", "memory_store"]:
        """Route based on whether clarification is needed."""
        if state.get("needs_clarification", False):
            # Skip to memory store (final_answer already set with questions)
            return "memory_store"
        
        # Go directly to agents - router already assigned tasks
        selected = state.get("selected_agents", [])
        if selected:
            # Return first agent in list (conditional edges must return single node)
            # The actual fan-out happens in the next conditional
            return selected[0] if selected else "manager_aggregate"
        return "manager_aggregate"
    
    # For complex queries after clarification -> dynamic fan-out to selected agents
    def route_to_agents(state: AgentState) -> List[str]:
        """Route to selected agents based on router's assignment."""
        selected = state.get("selected_agents", [])
        
        # Validate only
        valid = ["research_agent", "explainer_agent", "law_agent", "case_agent", "citation_agent", "strategy_agent"]
        routes = [a for a in selected if a in valid]
        
        # Fallback
        if not routes:
            return ["law_agent", "case_agent"]
        
        return routes
    
    # Add conditional fan-out from check_clarification to all possible agents
    workflow.add_conditional_edges(
        "check_clarification",
        route_to_agents,

        ["research_agent", "explainer_agent", "law_agent", "case_agent", "citation_agent", "strategy_agent"]
    )
    
    # Fan-in: All complex agents -> Manager Aggregate
    workflow.add_edge("law_agent", "manager_aggregate")
    workflow.add_edge("case_agent", "manager_aggregate")
    workflow.add_edge("citation_agent", "manager_aggregate")
    workflow.add_edge("strategy_agent", "manager_aggregate")
    workflow.add_edge("explainer_agent", "manager_aggregate")
    
    # Simple path: Research -> Memory Store
    workflow.add_edge("research_agent", "memory_store")
    
    # Document Agent -> Router (to decide next steps with new context)
    workflow.add_edge("document_agent", "router")
    
    # Aggregate -> Memory Store -> END
    workflow.add_edge("manager_aggregate", "memory_store")
    workflow.add_edge("memory_store", END)
    
    return workflow.compile()


# Compile the graph
app = define_graph()


# Convenience function for direct invocation
def run_query(
    query: str,
    user_id: str = None,
    session_id: str = None,
    llm_mode: str = "fast",
    file_path: str = None
) -> Dict[str, Any]:
    """
    Run a legal research query through the agent workflow.
    
    Args:
        query: User's legal research query
        user_id: Optional user ID for memory personalization
        session_id: Optional session ID for conversation tracking
        llm_mode: "fast" or "reasoning"
    
    Returns:
        Final state with answer and context
    """
    initial_state = {
        "messages": [],
        "original_query": query,
        "user_id": user_id,
        "session_id": session_id,
        "llm_mode": llm_mode,
        "uploaded_file_path": file_path,
        "complexity": None,
        "selected_agents": [],
        "law_context": [],
        "case_context": [],
        "tool_results": [],
        "errors": [],
    }
    
    result = app.invoke(initial_state)
    return result


if __name__ == "__main__":
    # Quick test
    print("🚀 Testing Lex Bot v2 Graph...")
    result = run_query("What is Section 302 IPC?")
    print("\n📝 Answer:")
    print(result.get("final_answer", "No answer generated"))

