import os, json, hashlib
from typing import List, Dict, Tuple
import numpy as np
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from models import Base, DocRaw, Passage
from pgvector.sqlalchemy import register_vector
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer

load_dotenv()

TEST_MODE = os.getenv('TEST_MODE', '0') == '1'
DB_URL = os.getenv('DATABASE_URL')

# Updated to Lightweight Model
MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2") 
# Updated dimensions to match all-MiniLM-L6-v2
EMB_DIM = 384

# Create model only if not TEST_MODE
st_model = None
if not TEST_MODE:
    print(f"📥 Loading Model: {MODEL_NAME}...")
    st_model = SentenceTransformer(MODEL_NAME)

engine = create_engine(DB_URL)
register_vector(engine)
Base.metadata.create_all(engine)

# --- CHUNKER (Updated for Parent-Child Strategy) ---
def get_child_chunks(text):
    """
    Splits the 'Parent' text into smaller 'Child' chunks for vector search.
    Legal documents need granularity.
    Chunk Size: ~256 tokens (1024 chars) -> Good for specific clauses.
    Overlap: 200 chars -> Prevents cutting off sentences/definitions.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1024, 
        chunk_overlap=200,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    chunks = splitter.split_text(text)
    return chunks

def _local_embed(s: str, dim: int = EMB_DIM) -> List[float]:
    h = hashlib.sha256(s.encode("utf-8")).digest()
    rng = np.random.default_rng(int.from_bytes(h[:8], "big"))
    v = rng.normal(size=dim)
    v = v / (np.linalg.norm(v) + 1e-9)
    return v.astype(float).tolist()

def embed_texts(texts: List[str]) -> List[List[float]]:
    if not texts:
        return []
    if TEST_MODE:
        return [_local_embed(t) for t in texts]

    # self-hosted encoder
    # BGE-M3 handles larger batches well, but keeping 32 for safety on standard GPUs
    embs = st_model.encode(texts, normalize_embeddings=True, batch_size=32, show_progress_bar=True)
    return embs.tolist()


# --- HELPERS ---
def make_checksum(s: str) -> str:
    return hashlib.sha1(s.encode('utf-8')).hexdigest()

# --- MAIN INGEST ---
def ingest_jsonl(path: str, title_key='title', year_key='year', category_key='category', text_key='text'):
    print(f"🚀 Starting ingestion from {path}")
    
    # Ensure tables exist
    with engine.begin() as conn:
        Base.metadata.create_all(conn)
        
    with Session(engine) as ses:
        with open(path, 'r', encoding='utf-8') as f:
            batch_passages: List[Tuple[DocRaw, List[Dict]]] = []
            count = 0
            
            for line in f:
                if not line.strip(): continue
                
                try:
                    rec = json.loads(line)
                except json.JSONDecodeError:
                    print(f"Skipping invalid JSON line: {line[:50]}...")
                    continue

                title = rec.get(title_key)
                year = rec.get(year_key)
                category = rec.get(category_key)
                
                # The Full Text from JSON is our "Parent Context"
                parent_text = rec.get(text_key) or ''
                
                if not parent_text:
                    continue

                # 1. Store Raw Document
                doc = DocRaw(filename=os.path.basename(path), title=title, year=year, category=category, data=rec)
                ses.add(doc)
                ses.flush()  # Generate doc.id

                # 2. Create Child Chunks
                units = []
                child_chunks = get_child_chunks(parent_text)
                
                for ch in child_chunks:
                    heading = rec.get('heading') # If your JSON has specific headings, use them
                    
                    # Contextual text for Embedding (Title + Heading + Chunk)
                    # This helps the vector model understand "Section 302" vs just "Punishment"
                    embed_input = f"{title or ''}\n{heading or ''}\n{ch}".strip()
                    
                    units.append({
                        'doc_id': doc.id,
                        'section_no': rec.get('section_no'), # Map if available
                        'heading': heading,
                        'text': ch,              # CHILD: The small search unit
                        'parent_text': parent_text, # PARENT: The full context for LLM
                        'year': year,
                        'category': category,
                        'token_count': len(ch.split()),
                        'checksum': make_checksum(embed_input),
                        '_embed_input': embed_input # Temporary field for embedding generation
                    })
                
                batch_passages.append((doc, units))
                count += 1
                
                if count % 100 == 0:
                    print(f"Processed {count} documents...")

            # 3. Generate Embeddings in Bulk
            if not batch_passages:
                print("No valid documents found.")
                return

            print("🧠 Generating embeddings...")
            
            # Flatten inputs for the embedding model
            flat_texts = [u['_embed_input'] for _, units in batch_passages for u in units]
            embs = embed_texts(flat_texts)
            
            # 4. Assign Embeddings and Commit
            print("💾 Saving to database...")
            emb_idx = 0
            for _, units in batch_passages:
                for u in units:
                    # Clean up temp field
                    del u['_embed_input']
                    # Assign vector
                    u['embedding'] = np.array(embs[emb_idx]).tolist()
                    emb_idx += 1
                    
                    # Add to session
                    ses.add(Passage(**u))
            
            ses.commit()
            print(f"✅ Ingestion complete. Processed {count} docs and {emb_idx} passages.")

if __name__ == '__main__':
    # Example: python ingest.py data/documents.jsonl
    import sys
    if len(sys.argv) < 2:
        print("Usage: python ingest.py <path_to_jsonl>")
    else:
        ingest_jsonl(sys.argv[1])