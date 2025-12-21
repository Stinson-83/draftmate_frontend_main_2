"""
Session Cache - Temporary FAISS vector store for web search results

Features:
- Per-session index (keyed by session_id)
- SHA256 content hashing for deduplication
- TTL-based cleanup for memory management
"""

import hashlib
import time
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import numpy as np

from lex_bot.config import SESSION_CACHE_TTL_MINUTES, EMBEDDING_MODEL_NAME

logger = logging.getLogger(__name__)


class SessionCache:
    """
    In-memory FAISS-based cache for session-specific search results.
    
    Usage:
        cache = SessionCache()
        cache.add_documents("session_123", [{"text": "...", "url": "..."}])
        results = cache.search("session_123", "query", top_k=5)
    """
    
    def __init__(self):
        """Initialize session cache."""
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._hashes: Dict[str, set] = {}  # Track content hashes per session
        self._model = None
        self._faiss = None
        self._initialized = False
        
        self._init_dependencies()
        
        self._file_paths: Dict[str, str] = {}
        self._file_chunks: Dict[str, List[str]] = {}
    
    def _init_dependencies(self):
        """Lazy load FAISS and embedding model."""
        try:
            import faiss
            from sentence_transformers import SentenceTransformer
            
            self._faiss = faiss
            logger.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME}")
            self._model = SentenceTransformer(EMBEDDING_MODEL_NAME)
            self._initialized = True
            logger.info("✅ SessionCache initialized")
        except ImportError as e:
            logger.warning(f"⚠️ SessionCache dependencies missing: {e}")
            logger.warning("Run: pip install faiss-cpu sentence-transformers")
            self._initialized = False
        except Exception as e:
            logger.error(f"❌ SessionCache init failed: {e}")
            self._initialized = False
    
    def _get_content_hash(self, text: str) -> str:
        """Generate SHA256 hash of content."""
        return hashlib.sha256(text.encode('utf-8')).hexdigest()
    
    def _get_or_create_session(self, session_id: str) -> Dict[str, Any]:
        """Get or create a session cache entry."""
        if session_id not in self._sessions:
            dim = self._model.get_sentence_embedding_dimension() if self._model else 384
            self._sessions[session_id] = {
                "index": self._faiss.IndexFlatIP(dim) if self._faiss else None,  # Inner product for similarity
                "documents": [],
                "created_at": datetime.now(),
                "last_accessed": datetime.now(),
            }
            self._hashes[session_id] = set()
        
        self._sessions[session_id]["last_accessed"] = datetime.now()
        return self._sessions[session_id]
    
    def add_documents(
        self,
        session_id: str,
        documents: List[Dict[str, Any]],
        text_key: str = "text"
    ) -> int:
        """
        Add documents to session cache with deduplication.
        
        Args:
            session_id: Session identifier
            documents: List of document dicts
            text_key: Key containing text content to embed
            
        Returns:
            Number of documents actually added (after dedup)
        """
        if not self._initialized:
            logger.warning("SessionCache not initialized")
            return 0
        
        session = self._get_or_create_session(session_id)
        added_count = 0
        new_docs = []
        new_texts = []
        
        for doc in documents:
            text = doc.get(text_key, "") or doc.get("snippet", "") or doc.get("content", "")
            if not text:
                continue
            
            # Check for duplicates via hash
            content_hash = self._get_content_hash(text)
            if content_hash in self._hashes[session_id]:
                logger.debug(f"Skipping duplicate content: {text[:50]}...")
                continue
            
            self._hashes[session_id].add(content_hash)
            new_docs.append({**doc, "_hash": content_hash})
            new_texts.append(text)
            added_count += 1
        
        if not new_texts:
            return 0
        
        # Generate embeddings and add to index
        embeddings = self._model.encode(new_texts, normalize_embeddings=True)
        session["index"].add(np.array(embeddings, dtype=np.float32))
        session["documents"].extend(new_docs)
        
        logger.info(f"Added {added_count} documents to session {session_id}")
        return added_count
    
    def search(
        self,
        session_id: str,
        query: str,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search session cache for relevant documents.
        
        Args:
            session_id: Session identifier
            query: Search query
            top_k: Number of results to return
            
        Returns:
            List of matching documents with scores
        """
        if not self._initialized:
            return []
        
        if session_id not in self._sessions:
            return []
        
        session = self._get_or_create_session(session_id)
        
        if not session["documents"]:
            return []
        
        # Encode query
        query_embedding = self._model.encode([query], normalize_embeddings=True)
        
        # Search
        k = min(top_k, len(session["documents"]))
        scores, indices = session["index"].search(
            np.array(query_embedding, dtype=np.float32),
            k
        )
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx >= 0 and idx < len(session["documents"]):
                doc = session["documents"][idx].copy()
                doc["_score"] = float(score)
                results.append(doc)
        
        return results
    
    def get_all_documents(self, session_id: str) -> List[Dict[str, Any]]:
        """Get all documents in a session cache."""
        if session_id not in self._sessions:
            return []
        return self._sessions[session_id]["documents"]

    def set_file_path(self, session_id: str, file_path: str):
        """Store the uploaded file path for a session."""
        self._get_or_create_session(session_id) # Ensure session exists
        self._file_paths[session_id] = file_path
        logger.info(f"Stored file path for session {session_id}: {file_path}")

    def get_file_path(self, session_id: str) -> Optional[str]:
        """Retrieve the uploaded file path for a session."""
        return self._file_paths.get(session_id)
    
    def set_file_chunks(self, file_path: str, chunks: List[str]):
        """Cache extracted text chunks for a file."""
        print(f"DEBUG: Caching {len(chunks)} chunks for key: '{file_path}'")
        self._file_chunks[file_path] = chunks
        logger.info(f"Cached {len(chunks)} chunks for file: {file_path}")
        
    def get_file_chunks(self, file_path: str) -> Optional[List[str]]:
        """Retrieve cached chunks for a file."""
        chunks = self._file_chunks.get(file_path)
        if chunks:
            print(f"DEBUG: Cache HIT for key: '{file_path}' ({len(chunks)} chunks)")
        else:
            print(f"DEBUG: Cache MISS for key: '{file_path}'. Available keys: {list(self._file_chunks.keys())}")
        return chunks
    
    def clear_session(self, session_id: str) -> bool:
        """Clear a specific session cache."""
        if session_id in self._sessions:
            del self._sessions[session_id]
        if session_id in self._hashes:
            del self._hashes[session_id]
            
        # Cleanup file chunks if associated with this session
        if session_id in self._file_paths:
            file_path = self._file_paths[session_id]
            if file_path in self._file_chunks:
                del self._file_chunks[file_path]
            del self._file_paths[session_id]
            
        logger.info(f"Cleared session cache: {session_id}")
        return True
    
    def cleanup_expired(self) -> int:
        """Remove sessions that have exceeded TTL."""
        if not self._sessions:
            return 0
        
        now = datetime.now()
        ttl = timedelta(minutes=SESSION_CACHE_TTL_MINUTES)
        expired = []
        
        for session_id, data in self._sessions.items():
            if now - data["last_accessed"] > ttl:
                expired.append(session_id)
        
        for session_id in expired:
            self.clear_session(session_id)
        
        if expired:
            logger.info(f"Cleaned up {len(expired)} expired sessions")
        
        return len(expired)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "active_sessions": len(self._sessions),
            "total_documents": sum(
                len(s["documents"]) for s in self._sessions.values()
            ),
            "sessions": {
                sid: {
                    "documents": len(s["documents"]),
                    "created": s["created_at"].isoformat(),
                    "last_accessed": s["last_accessed"].isoformat(),
                }
                for sid, s in self._sessions.items()
            }
        }


# Singleton instance
_session_cache = None

def get_session_cache() -> SessionCache:
    """Get or create the global SessionCache instance."""
    global _session_cache
    if _session_cache is None:
        _session_cache = SessionCache()
    return _session_cache
