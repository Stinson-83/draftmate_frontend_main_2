CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS documents (
  doc_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  canonical_title TEXT,
  doc_type TEXT,
  source_url TEXT,
  download_url TEXT,
  original_filename TEXT,
  file_extension TEXT,
  file_size_kb FLOAT,
  language TEXT,
  scrape_timestamp timestamptz,
  s3_path TEXT,
  snippet TEXT,
  tags TEXT[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
