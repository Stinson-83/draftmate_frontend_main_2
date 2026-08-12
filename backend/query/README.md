# Legal Query Service

FastAPI-based service to search and retrieve legal document templates using natural language queries.

## Features

- **Natural Language Query Parsing**: Uses Google Gemini LLM to parse legal requirements
- **Template Search**: Searches PostgreSQL database for matching legal templates
- **Scoring & Ranking**: Matches queries against documents and returns best templates with alternatives
- **S3 Integration**: Stores and retrieves templates from AWS S3
- **Flexible Search**: Supports phrase matching, tokenization, and tag-based filtering

## Setup

### 1. Install Dependencies

```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # PowerShell
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `queries/env` template or create a `.env` file at the backend root with:

```env
GOOGLE_API_KEY=your_gemini_api_key
POSTGRES_DSN=postgresql://user:password@host:5432/database
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
S3_BUCKET=your_bucket_name
UPLOAD_FOLDER=./downloaded_files
INPUT_JSON=scraped_data.jsonl
```

### 3. Initialize Database

The service creates tables automatically on first run. Ensure your PostgreSQL database is accessible.

## Running Locally

```bash
cd backend/query
.\.venv\Scripts\Activate.ps1
uvicorn Query:app --reload --host 0.0.0.0 --port 8001
```

Access at http://127.0.0.1:8001

## API Endpoints

### Health Check
- `GET /` — Health status
- `GET /diag` — Environment diagnostics

### Query & Search
- `POST /parse-query` — Parse natural language query to search terms
  ```json
  {"user_query": "I need acknowledgement letter for loan repayment"}
  ```

- `POST /search` — Find best matching template
  ```json
  {"user_query": "acknowledgement letter for loan", "language": "en"}
  ```

### File Management
- `POST /download-template` — Download template from S3
  ```json
  {"s3_path": "s3://bucket/docs/id/file.pdf"}
  ```

## Architecture

```
Query Service (FastAPI)
    ↓
    ├─ query.py: LLM-based query normalization (Gemini)
    ├─ main_file.py: Template matching & scoring
    ├─ sql.py: PostgreSQL search (documents table)
    ├─ ingest.py: Data ingestion from JSON to DB/S3
    └─ scoring.py: Document scoring logic
```

## Database Schema

```sql
CREATE TABLE documents (
  doc_id uuid PRIMARY KEY,
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
  created_at timestamptz,
  updated_at timestamptz
);
```

## Docker

Build and run:

```bash
docker build -t query-service:local .
docker run -p 8001:8001 \
  -e GOOGLE_API_KEY=... \
  -e POSTGRES_DSN=... \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  -e S3_BUCKET=... \
  query-service:local
```

## Development Notes

- Ensure PostgreSQL and S3 are accessible from the service
- Google Gemini API key must be valid
- Use `/diag` endpoint to verify environment setup
- Logs are printed to console; use structured logging for production

## Security Notes

- Never commit `.env` files with credentials
- Use environment variables or secrets manager for production
- Restrict CORS origins in production (currently allows all)
- Sanitize user inputs before passing to LLM
