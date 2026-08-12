"""create translation_jobs table

Revision ID: 0001_create_translation_jobs
Revises: 
Create Date: 2026-05-27 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "0001_create_translation_jobs"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "translation_jobs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("stage", sa.String(length=50), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("source_file", sa.Text(), nullable=False),
        sa.Column("translated_file", sa.Text(), nullable=True),
        sa.Column("target_language", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_translation_jobs_user_id", "translation_jobs", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_translation_jobs_user_id", table_name="translation_jobs")
    op.drop_table("translation_jobs")
