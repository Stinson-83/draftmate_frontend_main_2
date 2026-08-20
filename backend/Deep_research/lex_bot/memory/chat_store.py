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


class ChatSession(Base):
    """SQLAlchemy model for chat sessions."""
    __tablename__ = "chat_sessions"
    
    session_id = Column(String(255), primary_key=True)
    user_id = Column(String(255), index=True, nullable=False)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ChatStore:
    """
    Manages chat history persistence.
    
    Usage:
        store = ChatStore()
        store.add_message(user_id="user_123", session_id="sess_456", role="user", content="...")
        history = store.get_session_history("user_123", "sess_456")
    """
    
    def __init__(self, db_url: Optional[str] = None):
        """Initialize database connection."""
        self.engine = None
        self.SessionLocal = None
        self._initialized = False
        
        # Use provided URL or fallback to config
        self.db_url = db_url or DATABASE_URL

        # Initialize Cache
        try:
            from cachetools import TTLCache
            # Cache up to 100 active sessions for 5 minutes
            self._history_cache = TTLCache(maxsize=100, ttl=300)
        except ImportError:
            logger.warning("cachetools not found. Caching disabled.")
            self._history_cache = None
        
        if self.db_url:
            self._init_db()
    
    def _invalidate_session_cache(self, session_id: str):
        """Invalidate all cache entries for a specific session."""
        if self._history_cache is None:
            return
            
        # Keys are formatted as f"{session_id}:{limit}"
        # Since maxsize is small (100), iteration is fast enough
        keys_to_remove = [k for k in self._history_cache.keys() if k.startswith(f"{session_id}:")]
        for k in keys_to_remove:
            try:
                del self._history_cache[k]
            except KeyError:
                pass
    
    def _init_db(self):
        """Initialize database engine and create tables."""
        try:
            self.engine = create_engine(
                self.db_url,
                connect_args={
                    "keepalives": 1,
                    "keepalives_idle": 30,
                    "keepalives_interval": 10,
                    "keepalives_count": 5,
                }
            )
            Base.metadata.create_all(self.engine)
            self.SessionLocal = sessionmaker(bind=self.engine)
            self._initialized = True
            logger.info("✅ ChatStore database initialized")
        except Exception as e:
            logger.error(f"❌ ChatStore init failed: {e}")
            self._initialized = False
    
    def update_session_title(self, session_id: str, user_id: str, title: str) -> bool:
        """Update or create session title."""
        if not self._initialized:
            return False
            
        try:
            with self.SessionLocal() as session:
                # Check if session exists
                chat_session = session.query(ChatSession).filter(
                    ChatSession.session_id == session_id
                ).first()
                
                if chat_session:
                    chat_session.title = title
                else:
                    chat_session = ChatSession(
                        session_id=session_id,
                        user_id=user_id,
                        title=title
                    )
                    session.add(chat_session)
                
                session.commit()
                return True
        except Exception as e:
            logger.error(f"Failed to update session title: {e}")
            return False

    def get_session_title(self, session_id: str) -> Optional[str]:
        """Get session title."""
        if not self._initialized:
            return None
            
        try:
            with self.SessionLocal() as session:
                chat_session = session.query(ChatSession).filter(
                    ChatSession.session_id == session_id
                ).first()
                return chat_session.title if chat_session else None
        except Exception as e:
            logger.error(f"Failed to get session title: {e}")
            return None

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
                
                # Ensure session record exists
                chat_session = session.query(ChatSession).filter(
                    ChatSession.session_id == session_id
                ).first()
                
                if not chat_session:
                    chat_session = ChatSession(
                        session_id=session_id,
                        user_id=user_id,
                        title="New Chat"
                    )
                    session.add(chat_session)
                
                session.commit()
                
                # Invalidate cache for this session
                self._invalidate_session_cache(session_id)
                
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
                
                # Ensure session record exists
                chat_session = session.query(ChatSession).filter(
                    ChatSession.session_id == session_id
                ).first()
                
                if not chat_session:
                    chat_session = ChatSession(
                        session_id=session_id,
                        user_id=user_id,
                        title="New Chat"
                    )
                    session.add(chat_session)

                session.commit()
                
                # Invalidate cache
                self._invalidate_session_cache(session_id)

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
            
        # Check Cache
        if self._history_cache is not None:
            cache_key = f"{session_id}:{limit}"
            if cache_key in self._history_cache:
                logger.debug(f"⚡ Cache HIT for session {session_id}")
                return self._history_cache[cache_key]
        
        try:
            with self.SessionLocal() as session:
                messages = session.query(ChatMessage).filter(
                    ChatMessage.user_id == user_id,
                    ChatMessage.session_id == session_id
                ).order_by(ChatMessage.timestamp.desc()).limit(limit).all()
                
                result = [
                    {
                        "id": msg.id,
                        "role": msg.role,
                        "content": msg.content,
                        "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                        "metadata": msg.msg_metadata
                    }
                    for msg in reversed(messages)  # Return in chronological order
                ]
                
                # Update Cache
                if self._history_cache is not None:
                    cache_key = f"{session_id}:{limit}"
                    self._history_cache[cache_key] = result

                return result
        except Exception as e:
            logger.error(f"Failed to get session history: {e}")
            return []
    
    def get_user_sessions(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get list of sessions for a user with metadata."""
        if not self._initialized:
            return []
        
        try:
            with self.SessionLocal() as session:
                # Try to get from ChatSession table first
                sessions = session.query(ChatSession).filter(
                    ChatSession.user_id == user_id
                ).order_by(ChatSession.created_at.desc()).limit(limit).all()
                
                if sessions:
                    return [
                        {
                            "session_id": s.session_id,
                            "title": s.title,
                            "created_at": s.created_at.isoformat() if s.created_at else None
                        }
                        for s in sessions
                    ]
                
                # Fallback to old method if no ChatSession records
                results = session.query(ChatMessage.session_id).filter(
                    ChatMessage.user_id == user_id
                ).distinct().limit(limit).all()
                return [{"session_id": r[0], "title": None, "created_at": None} for r in results]
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
                
                session.query(ChatSession).filter(
                    ChatSession.user_id == user_id,
                    ChatSession.session_id == session_id
                ).delete()
                
                session.commit()
                
                # Invalidate cache
                self._invalidate_session_cache(session_id)

                return True
        except Exception as e:
            logger.error(f"Failed to delete session: {e}")
            return False
    
    def get_first_user_message(self, user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Get the first user message in a session (for title/timestamp)."""
        if not self._initialized:
            return None
        
        try:
            with self.SessionLocal() as session:
                msg = session.query(ChatMessage).filter(
                    ChatMessage.user_id == user_id,
                    ChatMessage.session_id == session_id,
                    ChatMessage.role == "user"
                ).order_by(ChatMessage.timestamp.asc()).first()
                
                if msg:
                    return {
                        "content": msg.content,
                        "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
                    }
                return None
        except Exception as e:
            logger.error(f"Failed to get first user message: {e}")
            return None

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
                
                session.query(ChatSession).filter(
                    ChatSession.created_at < cutoff_date
                ).delete()

                session.commit()
                
                # Clear all cache to be safe or ignore (expired sessions likely not in cache)
                if self._history_cache:
                    self._history_cache.clear()
                
                if result > 0:
                    logger.info(f"🧹 Cleaned up {result} messages older than {retention_days} days")
                return result
        except Exception as e:
            logger.error(f"Failed to cleanup old sessions: {e}")
            return 0
