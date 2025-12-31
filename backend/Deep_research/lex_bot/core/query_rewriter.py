"""
Query Rewriter - Smart query rewriting with conversation context

Flow:
1. Rule-based check (abbreviations, pronouns, short queries)
2. If rules say rewrite needed → get mem0 context → LLM rewrite
3. If rules say OK → return original (0ms overhead)

Latency:
- No rewrite needed: ~0ms
- Rewrite needed: ~300-500ms (mem0 search + LLM call)
"""

import re
import logging
from typing import Tuple, Optional

logger = logging.getLogger(__name__)

# ============ Legal Abbreviation Map ============
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

# Follow-up markers indicating reference to previous conversation
FOLLOW_UP_MARKERS = [
    # Pronouns/references
    'that', 'this', 'it', 'its', 'them', 'those', 'above', 'these',
    'same', 'said', 'such', 'mentioned', 'previous', 'the case',
    'earlier', 'before', 'again', 'more about', 'the act', 'the section',
    # Continuation patterns
    'what about', 'how about', 'and what', 'also tell', 'tell me more',
    'explain more', 'elaborate', 'in detail', 'regarding', 'concerning',
    'related to', 'in relation', 'with respect', 'pertaining to',
    # Follow-up question patterns
    'what if', 'but what', 'and if', 'however', 'although',
    'punishment for', 'penalty for', 'exception to', 'procedure for',
    # Clarification
    'meaning of', 'definition of', 'difference between', 'comparison',
]

# ============ Rule-Based Detection ============
def needs_rewriting(query: str) -> Tuple[bool, str, list]:
    """
    Rule-based check if query needs rewriting.
    
    Returns:
        (needs_rewrite, reason, matched_items)
    """
    query_lower = query.lower().strip()
    words = query_lower.split()
    
    # 1. Check for abbreviations
    found_abbrs = []
    for word in words:
        # Remove punctuation for matching
        clean_word = re.sub(r'[^\w]', '', word)
        if clean_word in LEGAL_ABBREVIATIONS:
            found_abbrs.append(clean_word)
    
    if found_abbrs:
        return True, "abbreviation", found_abbrs
    
    # 2. Check for follow-up markers (context needed)
    for marker in FOLLOW_UP_MARKERS:
        if re.search(rf'\b{marker}\b', query_lower):
            return True, "follow-up", [marker]
    
    # 3. Check for very short/vague queries
    if len(query_lower) < 15:
        return True, "short", []
    
    # 4. Check for vague patterns
    vague_patterns = [
        r'^(what|how|tell|explain)\s+(about|is|are)?\s*$',
        r'^(and|but|so|then|also)\s+',
        r'^more\s*$',
    ]
    for pattern in vague_patterns:
        if re.match(pattern, query_lower):
            return True, "vague", []
    
    # Query seems complete - no rewrite needed
    return False, "", []


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


# ============ Get Context from mem0 ============
def get_conversation_context(user_id: str, query: str, session_id: str = None) -> str:
    """
    Get relevant context from mem0 for follow-up queries.
    mem0 stores actual conversation turns so it has the context needed.
    
    Returns:
        Formatted context string or empty string
    """
    if not user_id:
        return ""
    
    try:
        from lex_bot.config import MEM0_ENABLED
        if not MEM0_ENABLED:
            return ""
        
        from lex_bot.memory import UserMemoryManager
        memory_mgr = UserMemoryManager(user_id)
        memories = memory_mgr.search(query, limit=5)  # Get last 5 relevant memories
        
        if memories:
            context_parts = []
            for m in memories:
                memory_text = m.get('memory', '')
                if memory_text:
                    context_parts.append(f"- {memory_text[:250]}")
            
            if context_parts:
                return "\n".join(context_parts)
    
    except Exception as e:
        logger.warning(f"mem0 context retrieval failed: {e}")
    
    return ""


# ============ LLM-Based Rewriting ============
def rewrite_with_llm(query: str, context: str, reason: str) -> str:
    """
    Rewrite query using LLM with context.
    Only called when rules determine rewrite is needed.
    
    Latency: ~300-400ms
    """
    context_section = ""
    if context:
        context_section = f"""
RECENT CONTEXT:
{context}
---
"""
    
    rewrite_prompt = f"""Rewrite this legal query to be clear and standalone.

{context_section}QUERY: {query}

RULES:
1. If it references previous context ("that case", "its punishment"), resolve using context above
2. Expand any remaining abbreviations
3. Keep it natural (not just keywords)
4. If already clear, return as-is
5. Output ONLY the rewritten query

REWRITTEN:"""

    try:
        from lex_bot.core.llm_factory import get_llm
        llm = get_llm(mode="fast")
        
        response = llm.invoke(rewrite_prompt)
        rewritten = response.content.strip().strip('"').strip()
        
        if rewritten and len(rewritten) > 5:
            return rewritten
    
    except Exception as e:
        logger.warning(f"LLM rewrite failed: {e}")
    
    return query  # Fallback


