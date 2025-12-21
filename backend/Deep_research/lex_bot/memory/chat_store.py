"""
Chat Store - PostgreSQL storage for chat history

Stores full chat logs per user/session for:
- Audit trail
- Memory extraction
- Future fine-tuning data
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import json

from sqlalchemy import create_engine, Column, String, Text, DateTime, Integer, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from lex_bot.config import DATABASE_URL

logger = logging.getLogger(__name__)
Base = declarative_base()


class ChatMessage(Base):
    """SQLAlchemy model for chat messages."""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(255), index=True, nullable=False)
    session_id = Column(String(255), index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    role = Column(String(50), nullable=False)  # "user", "assistant", "system"
    content = Column(Text, nullable=False)
    msg_metadata = Column(JSON, nullable=True)  # Extra info like query_complexity, llm_mode


class ChatStore:
    """
    Manages chat history persistence.
    
    Usage:
        store = ChatStore()
        store.add_message(user_id="user_123", session_id="sess_456", role="user", content="...")
        history = store.get_session_history("user_123", "sess_456")
    """
    
    def __init__(self):
        """Initialize database connection."""
        self.engine = None
        self.SessionLocal = None
        self._initialized = False
        
        if DATABASE_URL:
            self._init_db()
    
    def _init_db(self):
        """Initialize database engine and create tables."""
        try:
            self.engine = create_engine(DATABASE_URL)
            Base.metadata.create_all(self.engine)
            self.SessionLocal = sessionmaker(bind=self.engine)
            self._initialized = True
            logger.info("✅ ChatStore database initialized")
        except Exception as e:
            logger.error(f"❌ ChatStore init failed: {e}")
            self._initialized = False
    
    def add_message(
        self,
        user_id: str,
        session_id: str,
        role: str,
        content: str,
        msg_metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Add a chat message to the store.
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            role: Message role ("user", "assistant", "system")
            content: Message content
            msg_metadata: Optional metadata dict
            
        Returns:
            True if successful, False otherwise
        """
        if not self._initialized:
            logger.warning("ChatStore not initialized, skipping message storage")
            return False
        
        try:
            with self.SessionLocal() as session:
                msg = ChatMessage(
                    user_id=user_id,
                    session_id=session_id,
                    role=role,
                    content=content,
                    msg_metadata=msg_metadata
                )
                session.add(msg)
                session.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to add message: {e}")
            return False
    
    def add_conversation(
        self,
        user_id: str,
        session_id: str,
        messages: List[Dict[str, str]],
        msg_metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Add multiple messages from a conversation.
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            messages: List of message dicts with 'role' and 'content'
            msg_metadata: Optional metadata to attach to all messages
            
        Returns:
            True if successful
        """
        if not self._initialized:
            return False
        
        try:
            with self.SessionLocal() as session:
                for msg_dict in messages:
                    msg = ChatMessage(
                        user_id=user_id,
                        session_id=session_id,
                        role=msg_dict.get("role", "user"),
                        content=msg_dict.get("content", ""),
                        msg_metadata=msg_metadata
                    )
                    session.add(msg)
                session.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to add conversation: {e}")
            return False
    
    def get_session_history(
        self,
        user_id: str,
        session_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get chat history for a specific session.
        
        Args:
            user_id: User identifier
            session_id: Session identifier
            limit: Maximum messages to return
            
        Returns:
            List of message dicts
        """
        if not self._initialized:
            return []
        
        try:
            with self.SessionLocal() as session:
                messages = session.query(ChatMessage).filter(
                    ChatMessage.user_id == user_id,
                    ChatMessage.session_id == session_id
                ).order_by(ChatMessage.timestamp.desc()).limit(limit).all()
                
                return [
                    {
                        "id": msg.id,
                        "role": msg.role,
                        "content": msg.content,
                        "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                        "metadata": msg.msg_metadata
                    }
                    for msg in reversed(messages)  # Return in chronological order
                ]
        except Exception as e:
            logger.error(f"Failed to get session history: {e}")
            return []
    
    def get_user_sessions(self, user_id: str, limit: int = 20) -> List[str]:
        """Get list of session IDs for a user."""
        if not self._initialized:
            return []
        
        try:
            with self.SessionLocal() as session:
                results = session.query(ChatMessage.session_id).filter(
                    ChatMessage.user_id == user_id
                ).distinct().limit(limit).all()
                return [r[0] for r in results]
        except Exception as e:
            logger.error(f"Failed to get user sessions: {e}")
            return []
    
    def delete_session(self, user_id: str, session_id: str) -> bool:
        """Delete all messages in a session."""
        if not self._initialized:
            return False
        
        try:
            with self.SessionLocal() as session:
                session.query(ChatMessage).filter(
                    ChatMessage.user_id == user_id,
                    ChatMessage.session_id == session_id
                ).delete()
                session.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to delete session: {e}")
            return False
    
    def cleanup_old_sessions(self, retention_days: int = 15) -> int:
        """
        Delete chat sessions older than retention_days.
        
        Args:
            retention_days: Number of days to keep (default 15)
            
        Returns:
            Number of messages deleted
        """
        if not self._initialized:
            return 0
        
        try:
            from datetime import timedelta
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            with self.SessionLocal() as session:
                result = session.query(ChatMessage).filter(
                    ChatMessage.timestamp < cutoff_date
                ).delete()
                session.commit()
                
                if result > 0:
                    logger.info(f"🧹 Cleaned up {result} messages older than {retention_days} days")
                return result
        except Exception as e:
            logger.error(f"Failed to cleanup old sessions: {e}")
            return 0

