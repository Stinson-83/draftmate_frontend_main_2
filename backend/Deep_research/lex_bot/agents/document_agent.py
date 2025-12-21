import logging
from typing import Dict, Any, List
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from .base_agent import BaseAgent
from ..tools.pdf_processor import pdf_processor
from ..tools.web_search import web_search_tool
from ..tools.reranker import rerank_documents
from ..tools.session_cache import get_session_cache

logger = logging.getLogger(__name__)

DOC_AGENT_PROMPT = """You are a helpful assistant analyzing a document uploaded by the user.

**User Query:**
{query}

**Document Context (from uploaded PDF):**
{doc_context}

**External Context (from Web Search):**
{web_context}

**Instructions:**
1. Answer the user's query primarily using the Document Context.
2. Use External Context to supplement or verify information if needed.
3. Clearly state if the information comes from the document or external sources.
4. If the document doesn't contain the answer, say so, and rely on external context (but mention this).
5. Be concise and accurate.

**Answer:**"""

DOC_AGENT_COT_PROMPT = """You are an expert Legal Analyst reviewing a document.
**User Query:**
{query}

**Document Context:**
{doc_context}

**External Context:**
{web_context}

**Task:**
Provide a detailed, reasoned answer using Chain of Thought.

**Reasoning Steps:**
1. **Analyze Document**: What does the uploaded document explicitly say about the query? Quote key sections.
2. **Verify with External Sources**: Does the web context support or contradict the document?
3. **Synthesize**: Combine internal and external evidence.
4. **Conclusion**: Answer the query directly based on the evidence.

**Answer:**"""

class DocumentAgent(BaseAgent):
    """
    Agent for answering queries based on uploaded documents + web search.
    """
    
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        query = state.get("original_query", "")
        file_path = state.get("uploaded_file_path")
        
        # Dynamic Mode Switching
        llm_mode = state.get("llm_mode", "fast")
        if self.mode != llm_mode:
            logger.info(f"🔄 Switching Document Agent to {llm_mode} mode...")
            self.switch_mode(llm_mode)
        
        logger.info(f"📄 DocumentAgent processing: {query[:50]}...")
        
        # 1. Process Document
        doc_context_str = "No document provided."
        doc_chunks = []
        
        if file_path:
            try:
                # Check cache first
                session_cache = get_session_cache()
                cached_chunks = session_cache.get_file_chunks(file_path)
                
                if cached_chunks:
                    logger.info("⚡ Using cached document chunks")
                    chunks = cached_chunks
                else:
                    # Extract and chunk
                    full_text = pdf_processor.extract_text(file_path)
                    chunks = pdf_processor.chunk_text(full_text)
                    # Cache for future use
                    session_cache.set_file_chunks(file_path, chunks)
                
                # Create pseudo-documents for reranker
                doc_docs = [{"text": c, "source": "Uploaded PDF"} for c in chunks]
                
                # Rerank to find relevant chunks
                if doc_docs:
                    top_chunks = rerank_documents(query, doc_docs, top_n=10)
                    doc_chunks = top_chunks
                    
                    # Format for prompt
                    doc_context_str = "\n\n".join([
                        f"[PDF Chunk]: {c['text']}" for c in top_chunks
                    ])
                else:
                    doc_context_str = "Document was empty or could not be read."
                    
            except Exception as e:
                logger.error(f"Document processing failed: {e}")
                doc_context_str = f"Error processing document: {e}"
        
        # 2. Web Search (for extra context)
        web_context_str = "No web search performed."
        web_results = []
        try:
            # Enhance query slightly for web
            enhanced_query = f"{query} legal context"
            web_ctx, web_res = web_search_tool.run(enhanced_query)
            web_results = web_res
            if web_ctx:
                web_context_str = web_ctx[:2000] # Limit length
        except Exception as e:
            logger.error(f"Web search failed: {e}")
        
        # 3. Return Context (Skip Final Answer)
        # We pass the extracted context back to the graph so the Manager/Router 
        # can decide whether to use LawAgent, CaseAgent, or just answer directly.
        
        return {
            # "final_answer": ... # No answer yet
            "selected_agents": ["document_agent"],
            "document_context": doc_chunks,
            "tool_results": [{
                "agent": "document",
                "web_results": web_results,
                "doc_summary": f"Processed {len(doc_chunks)} chunks from PDF."
            }]
        }

document_agent = DocumentAgent()