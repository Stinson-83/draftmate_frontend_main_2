# Lex Bot v2 - Indian Law Research Assistant

A production-ready RAG (Retrieval-Augmented Generation) bot for Indian Law, built with FastAPI, LangGraph, and Google Gemini.

## 🚀 How to Run

### Using Docker (Recommended)
This is the easiest way to run the application with all dependencies and the database pre-configured.

1.  **Start the Application:**
    ```bash
    docker compose up --build
    ```
    The API will be available at `http://localhost:8004`.

2.  **Stop the Application:**
    Press `Ctrl+C` in the terminal, or run:
    ```bash
    docker compose down
    ```

### Local Development (Manual)
If you prefer running without Docker:
1.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
2.  **Setup Database:**
    Ensure you have PostgreSQL running with the `pgvector` extension enabled.
    ```sql
    CREATE EXTENSION IF NOT EXISTS vector;
    ```
    Set your `DATABASE_URL` in `.env`.
3.  **Run the App:**
    ```bash
    python -m lex_bot.app
    ```

---

## 📚 API Reference (Frontend Integration)

The backend runs at `http://localhost:8004`. Full Swagger docs are available at `/docs`.

### 1. Upload a Document (PDF)
Upload a PDF file to be used as context for the conversation.

- **Endpoint:** `POST /upload`
- **Content-Type:** `multipart/form-data`

**Request:**
```javascript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("session_id", "session_123"); // Optional: Generate a UUID if new

await fetch("http://localhost:8004/upload", {
  method: "POST",
  body: formData
});
```

**Response:**
```json
{
  "file_path": "/app/data/uploads/...",
  "filename": "contract.pdf",
  "session_id": "session_123",
  "message": "File uploaded and linked to session."
}
```

### 2. Chat with the Bot
Send a query to the bot. It will automatically use any uploaded documents associated with the `session_id`.

- **Endpoint:** `POST /chat`
- **Content-Type:** `application/json`

**Request:**
```json
{
  "query": "What are the termination clauses in this contract?",
  "session_id": "session_123",  // Must match the upload session_id
  "user_id": "user_1"           // Optional: For persistent memory
}
```

**Response:**
```json
{
  "answer": "The termination clause states that...",
  "session_id": "session_123",
  "complexity": "complex",
  "agents_used": ["document_agent", "manager_agent"],
  "processing_time_ms": 4500
}
```

### 3. Get Session History
Retrieve past messages for a chat interface.

- **Endpoint:** `GET /sessions/{session_id}?user_id={user_id}`

**Response:**
```json
{
  "session_id": "session_123",
  "title": "Contract Review",
  "messages": [
    {
      "role": "user",
      "content": "Analyze this PDF",
      "timestamp": "2024-03-20T10:00:00"
    },
    {
      "role": "assistant",
      "content": "I have analyzed the document...",
      "timestamp": "2024-03-20T10:00:05"
    }
  ]
}
```

### 4. List User Sessions
Get a list of all chat sessions for a sidebar.

- **Endpoint:** `GET /users/{user_id}/sessions`

**Response:**
```json
{
  "sessions": [
    {
      "session_id": "session_123",
      "title": "Contract Review",
      "created_at": "2024-03-20T10:00:00"
    },
    {
      "session_id": "session_456",
      "title": "IPC Section 302 Query",
      "created_at": "2024-03-19T15:30:00"
    }
  ]
}
```

## ⚠️ Troubleshooting

- **429 Resource Exhausted:** The free tier of Gemini API has rate limits. If you see this error, wait a minute or upgrade your API key.
- **Database Error:** Ensure Docker is running and the `db` service is healthy.

