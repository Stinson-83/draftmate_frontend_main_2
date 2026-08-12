# DraftMate: Workspace Handoff & Developer Guide

Welcome! This guide outlines the project architecture, microservices ports alignment, dynamic ONLYOFFICE configuration, and development launchers available in the repository.

---

## 1. Project Services & Port Configuration

The application is structured into the following microservices:

| Service | Directory | Port | Command / Launcher |
|---|---|---|---|
| **Frontend client** | Root | `5173` | `npm run dev` |
| **Converter** | `backend/converter` | `8000` | `uvicorn Converter:app --port 8000` |
| **Query Service** | `backend/query` | `8001` | `uvicorn Query:app --port 8001` |
| **Enhance Bot** | `backend/Enhance_bot` | `8002` | `uvicorn Enhance:app --port 8002` |
| **Legal Drafter** | `backend/Drafter` | `8003` | `uvicorn Drafter:app --port 8003` |
| **Lex Bot (RAG/Reasoning)** | `backend/Deep_research` | `8004` | `uvicorn lex_bot.app:app --port 8004` |
| **PDF Toolkit** | `backend/PDF_Editor` | `8005` | `uvicorn api:app --port 8005` |
| **Case Search** | `backend/Case_search` | `8006` | `uvicorn app:app --port 8006` |
| **Auth Service** | `backend/login_db` | `8009` | `uvicorn auth:app --port 8009` |
| **Notification** | `backend/Notification` | `8015` | `uvicorn app:app --port 8015` |
| **Subscriptions** | `backend/subscriptions` | `8016` | `uvicorn app:app --port 8016` |

---

## 2. Launching Development Environments

### Option A: Native Stack Launcher (Concurrently)
To launch the Vite frontend, Lex Bot backend, and Legal Drafter service concurrently in a single terminal session:
```powershell
npm run dev:all
```
*Note: Make sure your `.venv` is active and requirements are installed prior to running.*

### Option B: Unified Containerized Setup (Docker Compose)
To compile and run the full stack (Gateway Nginx proxy, ONLYOFFICE Server, and all python services compiled into the application image) locally:
```bash
docker compose -f docker-compose.dev.yml up --build
```
This maps:
* **Frontend Application Gateway**: `http://localhost:8080/`
* **ONLYOFFICE Document Server**: `http://localhost:8081/`

---

## 3. Dynamic ONLYOFFICE & Callback Architecture

To prevent hardcoding of container names which crash native execution layouts:
1. **`ONLYOFFICE_API_URL`**: Set inside your `.env` file (e.g. `http://onlyoffice-server` or `http://localhost:8081`).
2. **Callbacks & Forcesave Routing**: The Legal Drafter backend (`Drafter.py`) resolves `ONLYOFFICE_API_URL` dynamically at runtime to locate OnlyOffice's CommandService and normalize download URLs received in callback webhooks.
3. **Loopback Gateways**: Linux host gateway resolutions are mapped under `extra_hosts` as `host.docker.internal:host-gateway` in compose configuration templates.

---

## 4. Frontend Plugin Security & Life Cycles

1. **Origin Verification Shielding**:
   * The sidebar helper plugin (`public/plugins/assistant/code.js`) restricts outbound message passing to the dynamic `window.location.origin` frame.
   * `OnlyOfficeWorkspace.jsx` validates that incoming message events originate strictly from `window.location.origin` prior to ingestion.
2. **ONLYOFFICE Canvas Memory Leak Mitigation**:
   * The DocEditor instances are safely disposed of by calling `editorInstanceRef.current.destroy()` inside the component unmount hooks and before mounting new workspace document paths.
3. **Variable Synchronization API**:
   * `/v2/draft/variable/sync` operates directly on target OpenXML structured document elements in `/shared_drafts`.
   * It scans `<w:sdt>` tags, updates the first `<w:t>` string, and clears any trailing text splits safely.
