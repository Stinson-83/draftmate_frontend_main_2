"""
User Memory Manager - mem0 integration for intelligent memory

Stores user preferences, key facts, and past query patterns.
Retrieves relevant memories to enhance query context.
"""

from typing import List, Dict, Any, Optional
import logging

from lex_bot.config import MEM0_ENABLED

logger = logging.getLogger(__name__)


class UserMemoryManager:
    """
    Manages user memory using mem0 library.
    
    Memory types stored:
    - User preferences (e.g., "prefers citations in SCC format")
    - Frequently researched topics
    - Key case names and sections mentioned
    - Previous query patterns
    
    Usage:
        memory = UserMemoryManager(user_id="user_123")
        memory.add([{"role": "user", "content": "What is Section 302?"}])
        relevant = memory.search("murder section")
    """
    
    def __init__(self, user_id: str):
        """
        Initialize memory manager for a specific user.
        
        Args:
            user_id: Unique identifier for the user
        """
        self.user_id = user_id
        self.memory = None
        self.enabled = MEM0_ENABLED
        
        if self.enabled:
            self._init_memory()
    
    def _init_memory(self):
        """Initialize mem0 Memory instance."""
        try:
            from mem0 import Memory
            self.memory = Memory()
            logger.info(f"✅ Memory initialized for user: {self.user_id}")
        except ImportError:
            logger.warning("⚠️ mem0 not installed. Run: pip install mem0ai")
            self.enabled = False
        except Exception as e:
            logger.error(f"❌ Memory init failed: {e}")
            self.enabled = False
    
    def add(
        self,
        messages: List[Dict[str, str]],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict]:
        """
        Extract and store key facts from conversation.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            metadata: Optional metadata (e.g., topic, case_names)
            
        Returns:
            Result from mem0 add operation, or None if disabled
        """
        if not self.enabled or not self.memory:
            return None
        
        try:
            result = self.memory.add(
                messages,
                user_id=self.user_id,
                metadata=metadata or {}
            )
            logger.debug(f"Memory added for user {self.user_id}")
            return result
        except Exception as e:
            logger.error(f"Failed to add memory: {e}")
            return None
    
    def search(self, query: str, limit: int = 5) -> List[Dict]:
        """
        Retrieve relevant memories for context.
        
        Args:
            query: Search query
            limit: Maximum number of memories to return
            
        Returns:
            List of relevant memory entries
        """
        if not self.enabled or not self.memory:
            return []
        
        try:
            results = self.memory.search(
                query,
                user_id=self.user_id,
                limit=limit
            )
            return results if results else []
        except Exception as e:
            logger.error(f"Memory search failed: {e}")
            return []
    
    def get_all(self) -> List[Dict]:
        """
        Get all memories for a user.
        
        Returns:
            List of all memory entries for this user
        """
        if not self.enabled or not self.memory:
            return []
        
        try:
            results = self.memory.get_all(user_id=self.user_id)
            return results if results else []
        except Exception as e:
            logger.error(f"Failed to get memories: {e}")
            return []
    
    def delete(self, memory_id: str) -> bool:
        """Delete a specific memory by ID."""
        if not self.enabled or not self.memory:
            return False
        
        try:
            self.memory.delete(memory_id)
            return True
        except Exception as e:
            logger.error(f"Failed to delete memory: {e}")
            return False
    
    def clear_all(self) -> bool:
        """Clear all memories for this user."""
        if not self.enabled or not self.memory:
            return False
        
        try:
            self.memory.delete_all(user_id=self.user_id)
            logger.info(f"Cleared all memories for user: {self.user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to clear memories: {e}")
            return False
    
    def format_for_context(self, memories: List[Dict], max_chars: int = 1000) -> str:
        """
        Format memories into a string for LLM context.
        
        Args:
            memories: List of memory dicts from search()
            max_chars: Maximum characters to include
            
        Returns:
            Formatted string of relevant memories
        """
        if not memories:
            return ""
        
        context_parts = []
        total_chars = 0
        
        for mem in memories:
            mem_text = mem.get("memory", mem.get("text", ""))
            if total_chars + len(mem_text) > max_chars:
                break
            context_parts.append(f"- {mem_text}")
            total_chars += len(mem_text)
        
        if context_parts:
            return "**Relevant from your history:**\n" + "\n".join(context_parts)
        return ""
