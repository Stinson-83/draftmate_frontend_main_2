"""
DraftMate Legal Workflow — Configuration.

Pydantic-settings config, inspired by Donna's config.py.
Single source of truth for all env vars consumed by the workflow engine.
"""
from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    # ── LLM ───────────────────────────────────────────────────────────────────
    google_api_key: str = ""
    gemini_api_key: str = ""
    openai_api_key: str = ""

    # ── WhatsApp Cloud API ────────────────────────────────────────────────────
    whatsapp_token: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_verify_token: str = "draftmate-verify-token"

    # ── AWS / S3 ──────────────────────────────────────────────────────────────
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = "drafterai"
    s3_region: str = "ap-south-1"

    # ── Database ──────────────────────────────────────────────────────────────
    database_url: str = ""

    # ── Auth ──────────────────────────────────────────────────────────────────
    auth_service_url: str = "http://127.0.0.1:8009"

    # ── App ───────────────────────────────────────────────────────────────────
    environment: str = "development"
    frontend_url_dev: str = "http://localhost:8080"
    frontend_url_prod: str = "https://www.draftmate.in"

    @property
    def frontend_url(self) -> str:
        if self.environment.strip().lower() == "production":
            return self.frontend_url_prod.strip()
        return self.frontend_url_dev.strip()

    @property
    def llm_api_key(self) -> str:
        return self.google_api_key or self.gemini_api_key


settings = Settings()
