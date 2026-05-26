# Project Endpoints & Run Instructions

This document outlines how to run the frontend and all backend services required for the application.

## 1. Frontend
The main user interface.

- **Directory**: `draftmate_frontend_main`
- **Port**: 5173 (default Vite port)
- **Command**:
  ```powershell
  # Open a new terminal
  cd c:\Users\AYUSH\draftmate_frontend_main
  npm run dev
  ```

## 2. Backend Services

### A. Deep Research (Lex Bot)
Handles AI legal research and chat.

- **Directory**: `backend/Deep_research`
- **Port**: **8004**
- **Method 1: Docker (Recommended)**
  ```powershell
  cd c:\Users\AYUSH\draftmate_frontend_main\backend\Deep_research
  docker compose up --build
  ```
- **Method 2: Manual (Python)**
  ```powershell
  cd c:\Users\AYUSH\draftmate_frontend_main\backend\Deep_research
  # Activate venv (if exists, e.g. .venv or venv)
  .\venv\Scripts\Activate.ps1
  # Install requirements if needed
  pip install -r requirements.txt
  # Run app
  python -m lex_bot.app
  ```

### B. Converter Service
Handles document conversion (HTML, PDF, etc.).

- **Directory**: `backend/converter`
- **Port**: **8000**
- **Command**:
  ```powershell
  cd c:\Users\AYUSH\draftmate_frontend_main\backend\converter
  # Activate venv
  .\venv\Scripts\Activate.ps1
  # Run app
  uvicorn app:app --reload --port 8000
  ```

### C. Legal Drafter (Drafter)
Generates legal drafts using AI.

- **Directory**: `backend/Drafter`
- **Port**: **8001**
- **Command**:
  ```powershell
  cd c:\Users\AYUSH\draftmate_frontend_main\backend\Drafter
  # Create venv if missing or broken
  python -m venv venv
  # Activate venv
  .\venv\Scripts\Activate.ps1
  # Install dependencies
  pip install -r requirements.txt
  # Run app
  uvicorn Drafter:app --host 0.0.0.0 --port 8001 --reload
  ```

### D. Enhance Bot (Document Enhancer)
AI features for enhancing legal content and clauses.

- **Directory**: `backend/Enhance_bot`
- **Port**: **8002**
- **Command**:
  ```powershell
  cd c:\Users\AYUSH\draftmate_frontend_main\backend\Enhance_bot
  # Activate venv
  .\venv\Scripts\Activate.ps1
  # Install dependencies
  pip install -r requirements.txt
  # Run app
  python Enhance.py
  # OR: uvicorn Enhance:app --host 0.0.0.0 --port 8002 --reload
  ```

### E. PDF Toolkit (PDF_Editor)
Provides PDF manipulation tools (Merge, Split, Watermark, etc.).

- **Directory**: `backend/PDF_Editor`
- **Port**: **8003**
- **Command**:
  ```powershell
  cd c:\Users\AYUSH\draftmate_frontend_main\backend\PDF_Editor
  # Activate venv
  .\venv\Scripts\Activate.ps1
  # Install dependencies
  pip install -r requirements.txt
  # Run app (MUST use port 8003)
  uvicorn api:app --reload --port 8003
  ```

### F. Query Service (Legal Query)
Handles legal template search and retrieval.

- **Directory**: `backend/query`
- **Port**: **8001** (Note: Defaults to 8001, which conflicts with Drafter. You may need to run this on a different port, e.g., 8005, using the command below.)
- **Command**:
  ```powershell
  cd c:\Users\AYUSH\draftmate_frontend_main\backend\query
  # Create venv if missing
  python -m venv venv
  # Activate venv
  .\venv\Scripts\Activate.ps1
  # Install dependencies
  pip install -r requirements.txt
  # Run app (Change port if 8001 is busy)
  uvicorn Query:app --host 0.0.0.0 --port 8005 --reload
  ```

## Summary of Active Ports
- **Frontend**: `http://localhost:5173`
- **Converter**: `http://localhost:8000`
- **Drafter**: `http://localhost:8003`
- **Enhance Bot**: `http://localhost:8002`
- **PDF Editor**: `http://localhost:8005`
- **Deep Research**: `http://localhost:8004`
- **Query Service**: `http://localhost:8001` 
