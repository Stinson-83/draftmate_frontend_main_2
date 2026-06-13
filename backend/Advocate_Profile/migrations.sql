-- =============================================================================
-- DraftMate Advocate Ecosystem — Full Migration Script
-- Run once against your PostgreSQL database before starting the service.
-- All statements are idempotent (safe to re-run).
-- =============================================================================

-- Ensure pgvector extension exists (required by main app)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id     VARCHAR(255),
    full_name     VARCHAR(255),
    user_type     VARCHAR(50) DEFAULT 'ADVOCATE',
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add full_name column if upgrading from older schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'ADVOCATE';

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- ── practice_areas ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS practice_areas (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Seed default practice areas
INSERT INTO practice_areas (name) VALUES
    ('Criminal Law'), ('Corporate Law'), ('Family Law'), ('Cyber Law'),
    ('Tax Law'), ('Property Law'), ('Immigration Law'), ('Consumer Rights Law'),
    ('Civil Law'), ('Startup & Business Law'), ('Constitutional Law'),
    ('Intellectual Property'), ('Labour Law'), ('Environmental Law'),
    ('Arbitration & Mediation'), ('Real Estate'), ('Banking & Finance'),
    ('Matrimonial Law')
ON CONFLICT DO NOTHING;

-- ── advocate_profiles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advocate_profiles (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug                     VARCHAR(255) UNIQUE NOT NULL,
    title                    VARCHAR(255),
    bar_council_number       VARCHAR(100),
    years_experience         INTEGER,
    bio                      TEXT,
    consultation_fee         NUMERIC(10,2),
    profile_image_url        TEXT,
    banner_image_url         TEXT,
    location                 VARCHAR(255),
    court_affiliation        VARCHAR(255),
    languages                JSONB DEFAULT '[]',
    id_slug                  VARCHAR(100),
    profile_completion_score INTEGER DEFAULT 0,
    is_verified              BOOLEAN DEFAULT FALSE,
    is_public                BOOLEAN DEFAULT FALSE,
    rating                   NUMERIC(3,2),
    total_consultations      INTEGER DEFAULT 0,
    view_count               INTEGER DEFAULT 0,
    created_at               TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    office_address           TEXT
);

-- Safe upgrades for existing tables
ALTER TABLE advocate_profiles ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]';
ALTER TABLE advocate_profiles ADD COLUMN IF NOT EXISTS id_slug VARCHAR(100);
ALTER TABLE advocate_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE advocate_profiles ADD COLUMN IF NOT EXISTS total_consultations INTEGER DEFAULT 0;
ALTER TABLE advocate_profiles ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE advocate_profiles ADD COLUMN IF NOT EXISTS office_address TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_user_id ON advocate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_slug ON advocate_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_is_public ON advocate_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_is_verified ON advocate_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_advocate_profiles_location ON advocate_profiles(location);

-- ── advocate_practice_areas (junction) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS advocate_practice_areas (
    advocate_id      UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    practice_area_id UUID REFERENCES practice_areas(id) ON DELETE CASCADE,
    PRIMARY KEY (advocate_id, practice_area_id)
);

CREATE INDEX IF NOT EXISTS idx_advocate_practice_areas_practice_area_id ON advocate_practice_areas(practice_area_id);

-- ── advocate_experience ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advocate_experience (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id  UUID NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    company      VARCHAR(255) NOT NULL,
    role         VARCHAR(255) NOT NULL,
    start_date   DATE,
    end_date     DATE,
    is_current   BOOLEAN DEFAULT FALSE,
    description  TEXT,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_advocate_experience_advocate_id ON advocate_experience(advocate_id);

-- ── advocate_education ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advocate_education (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id   UUID NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    institution   VARCHAR(255) NOT NULL,
    degree        VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_year    INTEGER,
    end_year      INTEGER,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_advocate_education_advocate_id ON advocate_education(advocate_id);

-- ── achievements ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id   UUID NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    type          VARCHAR(100),
    date_achieved DATE,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_achievements_advocate_id ON achievements(advocate_id);

-- ── refresh_tokens ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(512) UNIQUE NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ── consultation_requests ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultation_requests (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id    UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    client_name    VARCHAR(255) NOT NULL,
    client_email   VARCHAR(255) NOT NULL,
    client_phone   VARCHAR(50),
    case_summary   TEXT NOT NULL,
    preferred_type VARCHAR(50) DEFAULT 'Video Call',
    preferred_date TIMESTAMPTZ,
    status         VARCHAR(50) DEFAULT 'PENDING',
    created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS preferred_type VARCHAR(50) DEFAULT 'Video Call';
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS preferred_date TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_consultation_requests_advocate_id ON consultation_requests(advocate_id);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON consultation_requests(status);

-- ── messages (two-way chat) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id      UUID NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    client_name      VARCHAR(255) NOT NULL,
    client_email     VARCHAR(255) NOT NULL,
    sender_type      VARCHAR(50) NOT NULL CHECK (sender_type IN ('client', 'advocate')),
    message          TEXT NOT NULL,
    is_read          BOOLEAN DEFAULT FALSE,
    is_archived      BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_advocate_id ON messages(advocate_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_email ON messages(client_email);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_is_archived ON messages(is_archived);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- ── contact_requests (legacy fallback) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    status      VARCHAR(50) DEFAULT 'UNREAD',
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contact_requests_advocate_id ON contact_requests(advocate_id);
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);

-- ── verification_requests ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id   UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    documents_url TEXT NOT NULL,
    status        VARCHAR(50) DEFAULT 'PENDING',
    submitted_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reviewed_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_verification_requests_advocate_id ON verification_requests(advocate_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- ── bookmarks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    advocate_id  UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, advocate_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_advocate_id ON bookmarks(advocate_id);

-- ── profile_views ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_views (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    referrer    TEXT,
    source      VARCHAR(100) DEFAULT 'web',
    viewed_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_profile_views_advocate_id ON profile_views(advocate_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at);

-- ── profile_shares ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profile_shares (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    platform    VARCHAR(100),
    shared_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_profile_shares_advocate_id ON profile_shares(advocate_id);

-- ── analytics_events ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    event_type  VARCHAR(100) NOT NULL,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_advocate_id ON analytics_events(advocate_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);

-- =============================================================================
-- End of migration
-- =============================================================================
