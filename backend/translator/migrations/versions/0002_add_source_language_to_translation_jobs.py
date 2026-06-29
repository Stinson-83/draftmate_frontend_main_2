"""add source_language to translation_jobs

Revision ID: 0002_add_source_language_to_translation_jobs
Revises: 0001_create_translation_jobs
Create Date: 2026-05-30 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0002_add_source_language_to_translation_jobs"
down_revision = "0001_create_translation_jobs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "translation_jobs",
        sa.Column("source_language", sa.String(length=50), nullable=False, server_default="auto"),
    )


def downgrade() -> None:
    op.drop_column("translation_jobs", "source_language")