"""
Query Rewriter - Smart query rewriting with conversation context

Flow (Optimized - Single LLM pass):
1. Rule-based abbreviation expansion (~0ms)
2. If user has conversation context → single LLM call to classify + rewrite (~300ms)
3. If no context → return expanded query directly (~0ms)

Latency:
- No context / clear query: ~0ms
- Has context, needs rewrite: ~300ms (single LLM call)
"""

import re
import logging
from typing import Tuple, Optional, List, Dict

logger = logging.getLogger(__name__)
LEGAL_ABBREVIATIONS = {
    'ipc': 'Indian Penal Code',
    'crpc': 'Code of Criminal Procedure',
    'cpc': 'Code of Civil Procedure',
    'bns': 'Bharatiya Nyaya Sanhita',
    'bnss': 'Bharatiya Nagarik Suraksha Sanhita',
    'bsa': 'Bharatiya Sakshya Adhiniyam',
    'poa': 'Power of Attorney',
    'rbi': 'Reserve Bank of India',
    'sebi': 'Securities and Exchange Board of India',
    'gst': 'Goods and Services Tax',
    'fir': 'First Information Report',
    'pil': 'Public Interest Litigation',
    'sc': 'Supreme Court',
    'hc': 'High Court',
    'cji': 'Chief Justice of India',
    'adr': 'Alternative Dispute Resolution',
    'nia': 'National Investigation Agency',
    'cbi': 'Central Bureau of Investigation',
    'ed': 'Enforcement Directorate',
    'pmla': 'Prevention of Money Laundering Act',
    'uapa': 'Unlawful Activities Prevention Act',
    'pocso': 'Protection of Children from Sexual Offences',
    'nsa': 'National Security Act',
    'pasa': 'Prevention of Anti-Social Activities',
    'tada': 'Terrorist and Disruptive Activities',
}


# ============ Simple Abbreviation Expansion (No LLM) ============
def expand_abbreviations(query: str) -> str:
    """
    Expand known legal abbreviations without LLM call.
    Fast operation (~0ms).
    """
    result = query
    query_lower = query.lower()
    
    for abbr, full_form in LEGAL_ABBREVIATIONS.items():
        # Match whole word only
        pattern = rf'\b{abbr}\b'
        if re.search(pattern, query_lower, re.IGNORECASE):
            # Replace preserving case
            result = re.sub(pattern, full_form, result, flags=re.IGNORECASE)
    
    return result


def _build_context_string(
    user_id: str,
    query: str,
    session_id: str = None,
    chat_history: Optional[List[Dict]] = None,
) -> str:
    """
    Build conversation context from pre-fetched history or fallback sources.

    Args:
        user_id: User identifier
        query: Current query (for mem0 search)
        session_id: Session identifier
        chat_history: Pre-fetched chat history (avoids duplicate DB reads)

    Returns:
        Formatted context string, or "" if none available
    """
    context_parts = []

    # 1. Use pre-fetched history if available (from graph.py — no extra DB call)
    if chat_history:
        context_parts.append("CONVERSATION HISTORY:")
        for msg in chat_history[-6:]:  # Last 3 turns
            role = msg.get("role", "user").upper()
            content = msg.get("content", "")
            context_parts.append(f"- {role}: {content}")
        context_parts.append("")
    elif user_id and session_id:
        # Fallback: fetch from ChatStore (only if no pre-fetched history)
        try:
            from lex_bot.memory.chat_store import ChatStore
            store = ChatStore()
            history = store.get_session_history(user_id, session_id, limit=6)
            if history:
                context_parts.append("CONVERSATION HISTORY:")
                for msg in history:
                    context_parts.append(f"- {msg['role'].upper()}: {msg['content']}")
                context_parts.append("")
        except Exception as e:
            logger.warning(f"ChatStore context retrieval failed: {e}")

    return "\n".join(context_parts) if context_parts else ""


CLASSIFY_AND_REWRITE_PROMPT = """You are a legal query optimizer for an Indian law research system.

{context_section}CURRENT QUERY: {query}

TASK: Determine if this query needs rewriting to be clear and standalone, then output the final query.

A query needs rewriting if:
- It references previous conversation ("that case", "its punishment", "the above", "same section")
- It contains unresolved pronouns ("it", "this", "that", "they") referring to earlier topics
- It is too vague or short to search effectively on its own

If the query IS already clear and standalone, return it unchanged.
If the query NEEDS rewriting, resolve all references using the context and return the improved query.

RULES:
- Keep it natural language (not keywords)
- Preserve legal precision and specific section/article numbers
- Output ONLY the final query — no explanations, no quotes, no prefixes

FINAL QUERY:"""


def _classify_and_rewrite(query: str, context: str) -> str:
    """
    Single LLM call that classifies whether rewriting is needed
    and rewrites in the same pass if so.
    
    Latency: ~300ms (one cheap LLM call)
    """
    context_section = ""
    if context:
        context_section = f"""CONVERSATION CONTEXT:
{context}
---
"""
    
    prompt_text = CLASSIFY_AND_REWRITE_PROMPT.format(
        context_section=context_section,
        query=query
    )

    try:
        from lex_bot.core.llm_factory import get_llm
        llm = get_llm(mode="fast")
        
        response = llm.invoke(prompt_text)
        result = response.content.strip().strip('"').strip()
        
        if result and len(result) > 5:
            return result
    
    except Exception as e:
        logger.warning(f"Classify-and-rewrite LLM call failed: {e}")
    
    return query  # Fallback to original


# ============ Main Entry Point ============
def rewrite_query(
    query: str,
    user_id: str = None,
    session_id: str = None,
    chat_history: Optional[List[Dict]] = None,
) -> str:
    """
    Main query rewriting function — single-pass LLM approach.
    
    Flow:
    1. Expand abbreviations (rule-based, ~0ms)
    2. If user has conversation context → single LLM call to classify + rewrite (~300ms)
    3. If no context → return expanded query directly (~0ms)
    
    Args:
        query: Original user query
        user_id: For mem0 context
        session_id: For session context
        chat_history: Pre-fetched chat history (avoids duplicate DB reads)
        
    Returns:
        Rewritten query or original
    """
    original = query.strip()
    
    # 1. Abbreviation expansion (rule-based, always runs, ~0ms)
    expanded = expand_abbreviations(original)
    if expanded != original:
        logger.info(f"🔄 Expanded abbreviations: {expanded[:60]}...")
    
    # Use the expanded version going forward
    working_query = expanded
    
    # 2. If user has context, do single-pass classify + rewrite
    if user_id or session_id:
        context = _build_context_string(user_id, working_query, session_id, chat_history)
        if context:
            logger.info(f"🔄 Single-pass classify+rewrite: {working_query[:50]}...")
            rewritten = _classify_and_rewrite(working_query, context)
            
            if rewritten != working_query:
                logger.info(f"   ✓ Rewritten: {rewritten[:60]}...")
            return rewritten
    
    # 3. No context available — return expanded query as-is
    logger.debug(f"⚡ Query OK, no rewrite needed")
    return working_query


