-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;         -- pgvector
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- trigram for fuzzy titles/search

-- 2. Raw JSON store (No major changes here)
CREATE TABLE IF NOT EXISTS docs_raw (
  id           BIGSERIAL PRIMARY KEY,
  filename     TEXT,
  title        TEXT,
  year         INT,
  category     TEXT,
  data         JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 3. Retrieval passages (The Heavy Lifting Table)
CREATE TABLE IF NOT EXISTS passages (
  id           BIGSERIAL PRIMARY KEY,
  doc_id       BIGINT REFERENCES docs_raw(id) ON DELETE CASCADE,
  
  -- Metadata
  section_no   TEXT,
  heading      TEXT,
  
  -- SEARCH CONTENT (The Child Chunk)
  -- This is what we search against (e.g., specific clause text)
  text         TEXT NOT NULL,
  
  -- CONTEXT CONTENT (The Parent Chunk) - NEW ADDITION
  -- This is what we send to the LLM (e.g., the full Section/Article)
  -- If null, we fall back to 'text'.
  parent_text  TEXT, 

  -- EMBEDDING - UPDATED
  -- Changed to 1024 dimensions to support BAAI/bge-m3
  embedding    VECTOR(1024), 

  -- Denormalized filters (for speed)
  year         INT,
  category     TEXT,
  
  -- Search Optimization (Hybrid Search)
  -- We store the TSVECTOR column directly for faster filtering than on-the-fly generation
  search_vector TSVECTOR GENERATED ALWAYS AS (
     setweight(to_tsvector('english', coalesce(heading, '')), 'A') || 
     setweight(to_tsvector('english', text), 'B')
  ) STORED,

  -- Housekeeping
  token_count  INT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes

-- A. HNSW Vector Index (Replaces IVFFLAT)
-- Much higher recall (accuracy) for legal documents. No training step required.
-- m=16, ef_construction=64 are good production defaults.
CREATE INDEX IF NOT EXISTS passages_vec_idx ON passages
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- B. Lexical Search Index (Uses the pre-calculated column)
CREATE INDEX IF NOT EXISTS passages_text_search_idx ON passages USING GIN (search_vector);

-- C. Fuzzy Search for Headings (e.g., "Artcle 21" typo handling)
CREATE INDEX IF NOT EXISTS passages_heading_trgm_idx ON passages USING GIN (heading gin_trgm_ops);

-- D. Metadata Filters (Standard B-Trees)
CREATE INDEX IF NOT EXISTS passages_year_idx ON passages(year);
CREATE INDEX IF NOT EXISTS passages_category_idx ON passages(category);