# ============ LLM Check for Edge Cases ============
def llm_needs_rewriting(query: str, context: str) -> Tuple[bool, str]:
    """
    LLM-based check if query needs rewriting.
    Called when rules pass but we have conversation context.
    
    Returns:
        (needs_rewrite, rewritten_query if needed)
    """
    if not context:
        return False, query
    
    check_prompt = f"""You are a legal query optimizer.

CONVERSATION CONTEXT:
{context}

CURRENT QUERY: {query}

TASK: Does this query need rewriting to be clear and standalone?

If YES (query references context like "that", "it", "the case mentioned", etc.):
- Return the rewritten query that resolves the reference

If NO (query is already clear and standalone):
- Return exactly: NO_REWRITE

OUTPUT (either rewritten query OR "NO_REWRITE"):"""

    try:
        from lex_bot.core.llm_factory import get_llm
        llm = get_llm(mode="fast")
        
        response = llm.invoke(check_prompt)
        result = response.content.strip().strip('"').strip()
        
        if result == "NO_REWRITE" or result.upper() == "NO_REWRITE":
            return False, query
        elif result and len(result) > 10:
            return True, result
    
    except Exception as e:
        logger.warning(f"LLM check failed: {e}")
    
    return False, query


# ============ Main Entry Point ============
def rewrite_query(
    query: str,
    user_id: str = None,
    session_id: str = None
) -> str:
    """
    Main query rewriting function with rule-based + LLM fallback.
    
    Flow:
    1. Rule-based check (abbreviations, pronouns, short queries)
    2. If abbreviations only → expand without LLM (~0ms)
    3. If follow-up/vague → get mem0 context + LLM rewrite (~300-500ms)
    4. If rules pass but user has context → LLM checks for edge cases (~200-300ms)
    5. If clear and no context → return original (~0ms)
    
    Args:
        query: Original user query
        user_id: For mem0 context
        session_id: For future session context
        
    Returns:
        Rewritten query or original
    """
    original = query.strip()
    
    # 1. Rule-based check
    needs_it, reason, matched = needs_rewriting(original)
    
    # 2. If only abbreviations, just expand (no LLM)
    if needs_it and reason == "abbreviation":
        expanded = expand_abbreviations(original)
        if expanded != original:
            logger.info(f"🔄 Expanded abbreviations: {expanded[:60]}...")
            return expanded
        return original
    
    # 3. For follow-ups, vague, or short queries → need LLM with context
    if needs_it:
        logger.info(f"🔄 Rewriting query ({reason}): {original[:50]}...")
        context = get_conversation_context(user_id, original, session_id)
        rewritten = rewrite_with_llm(original, context, reason)
        
        if rewritten != original:
            logger.info(f"   ✓ Rewritten: {rewritten[:60]}...")
        return rewritten
    
    # 4. Rules passed - but if user has context, do LLM check for edge cases
    # This ensures conversation flow even when rules don't catch references
    if user_id or session_id:
        context = get_conversation_context(user_id, original, session_id)
        if context:
            logger.debug(f"🔍 LLM checking for edge cases...")
            needs_llm_rewrite, rewritten = llm_needs_rewriting(original, context)
            if needs_llm_rewrite:
                logger.info(f"🔄 LLM detected needed rewrite: {rewritten[:60]}...")
                return rewritten
    
    # 5. Query is clear - no rewrite needed
    logger.debug(f"⚡ Query OK, no rewrite needed")
    return original


# ============ Latency Summary ============
"""
LATENCY IMPACT:

| Scenario                    | Overhead    |
|-----------------------------|-------------|
| Query is clear              | ~0ms        |
| Abbreviations only          | ~0-5ms      |
| Follow-up (needs context)   | ~300-500ms  |
| Short/vague query           | ~300-400ms  |

WORST CASE: ~500ms (follow-up query with mem0 search + LLM)
BEST CASE: ~0ms (clear, complete query)
AVERAGE: ~100-150ms (most queries are clear or just need abbr expansion)
"""
