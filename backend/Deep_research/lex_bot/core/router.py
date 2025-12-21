"""
Query Router - Classifies queries and orchestrates agent tasks

Key features:
- Classifies Simple vs Complex
- Assigns specific tasks to agents with task_id
- Defines dependencies for parallel/sequential execution
- Provides synthesis instructions for final LLM
"""

from typing import Literal, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from lex_bot.core.llm_factory import get_llm


ROUTER_PROMPT = """You are an intelligent legal query classifier for an Indian law research system.

Your job: Classify complexity, assign agents, give SPECIFIC instructions for THIS query.

═══════════════════════════════════════════════════════════════
CLASSIFICATION
═══════════════════════════════════════════════════════════════

**SIMPLE** (single-agent): Direct lookups, definitions, single case/section queries
**COMPLEX** (multi-agent): Comparisons, strategy, argument building, multi-step analysis

═══════════════════════════════════════════════════════════════
AGENTS
═══════════════════════════════════════════════════════════════
- research: RAG + web search for facts, overviews
- law: Statutory provisions, bare acts, amendments
- case: Judgments, ratio decidendi, precedents
- strategy: Legal arguments, defense/prosecution tactics
- citation: Citation networks, overruling analysis
- explainer: Plain-language simplification

═══════════════════════════════════════════════════════════════
QUERY: {query}
═══════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════
RESPONSE FORMAT (JSON only)
═══════════════════════════════════════════════════════════════
{{
    "complexity": "simple" | "complex",
    "reasoning": "Why this classification and these agents",
    "agent_tasks": [
        {{
            "agent": "agent_name",
            "task_id": "unique_id",
            "instruction": "SPECIFIC task for THIS query (include numbers, sections, timeframes)",
            "expected_output": "What format to return (list, table, summary, etc.)",
            "dependencies": []
        }}
    ],
    "synthesis_instruction": "How final LLM should combine outputs",
    "synthesis_strategy": "equal_weight | case_law_primary | statute_primary | strategy_focused",
    "domain_tags": ["criminal", "civil", "constitutional", etc.]
}}

═══════════════════════════════════════════════════════════════
INSTRUCTION RULES
═══════════════════════════════════════════════════════════════
1. BE SPECIFIC: "Find 5 SC judgments on Section 302" not "Find relevant cases"
2. NO OVERLAP: Each agent has distinct task
3. PARALLEL BY DEFAULT: Use dependencies=[] unless agent truly needs another's output
4. SET BOUNDARIES: Exact sections, timeframes, jurisdictions, result counts
5. DEFINE OUTPUT: Tell agents whether to return lists, tables, summaries, citations

═══════════════════════════════════════════════════════════════
EXAMPLE (Complex)
═══════════════════════════════════════════════════════════════
Query: "Defense options for Section 138 NI Act"

{{
    "complexity": "complex",
    "reasoning": "Needs statute, case law, and strategy formulation",
    "agent_tasks": [
        {{"agent": "law", "task_id": "stat", "instruction": "Get Section 138, 139 NI Act. List all offense conditions.", "expected_output": "Numbered conditions list", "dependencies": []}},
        {{"agent": "case", "task_id": "cases", "instruction": "Find 5 acquittal cases under Section 138 (2020-2024). Extract grounds.", "expected_output": "5 cases with acquittal grounds", "dependencies": []}},
        {{"agent": "strategy", "task_id": "defense", "instruction": "Formulate 7 defense strategies (procedural + substantive) with case citations.", "expected_output": "Numbered strategies with citations", "dependencies": ["stat", "cases"]}}
    ],
    "synthesis_instruction": "Structure: (1) Offense elements, (2) Defense strategies by category, (3) Case support, (4) Practical tips",
    "synthesis_strategy": "strategy_focused",
    "domain_tags": ["criminal", "negotiable_instruments"]
}}

═══════════════════════════════════════════════════════════════
EXAMPLE (Simple)  
═══════════════════════════════════════════════════════════════
Query: "Define cognizable offense"

{{
    "complexity": "simple",
    "reasoning": "Single definition, one agent sufficient",
    "agent_tasks": [
        {{"agent": "explainer", "task_id": "def", "instruction": "Define cognizable offense with CrPC reference. Compare with non-cognizable. Give 3 examples each.", "expected_output": "Definition + examples in plain language", "dependencies": []}}
    ],
    "synthesis_instruction": "Clear definition with practical examples",
    "synthesis_strategy": "equal_weight",
    "domain_tags": ["criminal_procedure"]
}}
"""


class QueryRouter:
    """Routes queries to appropriate agents based on complexity."""
    
    def __init__(self, mode: Literal["fast", "reasoning"] = "fast"):
        self.llm = get_llm(mode=mode)
        self.prompt = ChatPromptTemplate.from_template(ROUTER_PROMPT)
        self.chain = self.prompt | self.llm | JsonOutputParser()
    
    def classify(self, query: str) -> Dict[str, Any]:
        """Classify a query and get agent task assignments."""
        try:
            result = self.chain.invoke({"query": query})
            
            # Validate
            if result.get("complexity") not in ["simple", "complex"]:
                result["complexity"] = "simple"
            
            if not result.get("agent_tasks"):
                result["agent_tasks"] = [{"agent": "research", "task_id": "fallback", "instruction": query, "expected_output": "General answer", "dependencies": []}]
            
            return result
            
        except Exception as e:
            print(f"⚠️ Router failed: {e}")
            return {
                "complexity": "simple",
                "reasoning": f"Fallback: {e}",
                "agent_tasks": [{"agent": "research", "task_id": "fallback", "instruction": query, "expected_output": "General answer", "dependencies": []}],
                "synthesis_instruction": "Provide helpful response",
                "synthesis_strategy": "equal_weight",
                "domain_tags": ["general"]
            }
    
    def is_complex(self, query: str) -> bool:
        return self.classify(query).get("complexity") == "complex"


# Singleton
_router = None

def get_router(mode: Literal["fast", "reasoning"] = "fast") -> QueryRouter:
    global _router
    if _router is None:
        _router = QueryRouter(mode=mode)
    return _router
