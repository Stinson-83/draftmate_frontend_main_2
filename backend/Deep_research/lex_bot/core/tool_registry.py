"""
Tool Registry - Dynamic tool assignment for agents

Agents can request tools by capability (e.g., "case_search", "statute_lookup").
"""

from typing import Dict, List, Any, Callable, Optional
from dataclasses import dataclass, field


@dataclass
class ToolInfo:
    """Metadata about a registered tool."""
    name: str
    description: str
    capabilities: List[str]  # e.g., ["case_search", "web_search"]
    tool_instance: Any
    requires_rate_limit: bool = False


class ToolRegistry:
    """
    Central registry for all available tools.
    
    Usage:
        registry = ToolRegistry()
        registry.register("indian_kanoon", tool_instance, ["case_search"], "Search Indian Kanoon")
        
        # Get tools by capability
        case_tools = registry.get_by_capability("case_search")
    """
    
    _instance = None
    
    def __new__(cls):
        """Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._tools: Dict[str, ToolInfo] = {}
            cls._instance._initialized = False
        return cls._instance
    
    def register(
        self,
        name: str,
        tool_instance: Any,
        capabilities: List[str],
        description: str = "",
        requires_rate_limit: bool = False,
    ) -> None:
        """
        Register a tool with the registry.
        
        Args:
            name: Unique identifier for the tool
            tool_instance: The actual tool object/function
            capabilities: List of capabilities this tool provides
            description: Human-readable description
            requires_rate_limit: Whether this tool needs rate limiting
        """
        self._tools[name] = ToolInfo(
            name=name,
            description=description,
            capabilities=capabilities,
            tool_instance=tool_instance,
            requires_rate_limit=requires_rate_limit,
        )
    
    def get(self, name: str) -> Optional[Any]:
        """Get a tool by name."""
        info = self._tools.get(name)
        return info.tool_instance if info else None
    
    def get_info(self, name: str) -> Optional[ToolInfo]:
        """Get tool metadata by name."""
        return self._tools.get(name)
    
    def get_by_capability(self, capability: str) -> List[Any]:
        """Get all tools that have a specific capability."""
        return [
            info.tool_instance
            for info in self._tools.values()
            if capability in info.capabilities
        ]
    
    def get_names_by_capability(self, capability: str) -> List[str]:
        """Get names of tools that have a specific capability."""
        return [
            name
            for name, info in self._tools.items()
            if capability in info.capabilities
        ]
    
    def list_all(self) -> Dict[str, List[str]]:
        """List all registered tools with their capabilities."""
        return {
            name: info.capabilities
            for name, info in self._tools.items()
        }
    
    def list_capabilities(self) -> List[str]:
        """List all available capabilities across all tools."""
        caps = set()
        for info in self._tools.values():
            caps.update(info.capabilities)
        return sorted(list(caps))


# Global registry instance
tool_registry = ToolRegistry()


def register_tool(
    name: str,
    capabilities: List[str],
    description: str = "",
    requires_rate_limit: bool = False,
):
    """
    Decorator to register a tool class or function.
    
    Usage:
        @register_tool("my_tool", ["search", "scrape"], "My tool description")
        class MyTool:
            ...
    """
    def decorator(cls_or_func):
        # Instantiate if it's a class
        if isinstance(cls_or_func, type):
            instance = cls_or_func()
        else:
            instance = cls_or_func
        
        tool_registry.register(
            name=name,
            tool_instance=instance,
            capabilities=capabilities,
            description=description,
            requires_rate_limit=requires_rate_limit,
        )
        return cls_or_func
    
    return decorator
