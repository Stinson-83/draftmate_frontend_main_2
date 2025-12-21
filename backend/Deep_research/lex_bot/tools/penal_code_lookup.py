"""
Penal Code Lookup - IPC and BNS section lookup

Features:
- Both IPC (Indian Penal Code) and BNS (Bharatiya Nyaya Sanhita)
- Mapping between old IPC and new BNS sections
- Fast local lookup from bundled JSON
"""

import json
import os
import re
from typing import Dict, Any, Optional, List
import logging

from lex_bot.core.tool_registry import register_tool

logger = logging.getLogger(__name__)

# Data directory
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')


class PenalCodeLookup:
    """
    Lookup tool for IPC and BNS sections.
    
    Usage:
        lookup = PenalCodeLookup()
        result = lookup.get_section("302", code="ipc")
        result = lookup.get_section("103", code="bns")
        mapping = lookup.get_equivalent("302", from_code="ipc")
    """
    
    def __init__(self):
        """Initialize with loaded data files."""
        self.ipc_data: Dict[str, Any] = {}
        self.bns_data: Dict[str, Any] = {}
        self.ipc_to_bns: Dict[str, str] = {}
        self.bns_to_ipc: Dict[str, str] = {}
        
        self._load_data()
    
    def _load_data(self):
        """Load IPC, BNS, and mapping data from JSON files."""
        # Load IPC
        ipc_path = os.path.join(DATA_DIR, 'ipc_sections.json')
        if os.path.exists(ipc_path):
            try:
                with open(ipc_path, 'r', encoding='utf-8') as f:
                    self.ipc_data = json.load(f)
                logger.info(f"Loaded {len(self.ipc_data)} IPC sections")
            except Exception as e:
                logger.warning(f"Failed to load IPC data: {e}")
        
        # Load BNS
        bns_path = os.path.join(DATA_DIR, 'bns_sections.json')
        if os.path.exists(bns_path):
            try:
                with open(bns_path, 'r', encoding='utf-8') as f:
                    self.bns_data = json.load(f)
                logger.info(f"Loaded {len(self.bns_data)} BNS sections")
            except Exception as e:
                logger.warning(f"Failed to load BNS data: {e}")
        
        # Load mapping
        mapping_path = os.path.join(DATA_DIR, 'ipc_bns_mapping.json')
        if os.path.exists(mapping_path):
            try:
                with open(mapping_path, 'r', encoding='utf-8') as f:
                    mapping = json.load(f)
                    self.ipc_to_bns = mapping.get('ipc_to_bns', {})
                    self.bns_to_ipc = mapping.get('bns_to_ipc', {})
                logger.info("Loaded IPC-BNS mapping")
            except Exception as e:
                logger.warning(f"Failed to load mapping: {e}")
    
    def _normalize_section(self, section: str) -> str:
        """Normalize section number format."""
        # Remove common prefixes
        section = re.sub(r'^(section|sec\.?|s\.?)\s*', '', section, flags=re.IGNORECASE)
        # Remove spaces
        section = section.strip()
        return section
    
    def get_section(
        self,
        section: str,
        code: str = "ipc"
    ) -> Optional[Dict[str, Any]]:
        """
        Get details of a specific section.
        
        Args:
            section: Section number (e.g., "302", "304A")
            code: "ipc" or "bns"
            
        Returns:
            Dict with section details or None
        """
        section = self._normalize_section(section)
        data = self.ipc_data if code.lower() == "ipc" else self.bns_data
        
        # Try exact match
        if section in data:
            result = data[section].copy()
            result['section'] = section
            result['code'] = code.upper()
            
            # Add equivalent from other code
            if code.lower() == "ipc":
                equiv = self.ipc_to_bns.get(section)
                if equiv:
                    result['bns_equivalent'] = equiv
            else:
                equiv = self.bns_to_ipc.get(section)
                if equiv:
                    result['ipc_equivalent'] = equiv
            
            return result
        
        # Try case-insensitive search
        for key in data:
            if key.lower() == section.lower():
                result = data[key].copy()
                result['section'] = key
                result['code'] = code.upper()
                return result
        
        return None
    
    def get_equivalent(
        self,
        section: str,
        from_code: str = "ipc"
    ) -> Optional[Dict[str, Any]]:
        """
        Get equivalent section in the other code.
        
        Args:
            section: Section number
            from_code: Source code ("ipc" or "bns")
            
        Returns:
            Dict with equivalent section details
        """
        section = self._normalize_section(section)
        
        if from_code.lower() == "ipc":
            equiv_section = self.ipc_to_bns.get(section)
            if equiv_section:
                return self.get_section(equiv_section, code="bns")
        else:
            equiv_section = self.bns_to_ipc.get(section)
            if equiv_section:
                return self.get_section(equiv_section, code="ipc")
        
        return None
    
    def search(
        self,
        query: str,
        code: str = "both",
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search sections by keyword.
        
        Args:
            query: Search keyword
            code: "ipc", "bns", or "both"
            max_results: Maximum results to return
            
        Returns:
            List of matching sections
        """
        query_lower = query.lower()
        results = []
        
        def search_code(data: Dict, code_name: str):
            for section, info in data.items():
                # Check title/description
                title = info.get('title', '') or info.get('description', '')
                offense = info.get('offense', '')
                
                if query_lower in title.lower() or query_lower in offense.lower():
                    result = info.copy()
                    result['section'] = section
                    result['code'] = code_name.upper()
                    results.append(result)
        
        if code.lower() in ["ipc", "both"]:
            search_code(self.ipc_data, "ipc")
        
        if code.lower() in ["bns", "both"]:
            search_code(self.bns_data, "bns")
        
        return results[:max_results]
    
    def format_section(self, section_data: Dict[str, Any]) -> str:
        """Format section data for display."""
        if not section_data:
            return "Section not found."
        
        parts = [
            f"**{section_data.get('code', 'IPC')} Section {section_data.get('section')}**",
        ]
        
        if section_data.get('title'):
            parts.append(f"*{section_data['title']}*")
        
        if section_data.get('description'):
            parts.append(f"\n{section_data['description']}")
        
        if section_data.get('offense'):
            parts.append(f"\n**Offense:** {section_data['offense']}")
        
        if section_data.get('punishment'):
            parts.append(f"\n**Punishment:** {section_data['punishment']}")
        
        # Show equivalent
        if section_data.get('bns_equivalent'):
            parts.append(f"\n**BNS Equivalent:** Section {section_data['bns_equivalent']}")
        elif section_data.get('ipc_equivalent'):
            parts.append(f"\n**IPC Equivalent:** Section {section_data['ipc_equivalent']}")
        
        return "\n".join(parts)
    
    def run(self, query: str) -> str:
        """
        Main entry point for tool usage.
        Falls back to web search if section not found locally.
        
        Args:
            query: Section number or search term
            
        Returns:
            Formatted response string
        """
        # Check if it looks like a section number
        section_match = re.match(r'^(\d+[A-Za-z]?)\s*(ipc|bns)?$', query.strip(), re.IGNORECASE)
        
        if section_match:
            section = section_match.group(1)
            code = (section_match.group(2) or "ipc").lower()
            result = self.get_section(section, code=code)
            
            if result:
                return self.format_section(result)
            
            # Fallback to web search if not found locally
            logger.info(f"Section {section} not in local data, searching web...")
            try:
                from lex_bot.tools.web_search import web_search_tool
                web_query = f"Section {section} {code.upper()} Indian Penal Code punishment offense"
                _, web_results = web_search_tool.run(web_query)
                
                if web_results:
                    # Format web results
                    output = [f"**{code.upper()} Section {section}** (from web search)\n"]
                    for r in web_results[:2]:
                        title = r.get('title', '')
                        snippet = r.get('snippet', '')[:300]
                        output.append(f"**{title}**\n{snippet}\n")
                    return "\n".join(output)
            except Exception as e:
                logger.warning(f"Web search fallback failed: {e}")
            
            return f"Section {section} not found in {code.upper()}. Try a broader search."
        
        # Otherwise do a search
        results = self.search(query)
        if not results:
            # Try web search for keyword
            try:
                from lex_bot.tools.web_search import web_search_tool
                _, web_results = web_search_tool.run(f"{query} IPC BNS Indian law section")
                if web_results:
                    output = [f"**Sections related to '{query}'** (web search):\n"]
                    for r in web_results[:3]:
                        output.append(f"- {r.get('title', '')}: {r.get('snippet', '')[:150]}")
                    return "\n".join(output)
            except:
                pass
            return f"No sections found matching '{query}'."
        
        output = [f"**Sections matching '{query}':**\n"]
        for r in results[:5]:
            output.append(f"- {r.get('code')} Section {r.get('section')}: {r.get('title', r.get('offense', ''))}")
        
        return "\n".join(output)


# Register with tool registry
@register_tool(
    name="penal_code_lookup",
    capabilities=["statute_lookup", "ipc_lookup", "bns_lookup"],
    description="Lookup IPC and BNS penal code sections",
)
class PenalCodeTool(PenalCodeLookup):
    """Registered version for tool registry."""
    pass


# Convenience function
def lookup_section(section: str, code: str = "ipc") -> Optional[Dict[str, Any]]:
    """Quick lookup of a penal code section."""
    tool = PenalCodeLookup()
    return tool.get_section(section, code=code)
