-- ============================================================
-- Draftmate Local DB Bootstrap
-- Runs once on first postgres_data init (docker-entrypoint-initdb.d)
-- POSTGRES_USER=lawuser, POSTGRES_DB=postgres  (from .env)
-- The container creates "postgres" db owned by lawuser.
-- We also create a "lawuser" db so services that connect
-- without an explicit dbname (defaulting to username) work.
-- ============================================================

-- 1. Create "lawuser" database so the noisy FATAL disappears
SELECT 'CREATE DATABASE lawuser OWNER lawuser'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lawuser')\gexec

-- ============================================================
-- 2. Schema in "postgres" db (all services connect to this)
-- ============================================================
\c postgres

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Auth / Users ────────────────────────────────────────────
-- users: must have BOTH password and password_hash columns
-- (auth.py inserts into both on register/google-login)
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255),          -- used by auth.py (register/login)
    full_name   VARCHAR(255),          -- used by seed_ecosystem.py
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255),          -- legacy plain-hash column
    password_hash VARCHAR(255),        -- modern bcrypt hash
    google_id   VARCHAR(255),
    user_type   VARCHAR(50) DEFAULT 'USER',  -- used by seed_ecosystem.py
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- sessions
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY,
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
    profile_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    first_name        VARCHAR(100),
    last_name         VARCHAR(100),
    role              VARCHAR(100),
    workplace         VARCHAR(100),
    bio               TEXT,
    profile_image_url TEXT,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id         VARCHAR(50) PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    price      DECIMAL(10,2) NOT NULL,
    currency   VARCHAR(10) DEFAULT 'INR',
    interval   VARCHAR(20) DEFAULT 'monthly',
    features   JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- user_subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    plan_id         VARCHAR(50) REFERENCES subscription_plans(id),
    status          VARCHAR(20) DEFAULT 'inactive',
    start_date      TIMESTAMP,
    end_date        TIMESTAMP,
    auto_renew      BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID REFERENCES users(id),
    order_id       VARCHAR(255) UNIQUE NOT NULL,
    reference_id   VARCHAR(255),
    amount         DECIMAL(10,2) NOT NULL,
    currency       VARCHAR(10) DEFAULT 'INR',
    status         VARCHAR(50) DEFAULT 'PENDING',
    payment_method VARCHAR(100),
    payment_time   TIMESTAMP,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default subscription plans
INSERT INTO subscription_plans (id, name, price, interval, features)
VALUES ('PRO_MONTHLY', 'PRO', 599.00, 'monthly',
        '["AI-Powered Drafting","Case Law Database","Standard Support","5GB Storage"]')
ON CONFLICT (id) DO NOTHING;

