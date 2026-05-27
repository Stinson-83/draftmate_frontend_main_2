"""Minimal FastAPI app for translation job creation."""

from uuid import uuid4

from fastapi import FastAPI, File, Form, UploadFile

app = FastAPI(title="Translator Service", version="0.1.0")


@app.get("/")
def healthcheck() -> dict[str, str]:
    return {"message": "Translator service running"}


@app.post("/translation-jobs")
async def create_translation_job(
    file: UploadFile = File(...),
    target_language: str = Form(...),
) -> dict[str, str]:
    _ = file
    return {
        "job_id": str(uuid4()),
        "status": "queued",
        "target_language": target_language,
    }
