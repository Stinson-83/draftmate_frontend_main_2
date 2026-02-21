import os
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

DOC_AGENT_PROMPT = """You are a helpful assistant analyzing document(s) uploaded by the user.

**User Query:**
{query}

**Document Context (from uploaded PDF(s)):**
{doc_context}

**External Context (from Web Search):**
{web_context}

**Instructions:**
1. Answer the user's query primarily using the Document Context.
2. If multiple documents are provided, address each one separately and clearly label your response by document.
3. Use External Context to supplement or verify information if needed.
4. Clearly state if the information comes from the document or external sources.
5. If the document doesn't contain the answer, say so, and rely on external context (but mention this).
6. Be concise and accurate.

**Answer:**"""

DOC_AGENT_COT_PROMPT = """You are an expert Legal Analyst reviewing document(s).
**User Query:**
{query}

**Document Context:**
{doc_context}

**External Context:**
{web_context}

**Task:**
Provide a detailed, reasoned answer using Chain of Thought.
If multiple documents are provided, reason about each one separately.

**Reasoning Steps:**
1. **Analyze Document(s)**: What does each uploaded document explicitly say about the query? Quote key sections.
2. **Verify with External Sources**: Does the web context support or contradict the document(s)?
3. **Synthesize**: Combine internal and external evidence.
4. **Conclusion**: Answer the query directly based on the evidence.

**Answer:**"""


def _get_chunks_per_file(
    file_paths: List[str],
    query: str,
    total_top_n: int = 10,
) -> List[Dict[str, Any]]:
    """
    Retrieve chunks from each file with a proportional budget (per-file allocation).

    For N files, each file gets max(2, total_top_n // N) top chunks.
    This guarantees every uploaded PDF is represented in the context window,
    even for vague queries like 'summarise both'.

    Returns a list of chunk dicts, each tagged with 'source_file' and 'source_label'.
    """
    session_cache = get_session_cache()
    n_files = len(file_paths)
    budget_per_file = max(2, total_top_n // n_files)

    all_labeled_chunks: List[Dict[str, Any]] = []

    for idx, file_path in enumerate(file_paths):
        label = f"Document {idx + 1} ({os.path.basename(file_path)})"
        try:
            # Check cache first
            cached_chunks = session_cache.get_file_chunks(file_path)
            if cached_chunks:
                logger.info(f"⚡ Cache HIT for {file_path}")
                chunks = cached_chunks
            else:
                full_text = pdf_processor.extract_text(file_path)
                chunks = pdf_processor.chunk_text(full_text)
                session_cache.set_file_chunks(file_path, chunks)

            if not chunks:
                logger.warning(f"No chunks extracted from {file_path}")
                continue

            # Build candidate dicts for this file's chunks
            candidates = [{"text": c, "source": label} for c in chunks]

            # Rerank within this file to pick the most relevant chunks
            top = rerank_documents(query, candidates, top_n=budget_per_file)

            # Tag each chunk with metadata
            for chunk in top:
                chunk["source_file"] = file_path
                chunk["source_label"] = label

            all_labeled_chunks.extend(top)
            logger.info(f"📄 {label}: selected {len(top)} / {len(chunks)} chunks")

        except Exception as e:
            logger.error(f"Failed to process file {file_path}: {e}")
            continue

    return all_labeled_chunks


class DocumentAgent(BaseAgent):
    """
    Agent for answering queries based on uploaded documents + web search.
    Uses per-file chunk allocation to ensure every PDF is represented.
    """

    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        query = state.get("original_query", "")
        file_paths = state.get("uploaded_file_paths", [])

        # Dynamic Mode Switching
        llm_mode = state.get("llm_mode", "fast")
        if self.mode != llm_mode:
            logger.info(f"🔄 Switching Document Agent to {llm_mode} mode...")
            self.switch_mode(llm_mode)

        logger.info(f"📄 DocumentAgent processing: {query[:50]}... ({len(file_paths)} file(s))")

        # 1. Process Documents — per-file allocation
        doc_context_str = "No document provided."
        doc_chunks: List[Dict[str, Any]] = []

        if file_paths:
            try:
                labeled_chunks = _get_chunks_per_file(
                    file_paths,
                    query=query,
                    total_top_n=12,  # total budget (split evenly across files)
                )

                if labeled_chunks:
                    doc_chunks = labeled_chunks
                    # Format: group by document label for clarity
                    sections = []
                    seen_labels = []
                    for chunk in labeled_chunks:
                        label = chunk.get("source_label", "Uploaded PDF")
                        if label not in seen_labels:
                            seen_labels.append(label)
                            sections.append(f"\n--- {label} ---")
                        sections.append(f"[Excerpt]: {chunk['text']}")

                    doc_context_str = "\n".join(sections)
                    logger.info(
                        f"✅ Built context from {len(file_paths)} files, "
                        f"{len(labeled_chunks)} total chunks"
                    )
                else:
                    doc_context_str = "Documents were empty or could not be read."

            except Exception as e:
                logger.error(f"Document processing failed: {e}")
                doc_context_str = f"Error processing documents: {e}"

        # 2. Web Search (for supplemental context)
        web_context_str = "No web search performed."
        web_results = []
        try:
            enhanced_query = f"{query} legal context"
            web_ctx, web_res = web_search_tool.run(enhanced_query)
            web_results = web_res
            if web_ctx:
                web_context_str = web_ctx[:2000]
        except Exception as e:
            logger.error(f"Web search failed: {e}")

        # 3. Generate Answer
        prompt_template = DOC_AGENT_COT_PROMPT if llm_mode == "reasoning" else DOC_AGENT_PROMPT
        prompt = ChatPromptTemplate.from_template(prompt_template)
        chain = prompt | self.llm | StrOutputParser()

        response = chain.invoke({
            "query": query,
            "doc_context": doc_context_str,
            "web_context": web_context_str
        })

        return {
            "final_answer": response,
            "selected_agents": ["document_agent"],
            "document_context": doc_chunks,
            "tool_results": [{
                "agent": "document",
                "web_results": web_results,
                "doc_summary": f"Processed {len(file_paths)} file(s), {len(doc_chunks)} chunks selected."
            }]
        }


document_agent = DocumentAgent()