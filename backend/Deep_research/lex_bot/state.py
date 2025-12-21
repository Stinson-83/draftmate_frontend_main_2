from typing import TypedDict, Annotated, List, Dict, Any, Optional, Literal
import operator


class AgentState(TypedDict):
    """
    State dictionary for the LangGraph workflow.
    
    Enhanced for Lex Bot v2 with:
    - User memory integration
    - Dual LLM modes
    - Query complexity routing
    - Dynamic agent selection
    """
    # Helper to merge lists (append) instead of overwrite
    messages: Annotated[List[Dict[str, str]], operator.add]
    
    # Original user query
    original_query: str
    
    # --- New v2 fields ---
    # User and session tracking
    user_id: Optional[str]
    user_id: Optional[str]
    session_id: Optional[str]
    uploaded_file_path: Optional[str]
    
    # LLM mode for this query
    llm_mode: Literal["fast", "reasoning"]
    
    # Query classification (hierarchical routing)
    complexity: Literal["simple", "complex"]
    
    # Dynamically selected agents for complex queries
    # e.g., ["law_agent", "case_agent", "citation_agent", "strategy_agent"]
    selected_agents: Optional[List[str]]
    
    # Specific tasks assigned to each agent by router
    # e.g., {"law_agent": {"task_id": "stat", "instruction": "...", "expected_output": "...", "dependencies": []}}
    agent_tasks: Optional[Dict[str, Dict[str, Any]]]
    
    # Synthesis instructions for final LLM (how to combine agent outputs)
    synthesis_instruction: Optional[str]
    synthesis_strategy: Optional[str]  # "equal_weight", "case_law_primary", "statute_primary", "strategy_focused"
    
    # Collected contexts from agents
    law_context: Annotated[List[Dict], operator.add]
    case_context: Annotated[List[Dict], operator.add]
    citation_context: Annotated[List[Dict], operator.add]  # Citation analysis results
    document_context: Annotated[List[Dict], operator.add]
    
    # Tool results from various agents
    tool_results: Annotated[List[Dict], operator.add]
    
    # Specialized agent results
    citation_result: Optional[Dict[str, Any]]
    strategy_result: Optional[Dict[str, Any]]
    
    # Memory context retrieved for this user
    memory_context: Optional[List[Dict]]
    
    # Final answer
    final_answer: Optional[str]
    
    # Error tracking
    errors: Annotated[List[str], operator.add]


