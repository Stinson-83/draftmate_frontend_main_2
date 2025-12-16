# Backend Services Startup Guide

This document explains how to start both converter and query services.

## Prerequisites

- Python 3.11+
- pandoc (for converter service)
- PostgreSQL (for query service)
- AWS credentials (for query service S3 access)
- Google Gemini API key (for query service)

## Service 1: Converter Service (Port 8000)

Converts documents (DOCX, PDF, RTF, HTML, TXT) to editable HTML.

### Setup

```powershell
cd backend\converter
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Install System Dependencies

```powershell
# Install pandoc (one-time, system-wide)
choco install pandoc -y
pandoc --version  # verify

# Optional: install wkhtmltopdf for advanced conversions
choco install wkhtmltopdf -y
```

### Start

```powershell
cd backend\converter
.\.venv\Scripts\Activate.ps1
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

Test: `http://127.0.0.1:8000/`

---

## Service 2: Query Service (Port 8001)

Searches legal templates and matches them to user queries using Gemini LLM.

### Setup

```powershell
cd backend\query
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Configure Environment

Create or update `backend/query/queries/env` (or `.env` at project root) with:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
POSTGRES_DSN=postgresql://user:password@host:5432/database
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
S3_BUCKET=your_s3_bucket_name
UPLOAD_FOLDER=./downloaded_files
INPUT_JSON=scraped_data.jsonl
```

### Start

```powershell
cd backend\query
.\.venv\Scripts\Activate.ps1
uvicorn Query:app --host 0.0.0.0 --port 8001 --reload
```

Test: `http://127.0.0.1:8001/`
Diagnostics: `http://127.0.0.1:8001/diag`

---

## Running Both Services Simultaneously

### Option 1: Two PowerShell Windows

**Window 1 (Converter)**:
```powershell
cd C:\Users\AYUSH\docu-edit\backend\converter
.\.venv\Scripts\Activate.ps1
uvicorn app:app --host 0.0.0.0 --port 8000
```

**Window 2 (Query)**:
```powershell
cd C:\Users\AYUSH\docu-edit\backend\query
.\.venv\Scripts\Activate.ps1
uvicorn Query:app --host 0.0.0.0 --port 8001
```

### Option 2: Docker Compose (Recommended for Production)

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'
services:
  converter:
    build: ./backend/converter
    ports:
      - "8000:8000"
    environment:
      - VITE_CONVERTER_API_URL=http://converter:8000
    networks:
      - backend

  query:
    build: ./backend/query
    ports:
      - "8001:8001"
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - POSTGRES_DSN=${POSTGRES_DSN}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - S3_BUCKET=${S3_BUCKET}
    networks:
      - backend

  frontend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - VITE_CONVERTER_API_URL=http://converter:8000
    networks:
      - backend

networks:
  backend:
    driver: bridge
```

Start all services:
```bash
docker-compose up --build
```

---

## Frontend Configuration

Update `.env` in project root to point to backend services:

```env
VITE_CONVERTER_API_URL=http://192.168.31.206:8000
VITE_QUERY_API_URL=http://192.168.31.206:8001
```

Or use localhost for local development:

```env
VITE_CONVERTER_API_URL=http://127.0.0.1:8000
VITE_QUERY_API_URL=http://127.0.0.1:8001
```

---

## Quick Health Checks

```powershell
# Converter health
curl http://127.0.0.1:8000/

# Query health
curl http://127.0.0.1:8001/

# Query diagnostics
curl http://127.0.0.1:8001/diag
```

---

## Troubleshooting

### Pandoc not found (Converter)
- Ensure pandoc is installed: `pandoc --version`
- Restart PowerShell after installing pandoc
- Or set env: `$env:PYPANDOC_PANDOC = "C:\Program Files\Pandoc\pandoc.exe"`

### Database connection failed (Query)
- Verify PostgreSQL is running
- Check POSTGRES_DSN in .env
- Ensure network allows access to RDS

### Google API errors (Query)
- Verify GOOGLE_API_KEY is set and valid
- Check rate limits on Gemini API

### Port already in use
- Change port in uvicorn command: `--port 8002`
- Or kill process: `netstat -ano | findstr :8000`

---

## Next Steps

1. Start both services (converter + query)
2. Update frontend `.env` with backend URLs
3. Start frontend: `npm run dev`
4. Upload a document and test the full flow
