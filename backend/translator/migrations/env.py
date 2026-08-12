"""Alembic migration environment for translator service."""

from logging.config import fileConfig
from pathlib import Path
import os
import sys

from alembic import context
from sqlalchemy import engine_from_config, pool

current_dir = Path(__file__).resolve().parent
service_root = current_dir.parent
repo_root = service_root.parent.parent
for path in (str(repo_root), str(service_root)):
    if path not in sys.path:
        sys.path.append(path)

from backend.translator.database import DATABASE_URL
from backend.translator.models import Base
from backend.translator.models import translation_job  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

if DATABASE_URL:
    config.set_main_option("sqlalchemy.url", DATABASE_URL)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
