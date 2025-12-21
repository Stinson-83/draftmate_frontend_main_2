"""
Latin Phrases Tool - Legal Latin phrase dictionary

Common legal maxims and phrases used in Indian law.
"""

import json
import os
from typing import Dict, Any, Optional, List
import logging

from lex_bot.core.tool_registry import register_tool

logger = logging.getLogger(__name__)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')

# Built-in common phrases (fallback if JSON not available)
COMMON_PHRASES = {
    "ab initio": {
        "meaning": "From the beginning",
        "usage": "Used to indicate that something is void from its inception, as if it never existed.",
        "example": "The contract was declared void ab initio."
    },
    "actus reus": {
        "meaning": "Guilty act",
        "usage": "The physical element of a crime - the wrongful deed itself.",
        "example": "To establish a crime, both actus reus and mens rea must be proven."
    },
    "audi alteram partem": {
        "meaning": "Hear the other side",
        "usage": "Principle of natural justice - no one should be condemned unheard.",
        "example": "The order was quashed for violation of audi alteram partem."
    },
    "bona fide": {
        "meaning": "In good faith",
        "usage": "Genuine, without fraud or deceit.",
        "example": "The purchaser was a bona fide buyer for value."
    },
    "caveat emptor": {
        "meaning": "Let the buyer beware",
        "usage": "Buyer takes risk of quality of goods purchased.",
        "example": "Under caveat emptor, it was the buyer's duty to inspect the goods."
    },
    "de facto": {
        "meaning": "In fact / In practice",
        "usage": "Existing in reality, though not officially recognized.",
        "example": "He was the de facto head of the organization."
    },
    "de jure": {
        "meaning": "By law / By right",
        "usage": "Officially recognized, legitimate.",
        "example": "The de jure owner retained legal title to the property."
    },
    "ex parte": {
        "meaning": "From one side only",
        "usage": "Proceedings where only one party is present.",
        "example": "An ex parte order was passed in the petitioner's absence."
    },
    "habeas corpus": {
        "meaning": "You have the body",
        "usage": "Writ to produce detained person before court.",
        "example": "A habeas corpus petition was filed challenging the detention."
    },
    "in personam": {
        "meaning": "Against the person",
        "usage": "Rights or actions enforceable against a specific person.",
        "example": "The decree is in personam, binding only on the defendant."
    },
    "in rem": {
        "meaning": "Against the thing",
        "usage": "Rights enforceable against the world at large.",
        "example": "Property rights are rights in rem."
    },
    "inter alia": {
        "meaning": "Among other things",
        "usage": "Used when listing items that are part of a larger set.",
        "example": "The petition challenged, inter alia, the constitutional validity."
    },
    "ipso facto": {
        "meaning": "By the fact itself",
        "usage": "As an inevitable result of the action.",
        "example": "Death of the partner ipso facto dissolves the partnership."
    },
    "locus standi": {
        "meaning": "Place of standing",
        "usage": "Right to bring an action or be heard in court.",
        "example": "The petitioner lacks locus standi to challenge the Act."
    },
    "mens rea": {
        "meaning": "Guilty mind",
        "usage": "The mental element of a crime - criminal intent.",
        "example": "Mens rea is an essential ingredient of most criminal offenses."
    },
    "modus operandi": {
        "meaning": "Mode of operation",
        "usage": "Particular method of committing crimes.",
        "example": "The accused followed the same modus operandi in all cases."
    },
    "mutatis mutandis": {
        "meaning": "With necessary changes",
        "usage": "Applying same principle with appropriate modifications.",
        "example": "The same ratio applies mutatis mutandis to the present case."
    },
    "nemo judex in causa sua": {
        "meaning": "No one should be judge in their own cause",
        "usage": "Principle against bias - judges must be impartial.",
        "example": "The order violated nemo judex in causa sua principle."
    },
    "obiter dictum": {
        "meaning": "Said in passing",
        "usage": "Incidental remarks by judge, not binding precedent.",
        "example": "The observation was merely obiter dictum."
    },
    "pari passu": {
        "meaning": "On equal footing",
        "usage": "Ranking equally without preference.",
        "example": "The creditors shall be paid pari passu."
    },
    "per curiam": {
        "meaning": "By the court",
        "usage": "Decision by the whole court rather than single judge.",
        "example": "The judgment was delivered per curiam."
    },
    "prima facie": {
        "meaning": "At first appearance / On the face of it",
        "usage": "Evidence sufficient to establish fact unless rebutted.",
        "example": "A prima facie case of negligence has been made out."
    },
    "pro bono": {
        "meaning": "For the public good",
        "usage": "Legal services provided free of charge.",
        "example": "The advocate appeared pro bono for the indigent accused."
    },
    "quid pro quo": {
        "meaning": "Something for something",
        "usage": "Exchange of value, consideration in contracts.",
        "example": "Every valid contract requires quid pro quo."
    },
    "ratio decidendi": {
        "meaning": "Reason for deciding",
        "usage": "The legal principle on which a decision is based.",
        "example": "The ratio decidendi of the judgment is binding precedent."
    },
    "res judicata": {
        "meaning": "A matter already judged",
        "usage": "Doctrine preventing relitigation of decided issues.",
        "example": "The suit is barred by res judicata."
    },
    "sine qua non": {
        "meaning": "Without which not",
        "usage": "An essential condition or requirement.",
        "example": "Negligence is the sine qua non of the tort."
    },
    "stare decisis": {
        "meaning": "To stand by things decided",
        "usage": "Doctrine of following precedent.",
        "example": "The court is bound by stare decisis to follow the ruling."
    },
    "status quo": {
        "meaning": "The existing state of affairs",
        "usage": "Maintaining current situation.",
        "example": "Status quo shall be maintained during pendency of the suit."
    },
    "suo motu": {
        "meaning": "On its own motion",
        "usage": "Court acting on its own without petition.",
        "example": "The court took suo motu cognizance of the matter."
    },
    "ultra vires": {
        "meaning": "Beyond the powers",
        "usage": "Act exceeding legal authority.",
        "example": "The order was ultra vires the statute."
    },
    "vis major": {
        "meaning": "Superior force / Act of God",
        "usage": "Event beyond human control.",
        "example": "The flood was vis major, excusing performance."
    },
}


