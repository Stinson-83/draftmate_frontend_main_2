import os
import logging
from typing import List, Dict, Optional, Tuple
from ..config import DATABASE_URL, EMBEDDING_MODEL_NAME, DB_SEARCH_LIMIT_PRE
from .web_search import web_search_tool

# Configure logging
logger = logging.getLogger(__name__)

class SearchTool:
    def __init__(self):
        self.engine = None
        self.model = None
        
        # Lazy Import / Helper
        self._init_resources()

    def _init_resources(self):
        # 1. DB Engine
        if DATABASE_URL:
            try:
                from sqlalchemy import create_engine
                self.engine = create_engine(DATABASE_URL)
                # Test connection logic could be here
            except ImportError:
                logger.error("SQLAlchemy not installed.")
            except Exception as e:
                logger.error(f"❌ DB Init Failed: {e}")
        
        # 2. Embedding Model
        try:
            from sentence_transformers import SentenceTransformer
            print(f"🔍 Loading Embedding Model: {EMBEDDING_MODEL_NAME}...")
            self.model = SentenceTransformer(EMBEDDING_MODEL_NAME)
        except ImportError:
            logger.error("SentenceTransformers not installed.")
        except Exception as e:
            logger.error(f"❌ Model Loading Failed: {e}")

    def _get_embedding(self, query: str) -> List[float]:
        if not self.model:
            return []
        return self.model.encode([query], normalize_embeddings=True)[0].tolist()

    def _hybrid_db_search(self, query: str) -> List[Dict]:
        if not self.engine or not self.model:
             # Explicitly raising or returning empty to trigger fallback
            return []

        try:
            from sqlalchemy import text as sql
            from sqlalchemy.orm import Session
        except ImportError:
            return []

        q_emb = self._get_embedding(query)
        
        query_sql = sql("""
        WITH q AS (
            SELECT 
                websearch_to_tsquery('english', :qtext) AS qtsv,
                CAST(:qemb AS vector) AS qemb
        )
        SELECT 
            p.id, p.doc_id, p.heading, p.text, p.parent_text, p.year, p.category, r.title,
            ts_rank(p.search_vector, (SELECT qtsv FROM q)) AS lex,
            (p.embedding <=> (SELECT qemb FROM q)) AS distance
        FROM passages p
        JOIN docs_raw r ON r.id = p.doc_id
        ORDER BY p.embedding <=> (SELECT qemb FROM q)
        LIMIT :pre_k
        """)

        try:
            with Session(self.engine) as ses:
                rows = ses.execute(query_sql, {'qtext': query, 'qemb': q_emb, 'pre_k': DB_SEARCH_LIMIT_PRE}).mappings().all()

            if not rows:
                return []

            results = []
            for r in rows:
                results.append({
                    "title": r['title'],
                    "heading": r['heading'],
                    "text": r['parent_text'] if r['parent_text'] else r['text'],
                    "search_hit": r['text'],
                    "url": "local_db",
                    "source": "Database"
                })
            return results
            
        except Exception as e:
            logger.error(f"SQL Execution error: {e}")
            return []

    def run(self, query: str, domains: List[str] = None) -> Tuple[str, List[Dict]]:
        """
        Attempts DB Search. If fails/empty -> Web Search.
        """
        logger.info(f"🔎 SearchTool called for: {query}")
        
        # 1. Try DB Search
        # db_results = self._hybrid_db_search(query)
        db_results = [] # Force empty to skip local DB as it is currently empty
        
        if db_results:
            logger.info(f"✅ DB Search returned {len(db_results)} results.")
            context = ""
            for r in db_results[:10]:
                context += f"Source: {r['title']} > {r['heading']}\n{r['text']}\n\n"
            return context, db_results
        
        logger.warning("⚠️ DB Search empty/unavailable. Falling back to Web...")

        # 2. Fallback to Web Search
        return web_search_tool.run(query, domains)

search_tool = SearchTool()