-- ── Advocate Ecosystem ──────────────────────────────────────
-- advocate_profiles
CREATE TABLE IF NOT EXISTS advocate_profiles (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID UNIQUE NOT NULL,
    slug                     VARCHAR(255) UNIQUE NOT NULL,
    title                    VARCHAR(255) NOT NULL,
    bar_council_number       VARCHAR(100) UNIQUE,
    years_experience         INT DEFAULT 0,
    location                 VARCHAR(255),
    court_affiliation        VARCHAR(255),
    bio                      TEXT,
    consultation_fee         DECIMAL(10,2) DEFAULT 0.00,
    profile_image_url        TEXT,
    banner_image_url         TEXT,
    is_verified              BOOLEAN DEFAULT FALSE,
    is_public                BOOLEAN DEFAULT TRUE,
    profile_completion_score INT DEFAULT 0,
    rating                   DECIMAL(3,2) DEFAULT 0.00,
    total_consultations      INT DEFAULT 0,
    view_count               INT DEFAULT 0,
    languages                JSONB DEFAULT '[]',
    id_slug                  VARCHAR(100),
    office_address           TEXT,
    updated_at               TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advocates_slug       ON advocate_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_advocates_verified   ON advocate_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_advocates_public     ON advocate_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_advocates_location   ON advocate_profiles(location);
CREATE INDEX IF NOT EXISTS idx_advocates_score      ON advocate_profiles(profile_completion_score DESC);
CREATE INDEX IF NOT EXISTS idx_advocates_user_id    ON advocate_profiles(user_id);

-- advocate_experience
CREATE TABLE IF NOT EXISTS advocate_experience (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id  UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    company      VARCHAR(255) NOT NULL,
    role         VARCHAR(255) NOT NULL,
    start_date   DATE,
    end_date     DATE,
    is_current   BOOLEAN DEFAULT FALSE,
    description  TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_experience_advocate ON advocate_experience(advocate_id);

-- advocate_education
CREATE TABLE IF NOT EXISTS advocate_education (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id    UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    institution    VARCHAR(255) NOT NULL,
    degree         VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_year     INT,
    end_year       INT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_education_advocate ON advocate_education(advocate_id);

-- achievements (also used for certifications)
CREATE TABLE IF NOT EXISTS achievements (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id   UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    date_achieved DATE,
    type          VARCHAR(100) DEFAULT 'CASE',
    link_url      TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_achievements_advocate ON achievements(advocate_id);

-- practice_areas
CREATE TABLE IF NOT EXISTS practice_areas (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon_name   VARCHAR(100)
);

-- advocate_practice_areas
CREATE TABLE IF NOT EXISTS advocate_practice_areas (
    advocate_id      UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    practice_area_id UUID REFERENCES practice_areas(id) ON DELETE CASCADE,
    PRIMARY KEY (advocate_id, practice_area_id)
);
CREATE INDEX IF NOT EXISTS idx_apa_practice_area ON advocate_practice_areas(practice_area_id);

-- bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, advocate_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user     ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_advocate ON bookmarks(advocate_id);

-- verification_requests
CREATE TABLE IF NOT EXISTS verification_requests (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id   UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    documents_url TEXT NOT NULL,
    status        VARCHAR(50) DEFAULT 'PENDING',
    submitted_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reviewed_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_verification_status    ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_advocate  ON verification_requests(advocate_id);

-- consultation_requests
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
CREATE INDEX IF NOT EXISTS idx_consultation_advocate ON consultation_requests(advocate_id);
CREATE INDEX IF NOT EXISTS idx_consultation_status   ON consultation_requests(status);

-- contact_requests
CREATE TABLE IF NOT EXISTS contact_requests (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id  UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    client_name  VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    message      TEXT NOT NULL,
    status       VARCHAR(50) DEFAULT 'UNREAD',
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contact_advocate ON contact_requests(advocate_id);
CREATE INDEX IF NOT EXISTS idx_contact_status   ON contact_requests(status);

-- messages (two-way chat)
CREATE TABLE IF NOT EXISTS messages (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id  UUID NOT NULL REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    client_name  VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    sender_type  VARCHAR(50) NOT NULL CHECK (sender_type IN ('client','advocate')),
    message      TEXT NOT NULL,
    is_read      BOOLEAN DEFAULT FALSE,
    is_archived  BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_advocate  ON messages(advocate_id);
CREATE INDEX IF NOT EXISTS idx_messages_email     ON messages(client_email);
CREATE INDEX IF NOT EXISTS idx_messages_read      ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_archived  ON messages(is_archived);
CREATE INDEX IF NOT EXISTS idx_messages_created   ON messages(created_at);

-- moderation_reports
CREATE TABLE IF NOT EXISTS moderation_reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID,
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    reason      VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(50) DEFAULT 'PENDING',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- profile_views
CREATE TABLE IF NOT EXISTS profile_views (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    viewer_ip   VARCHAR(255),
    referrer    TEXT,
    user_agent  TEXT,
    source      VARCHAR(100) DEFAULT 'web',
    viewed_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_views_advocate_time ON profile_views(advocate_id, viewed_at);

-- profile_shares
CREATE TABLE IF NOT EXISTS profile_shares (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    platform    VARCHAR(100),
    shared_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shares_advocate_time ON profile_shares(advocate_id, shared_at);

-- search_analytics
CREATE TABLE IF NOT EXISTS search_analytics (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query        VARCHAR(255),
    practice_area_filter UUID REFERENCES practice_areas(id) ON DELETE SET NULL,
    results_count       INT DEFAULT 0,
    searched_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_search_analytics_time ON search_analytics(searched_at);

-- analytics_events
CREATE TABLE IF NOT EXISTS analytics_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    event_type  VARCHAR(100) NOT NULL,
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_advocate   ON analytics_events(advocate_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);

-- refresh_tokens (used by advocate auth service)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ── Lex Bot / Chat (translator uses POSTGRES_DSN directly) ──
CREATE TABLE IF NOT EXISTS chat_sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role       VARCHAR(20) NOT NULL,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS translation_jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    status      VARCHAR(50) DEFAULT 'pending',
    source_lang VARCHAR(50),
    target_lang VARCHAR(50),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Seed Practice Areas ──────────────────────────────────────
INSERT INTO practice_areas (name, description, icon_name) VALUES
  ('Criminal Law',        'Defence and prosecution in criminal matters',         'gavel'),
  ('Civil Law',           'Disputes between individuals or organisations',        'balance'),
  ('Family Law',          'Divorce, custody, and family disputes',               'family'),
  ('Corporate Law',       'Business formation, M&A, and compliance',             'briefcase'),
  ('Intellectual Property','Patents, trademarks, and copyrights',                'lightbulb'),
  ('Real Estate',         'Property transactions and disputes',                  'home'),
  ('Labour Law',          'Employment disputes and worker rights',               'people'),
  ('Tax Law',             'Income tax, GST, and tax litigation',                 'receipt'),
  ('Constitutional Law',  'Fundamental rights and writ petitions',               'constitution'),
  ('Consumer Protection', 'Consumer forums and deficiency of service',           'shield')
ON CONFLICT (name) DO NOTHING;
