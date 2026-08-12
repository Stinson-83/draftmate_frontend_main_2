#!/usr/bin/env python3
"""
seed_extra.py — Extended advocate seed data (20 advocates).

Fixes vs original version:
- Every advocate gets a unique UUID user_id (no shared id)
- password_hash stored for all users (login: password123)
- Uses @draftmate-seed.com email pattern (consistent namespace)
- Does NOT add a practice_areas JSONB column — uses advocate_practice_areas
  junction table which is the correct normalised schema
- All inserts are idempotent (ON CONFLICT slug DO UPDATE)
- Cascade-safe: deletes via users table which cascades to advocate_profiles
"""

import os
import sys
import uuid
import json
import random
import bcrypt
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

# Pre-hash the demo password once
_HASHED_PWD = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode("utf-8")

ADVOCATES = [
    {"first": "Rajesh",  "last": "Kumar",    "slug": "rajesh-kumar-seed",    "id_slug": "ADV-2026-00001",
     "bar": "D/1234/2005",  "location": "New Delhi, Delhi",       "practice_areas": ["Criminal Law", "Civil Litigation"],
     "experience": 15, "fee": 3000, "rating": 4.9, "verified": True,  "days_ago": 120,
     "img": "https://i.pravatar.cc/300?img=11"},

    {"first": "Priya",   "last": "Sharma",   "slug": "priya-sharma-seed",    "id_slug": "ADV-2026-00002",
     "bar": "MH/5678/2010", "location": "Mumbai, Maharashtra",    "practice_areas": ["Corporate Law", "Contracts"],
     "experience": 12, "fee": 4000, "rating": 4.8, "verified": True,  "days_ago": 60,
     "img": "https://i.pravatar.cc/300?img=5"},

    {"first": "Arjun",   "last": "Patel",    "slug": "arjun-patel-seed",     "id_slug": "ADV-2026-00003",
     "bar": "GJ/9012/2016", "location": "Ahmedabad, Gujarat",     "practice_areas": ["Cyber Law", "Data Privacy"],
     "experience": 8,  "fee": 2500, "rating": 4.7, "verified": True,  "days_ago": 10,
     "img": "https://i.pravatar.cc/300?img=12"},

    {"first": "Neha",    "last": "Verma",    "slug": "neha-verma-seed",      "id_slug": "ADV-2026-00004",
     "bar": "KA/3456/2014", "location": "Bangalore, Karnataka",   "practice_areas": ["Family Law", "Matrimonial Law"],
     "experience": 10, "fee": 2000, "rating": 4.6, "verified": True,  "days_ago": 200,
     "img": "https://i.pravatar.cc/300?img=9"},

    {"first": "Vikram",  "last": "Singh",    "slug": "vikram-singh-seed",    "id_slug": "ADV-2026-00005",
     "bar": "D/9390/2008",  "location": "New Delhi, Delhi",       "practice_areas": ["Constitutional Law", "Civil Law"],
     "experience": 22, "fee": 6000, "rating": 5.0, "verified": True,  "days_ago": 300,
     "img": "https://i.pravatar.cc/300?img=33"},

    {"first": "Meera",   "last": "Joshi",    "slug": "meera-joshi-seed",     "id_slug": "ADV-2026-00006",
     "bar": "MH/7823/2015", "location": "Pune, Maharashtra",      "practice_areas": ["Property Law", "Real Estate"],
     "experience": 9,  "fee": 2200, "rating": 4.3, "verified": False, "days_ago": 2,
     "img": "https://i.pravatar.cc/300?img=20"},

    {"first": "Karan",   "last": "Malhotra", "slug": "karan-malhotra-seed",  "id_slug": "ADV-2026-00007",
     "bar": "HR/2341/2013", "location": "Gurgaon, Haryana",       "practice_areas": ["Tax Law", "Banking & Finance"],
     "experience": 11, "fee": 3500, "rating": 4.7, "verified": True,  "days_ago": 45,
     "img": "https://i.pravatar.cc/300?img=59"},

    {"first": "Ayesha",  "last": "Khan",     "slug": "ayesha-khan-seed",     "id_slug": "ADV-2026-00008",
     "bar": "TS/6789/2017", "location": "Hyderabad, Telangana",   "practice_areas": ["Immigration Law"],
     "experience": 7,  "fee": 2800, "rating": 4.4, "verified": False, "days_ago": 180,
     "img": "https://i.pravatar.cc/300?img=42"},

    {"first": "Rohit",   "last": "Desai",    "slug": "rohit-desai-seed",     "id_slug": "ADV-2026-00009",
     "bar": "GJ/4521/2018", "location": "Surat, Gujarat",         "practice_areas": ["Startup & Business Law", "Intellectual Property"],
     "experience": 6,  "fee": 2000, "rating": 4.5, "verified": True,  "days_ago": 5,
     "img": "https://i.pravatar.cc/300?img=60"},

    {"first": "Anjali",  "last": "Mehta",    "slug": "anjali-mehta-seed",    "id_slug": "ADV-2026-00010",
     "bar": "RJ/8834/2011", "location": "Jaipur, Rajasthan",      "practice_areas": ["Consumer Rights Law"],
     "experience": 13, "fee": 1800, "rating": 4.8, "verified": True,  "days_ago": 90,
     "img": "https://i.pravatar.cc/300?img=47"},

    {"first": "Suresh",  "last": "Nair",     "slug": "suresh-nair-seed",     "id_slug": "ADV-2026-00011",
     "bar": "TN/1122/2006", "location": "Chennai, Tamil Nadu",    "practice_areas": ["Civil Law", "Arbitration & Mediation"],
     "experience": 18, "fee": 3200, "rating": 4.9, "verified": True,  "days_ago": 400,
     "img": "https://i.pravatar.cc/300?img=15"},

    {"first": "Pooja",   "last": "Reddy",    "slug": "pooja-reddy-seed",     "id_slug": "ADV-2026-00012",
     "bar": "TS/3344/2020", "location": "Hyderabad, Telangana",   "practice_areas": ["Family Law"],
     "experience": 5,  "fee": 1500, "rating": 4.2, "verified": False, "days_ago": 7,
     "img": "https://i.pravatar.cc/300?img=25"},

    {"first": "Manish",  "last": "Gupta",    "slug": "manish-gupta-seed",    "id_slug": "ADV-2026-00013",
     "bar": "D/5566/2009",  "location": "New Delhi, Delhi",       "practice_areas": ["Tax Law"],
     "experience": 14, "fee": 4500, "rating": 4.8, "verified": True,  "days_ago": 150,
     "img": "https://i.pravatar.cc/300?img=53"},

    {"first": "Kavita",  "last": "Rao",      "slug": "kavita-rao-seed",      "id_slug": "ADV-2026-00014",
     "bar": "KA/7788/2015", "location": "Bangalore, Karnataka",   "practice_areas": ["Corporate Law"],
     "experience": 9,  "fee": 3000, "rating": 4.6, "verified": True,  "days_ago": 30,
     "img": "https://i.pravatar.cc/300?img=45"},

    {"first": "Rahul",   "last": "Khanna",   "slug": "rahul-khanna-seed",    "id_slug": "ADV-2026-00015",
     "bar": "MH/9900/2008", "location": "Mumbai, Maharashtra",    "practice_areas": ["Criminal Law"],
     "experience": 16, "fee": 5000, "rating": 4.9, "verified": True,  "days_ago": 250,
     "img": "https://i.pravatar.cc/300?img=56"},

    {"first": "Sneha",   "last": "Iyer",     "slug": "sneha-iyer-seed",      "id_slug": "ADV-2026-00016",
     "bar": "TN/1234/2016", "location": "Chennai, Tamil Nadu",    "practice_areas": ["Immigration Law", "Labour Law"],
     "experience": 8,  "fee": 2500, "rating": 4.5, "verified": True,  "days_ago": 20,
     "img": "https://i.pravatar.cc/300?img=38"},

    {"first": "Deepak",  "last": "Shah",     "slug": "deepak-shah-seed",     "id_slug": "ADV-2026-00017",
     "bar": "GJ/5678/2004", "location": "Ahmedabad, Gujarat",     "practice_areas": ["Property Law", "Real Estate"],
     "experience": 20, "fee": 3800, "rating": 4.9, "verified": True,  "days_ago": 500,
     "img": "https://i.pravatar.cc/300?img=66"},

    {"first": "Farhan",  "last": "Ali",      "slug": "farhan-ali-seed",      "id_slug": "ADV-2026-00018",
     "bar": "UP/9012/2013", "location": "Lucknow, Uttar Pradesh", "practice_areas": ["Criminal Law", "Civil Law"],
     "experience": 11, "fee": 2000, "rating": 4.3, "verified": False, "days_ago": 80,
     "img": "https://i.pravatar.cc/300?img=68"},

    {"first": "Nitin",   "last": "Sharma",   "slug": "nitin-sharma-seed",    "id_slug": "ADV-2026-00019",
     "bar": "CH/3456/2017", "location": "Chandigarh, Punjab",     "practice_areas": ["Startup & Business Law"],
     "experience": 7,  "fee": 2200, "rating": 4.6, "verified": True,  "days_ago": 15,
     "img": "https://i.pravatar.cc/300?img=71"},

    {"first": "Riya",    "last": "Patel",    "slug": "riya-patel-seed",      "id_slug": "ADV-2026-00020",
     "bar": "GJ/7890/2021", "location": "Surat, Gujarat",         "practice_areas": ["Cyber Law"],
     "experience": 4,  "fee": 1800, "rating": 4.2, "verified": False, "days_ago": 3,
     "img": "https://i.pravatar.cc/300?img=49"},
]

