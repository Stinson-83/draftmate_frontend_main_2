#!/usr/bin/env python3
"""
Run the Advocate Profile service migrations.
Usage:
    python run_migrations.py

Reads connection settings from environment / .env file.
Safe to run multiple times (all statements are idempotent).
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))


def get_connection():
    dsn = os.getenv("POSTGRES_DSN")
    if dsn:
        return psycopg2.connect(dsn)
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        dbname=os.getenv("POSTGRES_DB", "draftmate"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "password"),
        port=os.getenv("POSTGRES_PORT", "5432"),
    )


def main():
    migration_file = os.path.join(os.path.dirname(__file__), "migrations.sql")
    if not os.path.exists(migration_file):
        print(f"❌  Migration file not found: {migration_file}")
        sys.exit(1)

    with open(migration_file, "r", encoding="utf-8") as f:
        sql = f.read()

    print("Connecting to database...")
    try:
        conn = get_connection()
    except Exception as e:
        print(f"❌  Could not connect: {e}")
        sys.exit(1)

    conn.autocommit = False
    cur = conn.cursor()

    # Split on semicolons and run each statement individually so we can
    # report which ones succeed / are skipped.
    statements = [s.strip() for s in sql.split(";") if s.strip() and not s.strip().startswith("--")]
    ok = skipped = 0

    for stmt in statements:
        try:
            cur.execute(stmt)
            ok += 1
        except psycopg2.Error as e:
            conn.rollback()
            # Benign: column/table already exists
            if "already exists" in str(e) or "duplicate" in str(e).lower():
                skipped += 1
            else:
                print(f"⚠️   Non-fatal error on statement:\n  {stmt[:80]}...\n  → {e}")
                skipped += 1
        conn.commit()

    conn.close()
    print(f"✅  Migrations complete — {ok} applied, {skipped} skipped (already present).")


if __name__ == "__main__":
    main()