class LatinPhraseTool:
    """
    Lookup tool for legal Latin phrases.
    
    Usage:
        tool = LatinPhraseTool()
        result = tool.lookup("habeas corpus")
        results = tool.search("guilty")
    """
    
    def __init__(self):
        """Initialize with phrase data."""
        self.phrases: Dict[str, Dict[str, str]] = {}
        self._load_data()
    
    def _load_data(self):
        """Load phrases from JSON file or use built-in."""
        json_path = os.path.join(DATA_DIR, 'latin_phrases.json')
        
        if os.path.exists(json_path):
            try:
                with open(json_path, 'r', encoding='utf-8') as f:
                    self.phrases = json.load(f)
                logger.info(f"Loaded {len(self.phrases)} Latin phrases from file")
                return
            except Exception as e:
                logger.warning(f"Failed to load Latin phrases JSON: {e}")
        
        # Use built-in phrases
        self.phrases = COMMON_PHRASES
        logger.info(f"Using {len(self.phrases)} built-in Latin phrases")
    
    def lookup(self, phrase: str) -> Optional[Dict[str, Any]]:
        """
        Look up a specific Latin phrase.
        
        Args:
            phrase: Latin phrase to look up
            
        Returns:
            Dict with meaning, usage, example or None
        """
        phrase_lower = phrase.lower().strip()
        
        # Exact match
        if phrase_lower in self.phrases:
            result = self.phrases[phrase_lower].copy()
            result['phrase'] = phrase_lower
            return result
        
        # Partial match
        for key, value in self.phrases.items():
            if phrase_lower in key or key in phrase_lower:
                result = value.copy()
                result['phrase'] = key
                return result
        
        return None
    
    def search(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """
        Search phrases by meaning or usage.
        
        Args:
            query: Search term
            max_results: Maximum results
            
        Returns:
            List of matching phrases
        """
        query_lower = query.lower()
        results = []
        
        for phrase, data in self.phrases.items():
            meaning = data.get('meaning', '').lower()
            usage = data.get('usage', '').lower()
            
            if query_lower in phrase or query_lower in meaning or query_lower in usage:
                result = data.copy()
                result['phrase'] = phrase
                results.append(result)
        
        return results[:max_results]
    
    def list_all(self) -> List[str]:
        """List all available phrases."""
        return sorted(self.phrases.keys())
    
    def format_phrase(self, data: Dict[str, Any]) -> str:
        """Format phrase data for display."""
        if not data:
            return "Phrase not found."
        
        parts = [
            f"**{data.get('phrase', 'Unknown')}**",
            f"*Meaning:* {data.get('meaning', 'N/A')}",
        ]
        
        if data.get('usage'):
            parts.append(f"*Usage:* {data['usage']}")
        
        if data.get('example'):
            parts.append(f"*Example:* \"{data['example']}\"")
        
        return "\n".join(parts)
    
    def run(self, query: str) -> str:
        """
        Main entry point for tool usage.
        
        Args:
            query: Phrase or search term
            
        Returns:
            Formatted response
        """
        # Try exact lookup first
        result = self.lookup(query)
        if result:
            return self.format_phrase(result)
        
        # Then search by meaning
        results = self.search(query)
        if results:
            output = [f"**Latin phrases related to '{query}':**\n"]
            for r in results[:5]:
                output.append(f"- **{r['phrase']}**: {r.get('meaning', '')}")
            return "\n".join(output)
        
        return f"No Latin phrases found for '{query}'."


# Register with tool registry
@register_tool(
    name="latin_phrases",
    capabilities=["legal_reference", "definition"],
    description="Lookup legal Latin phrases and maxims",
)
class LatinPhrasesRegistered(LatinPhraseTool):
    """Registered version for tool registry."""
    pass


# Convenience function
def explain_latin(phrase: str) -> str:
    """Quick explanation of a Latin phrase."""
    tool = LatinPhraseTool()
    return tool.run(phrase)