_COURT_MAP = {
    range(15, 99): "Supreme Court of India",
    range(8, 15):  "High Court",
    range(0, 8):   "District Court",
}

def _court(exp):
    if exp >= 15: return "Supreme Court of India"
    if exp >= 8:  return "High Court"
    return "District Court"

def _bio(a):
    return (
        f"Experienced {', '.join(a['practice_areas'][:2])} advocate based in {a['location']}. "
        f"With {a['experience']} years of dedicated practice, {a['first']} {a['last']} brings "
        f"a results-driven approach to every case, ensuring the highest standards of legal "
        f"representation and client satisfaction."
    )

def get_connection():
    dsn = os.getenv("POSTGRES_DSN")
    if dsn:
        return psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        dbname=os.getenv("POSTGRES_DB", "draftmate"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "password"),
        port=os.getenv("POSTGRES_PORT", "5432"),
        cursor_factory=RealDictCursor,
    )


def run():
    print("Connecting to database...")
    try:
        conn = get_connection()
    except Exception as e:
        print(f"Connection failed: {e}")
        sys.exit(1)

    cur = conn.cursor()

    # Clean previous seed data from this script (idempotent)
    cur.execute("DELETE FROM users WHERE email LIKE '%@draftmate-seed.com'")
    conn.commit()
    print("Cleared old seed-extra records.")

    ok = 0
    for adv in ADVOCATES:
        user_id    = str(uuid.uuid4())
        email      = f"{adv['first'].lower()}.{adv['last'].lower()}@draftmate-seed.com"
        full_name  = f"{adv['first']} {adv['last']}"
        created_at = datetime.utcnow() - timedelta(days=adv["days_ago"])

        # ── 1. Insert user — unique id, with password_hash ────────────────────
        cur.execute(
            """
            INSERT INTO users (id, email, password_hash, full_name, user_type)
            VALUES (%s, %s, %s, %s, 'ADVOCATE')
            ON CONFLICT (email) DO UPDATE
                SET full_name     = EXCLUDED.full_name,
                    password_hash = EXCLUDED.password_hash
            RETURNING id
            """,
            (user_id, email, _HASHED_PWD, full_name),
        )
        returned = cur.fetchone()
        # On conflict the RETURNING still gives the existing id
        actual_user_id = str(returned["id"]) if returned else user_id

        # ── 2. Insert advocate_profile ────────────────────────────────────────
        cur.execute(
            """
            INSERT INTO advocate_profiles (
                user_id, slug, title, id_slug, bar_council_number,
                years_experience, bio, consultation_fee, profile_image_url,
                location, court_affiliation, profile_completion_score,
                is_verified, is_public, rating, total_consultations,
                view_count, languages, created_at, updated_at
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s,
                %s, TRUE, %s, %s,
                %s, %s::jsonb, %s, %s
            )
            ON CONFLICT (slug) DO UPDATE SET
                title                  = EXCLUDED.title,
                id_slug                = EXCLUDED.id_slug,
                bar_council_number     = EXCLUDED.bar_council_number,
                years_experience       = EXCLUDED.years_experience,
                bio                    = EXCLUDED.bio,
                consultation_fee       = EXCLUDED.consultation_fee,
                profile_image_url      = EXCLUDED.profile_image_url,
                location               = EXCLUDED.location,
                court_affiliation      = EXCLUDED.court_affiliation,
                is_verified            = EXCLUDED.is_verified,
                rating                 = EXCLUDED.rating,
                total_consultations    = EXCLUDED.total_consultations,
                view_count             = EXCLUDED.view_count,
                languages              = EXCLUDED.languages,
                user_id                = EXCLUDED.user_id
            RETURNING id
            """,
            (
                actual_user_id, adv["slug"], full_name, adv["id_slug"], adv["bar"],
                adv["experience"], _bio(adv), adv["fee"], adv["img"],
                adv["location"], _court(adv["experience"]),
                100 if adv["verified"] else 80,
                adv["verified"], adv["rating"],
                adv["experience"] * 8 + 10,           # total_consultations
                adv["experience"] * 50 + 100,         # view_count
                json.dumps(["English", "Hindi"]),      # languages
                created_at, created_at,
            ),
        )
        advocate_id = str(cur.fetchone()["id"])

        # ── 3. Practice areas via junction table ──────────────────────────────
        cur.execute(
            "DELETE FROM advocate_practice_areas WHERE advocate_id = %s",
            (advocate_id,),
        )
        for pa_name in adv["practice_areas"]:
            pa_name = pa_name.strip()
            cur.execute("SELECT id FROM practice_areas WHERE name = %s", (pa_name,))
            pa_row = cur.fetchone()
            if pa_row:
                pa_id = pa_row["id"]
            else:
                cur.execute(
                    "INSERT INTO practice_areas (name) VALUES (%s) RETURNING id", (pa_name,)
                )
                pa_id = cur.fetchone()["id"]
            cur.execute(
                "INSERT INTO advocate_practice_areas (advocate_id, practice_area_id)"
                " VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (advocate_id, pa_id),
            )

        # ── 4. Education ──────────────────────────────────────────────────────
        cur.execute(
            "DELETE FROM advocate_education WHERE advocate_id = %s", (advocate_id,)
        )
        grad_year = datetime.utcnow().year - adv["experience"]
        cur.execute(
            """
            INSERT INTO advocate_education
                (advocate_id, institution, degree, start_year, end_year)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                advocate_id,
                "National Law University",
                "LL.M." if adv["experience"] >= 10 else "LL.B.",
                grad_year - 3,
                grad_year,
            ),
        )

        # ── 5. Profile views for trending ─────────────────────────────────────
        view_count = adv["experience"] * 50 + 100
        for _ in range(view_count // 20):  # scaled down for speed
            cur.execute(
                "INSERT INTO profile_views (advocate_id, source) VALUES (%s, 'seed')",
                (advocate_id,),
            )

        ok += 1
        print(f"  [OK] {full_name} ({adv['id_slug']}) | user_id={actual_user_id[:8]}...")

    conn.commit()
    conn.close()
    print(f"\nSeed-extra complete: {ok}/{len(ADVOCATES)} advocates inserted.")
    print("Demo login: email = <first>.<last>@draftmate-seed.com | password = password123")


if __name__ == "__main__":
    run()
