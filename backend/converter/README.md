# Converter service

This folder contains a minimal FastAPI-based converter service that accepts file uploads and returns HTML.

How it works
- POST /convert (multipart/form-data, field name `file`) → returns HTML
- Uses `pypandoc` for Word/RTF/HTML conversions
- Uses the included PyMuPDF converter for PDF → HTML (blueprint-style)

Local dev

1. Create a virtualenv and activate it

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Run the app

```powershell
uvicorn app:app --reload
```

Docker

Build and run:

```powershell
docker build -t converter:local .
docker run -p 8000:8000 converter:local
```

Notes
- Make sure `pandoc` and `wkhtmltopdf` are installed in the production image if you rely on them (the Dockerfile installs them).
- Sanitize returned HTML before injecting into a browser (use DOMPurify on client).
