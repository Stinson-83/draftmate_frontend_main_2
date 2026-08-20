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


import time as _time
from cachetools import TTLCache

# ============ Cached UserMemoryManager ============
# Avoids re-initializing mem0's embedding model on every request.
# TTL ensures stale managers are eventually garbage collected.
_user_memory_cache: Dict[str, tuple] = {}  # user_id -> (UserMemoryManager, timestamp)
_MEMORY_CACHE_TTL = 300  # 5 minutes

# ============ Memory Results Cache ============
# Caches mem0 search results per user for 3 minutes.
# Eliminates repeated 3-8s mem0 searches for every message in a session.
# Quality impact is minimal: long-term memories (profession, style, specialization)
# are stable across query topics within a session.
_memory_results_cache: TTLCache = TTLCache(maxsize=500, ttl=180)


def _get_memory_manager(user_id: str) -> "UserMemoryManager":
    """Get or create a cached UserMemoryManager for a user."""
    now = _time.monotonic()
    if user_id in _user_memory_cache:
        mgr, ts = _user_memory_cache[user_id]
        if now - ts < _MEMORY_CACHE_TTL:
            return mgr
    mgr = UserMemoryManager(user_id=user_id)
    _user_memory_cache[user_id] = (mgr, now)
    return mgr


def memory_recall_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch relevant memories for context enrichment.
    
    Optimizations:
    - Skips mem0 search on first message (no history = no useful memories)
    - Uses cached UserMemoryManager (avoids re-init per request)
    """
    user_id = state.get("user_id")
    if not user_id or not MEM0_ENABLED:
        return {"memory_context": []}
    
    # Gate: skip mem0 on first message — no conversation history means
    # no meaningful memories to retrieve yet
    messages = state.get("messages", [])
    if not messages:
        print(f"⚡ First message — skipping memory recall for user {user_id}")
        return {"memory_context": []}
    
    try:
        # Cache hit: skip mem0 entirely for messages after the first in a session
        if user_id in _memory_results_cache:
            cached = _memory_results_cache[user_id]
            print(f"⚡ Memory cache HIT for user {user_id} ({len(cached)} memories, skipping mem0)")
            return {"memory_context": cached}

        memory_manager = _get_memory_manager(user_id)
        query = state.get("original_query", "")
        memories = memory_manager.search(query, limit=5)

        if memories:
            print(f"📚 Retrieved {len(memories)} relevant memories for user {user_id}")

        # Cache results so subsequent messages skip the 3-8s mem0 call
        _memory_results_cache[user_id] = memories or []
        return {"memory_context": memories}
    except Exception as e:
        print(f"⚠️ Memory recall failed: {e}")
        return {"memory_context": []}


def memory_store_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Store key facts from the conversation for future reference.
    Uses cached UserMemoryManager (shared with memory_recall_node).
    """
    user_id = state.get("user_id")
    if not user_id or not MEM0_ENABLED:
        return {}
    
    try:
        memory_manager = _get_memory_manager(user_id)
        
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
    
    Optimized (Step 6): Clarification is now handled inside the router node.
    No separate check_clarification node needed — saves one LLM call.
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
    
    # === EDGES ===
    # Entry point
    workflow.set_entry_point("memory_recall")
    workflow.add_edge("memory_recall", "router")
    
    # Router → Document / Clarification / Complex fan-out / Simple
    def route_by_complexity(state: AgentState) -> Literal["research_agent", "document_agent", "memory_store", "law_agent", "case_agent", "citation_agent", "strategy_agent", "explainer_agent", "manager_aggregate"]:
        """Route based on query complexity and clarification status."""
        # Document agent takes priority if files are uploaded and not yet processed
        if state.get("uploaded_file_paths") and not state.get("document_context"):
            return "document_agent"
        
        # Clarification: router already set final_answer with questions → skip to end
        if state.get("needs_clarification", False):
            return "memory_store"
            
        complexity = state.get("complexity", "simple")
        if complexity == "complex":
            # Return first selected agent (fan-out handles the rest)
            selected = state.get("selected_agents", [])
            if selected:
                return selected[0]
            return "manager_aggregate"  # No agents selected → aggregate directly
        return "research_agent"
    
    # Fan-out: router routes to selected agents for complex queries
    def route_to_agents(state: AgentState) -> List[str]:
        """Route to selected agents based on router's assignment."""
        if state.get("needs_clarification", False):
            return ["__end__"]

        # complexity is the ground truth — if the LLM says SIMPLE, honour it
        # regardless of which agents it listed (the LLM often assigns agents
        # for simple queries when it shouldn't; that causes 3-agent overhead
        # on a question research_agent can answer alone in ~20s).
        complexity = state.get("complexity", "complex")
        if complexity == "simple":
            return ["research_agent"]

        selected = state.get("selected_agents", [])
        valid = {"explainer_agent", "law_agent", "case_agent", "citation_agent", "strategy_agent"}
        routes = [a for a in selected if a in valid]
        return routes if routes else ["law_agent", "case_agent"]
    
    workflow.add_conditional_edges(
        "router",
        route_to_agents,
        ["research_agent", "explainer_agent", "law_agent", "case_agent", "citation_agent", "strategy_agent", "__end__"]
    )
    
    # Fan-in: All complex agents → Manager Aggregate
    workflow.add_edge("law_agent", "manager_aggregate")
    workflow.add_edge("case_agent", "manager_aggregate")
    workflow.add_edge("citation_agent", "manager_aggregate")
    workflow.add_edge("strategy_agent", "manager_aggregate")
    workflow.add_edge("explainer_agent", "manager_aggregate")
    
    # Simple path: Research → END
    workflow.add_edge("research_agent", END)
    
    # Document Agent → END
    workflow.add_edge("document_agent", END)
    
    # Aggregate → END
    workflow.add_edge("manager_aggregate", END)
    
    return workflow.compile()


# Compile the graph
app = define_graph()


def prepare_initial_state(
    query: str,
    user_id: str = None,
    session_id: str = None,
    llm_mode: str = "fast",
    file_path: str = None,
    chat_store_instance=None,
    tracker=None
) -> dict:
    """Prepare the initial state for the graph."""
    if not tracker:
        from lex_bot.core.timing import LatencyTracker
        tracker = LatencyTracker()
        
    print(f"🔄 Preparing initial state for query: {query}")
    
    # Auto-detect file path from session cache if not provided
    uploaded_file_paths = []
    with tracker.step("file_detection"):
        if session_id:
            try:
                from lex_bot.tools.session_cache import get_session_cache
                cache = get_session_cache()
                
                # Get all paths
                paths = cache.get_file_paths(session_id)
                if paths:
                    uploaded_file_paths = paths
                    print(f"📂 Found {len(paths)} uploaded files in cache: {paths}")
                    
                # If explicit path provided, ensure it's in list (unlikely in normal flow but good for safety)
                if file_path and file_path not in uploaded_file_paths:
                    uploaded_file_paths.append(file_path)
                    
            except Exception as e:
                print(f"⚠️ Failed to check session cache for files: {e}")
        elif file_path:
            uploaded_file_paths = [file_path]

    # Fetch chat history FIRST (single source of truth)
    chat_history = []
    with tracker.step("history_fetch"):
        if user_id and session_id:
            try:
                if chat_store_instance:
                    store = chat_store_instance
                else:
                    from lex_bot.memory.chat_store import ChatStore
                    store = ChatStore()
                # Get last 10 messages
                history = store.get_session_history(user_id, session_id, limit=10)
                # Convert to LangChain format
                for msg in history:
                    chat_history.append({"role": msg["role"], "content": msg["content"]})
                print(f"📜 Loaded {len(chat_history)} previous messages for context")
            except Exception as e:
                print(f"⚠️ Failed to load chat history: {e}")

    # Rewrite query — pass pre-fetched history to avoid duplicate DB reads
    with tracker.step("query_rewrite"):
        from lex_bot.core.query_rewriter import rewrite_query
        print("🔄 Calling rewrite_query...")
        processed_query = rewrite_query(
            query, user_id=user_id, session_id=session_id,
            chat_history=chat_history
        )
        print(f"✅ Query rewritten to: {processed_query}")
    
    return {
        "messages": chat_history,
        "original_query": processed_query,  # Use rewritten query
        "user_id": user_id,
        "session_id": session_id,
        "llm_mode": llm_mode,
        "uploaded_file_paths": uploaded_file_paths,
        "complexity": None,
        "selected_agents": [],
        "law_context": [],
        "case_context": [],
        "tool_results": [],
        "errors": [],
    }

def run_query(
    query: str,
    user_id: str = None,
    session_id: str = None,
    llm_mode: str = "fast",
    file_path: str = None,
    chat_store_instance=None
) -> Dict[str, Any]:
    """
    Run a legal research query through the agent workflow.
    """
    from lex_bot.core.timing import LatencyTracker
    tracker = LatencyTracker()

    initial_state = prepare_initial_state(
        query=query,
        user_id=user_id,
        session_id=session_id,
        llm_mode=llm_mode,
        file_path=file_path,
        chat_store_instance=chat_store_instance,
        tracker=tracker
    )
    
    with tracker.step("graph_invoke"):
        print("🚀 Invoking graph app.invoke(initial_state)...")
        result = app.invoke(initial_state)
        print("✅ Graph invocation complete.")
        
    # Log latency breakdown
    tracker.summary()

    # Attach timing to result for API-level observability
    result["latency"] = tracker.as_dict()
    return result


if __name__ == "__main__":
    # Quick test
    print("🚀 Testing Lex Bot v2 Graph...")
    result = run_query("What is Section 302 IPC?")
    print("\n📝 Answer:")
    print(result.get("final_answer", "No answer generated"))

