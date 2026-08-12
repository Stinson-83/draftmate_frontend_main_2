-- =========================================================
-- Draftmate / Lex Bot - Production Advocate Ecosystem Schema
-- =========================================================

-- 1. UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Core Profile Table
CREATE TABLE IF NOT EXISTS advocate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    bar_council_number VARCHAR(100) UNIQUE,
    years_experience INT DEFAULT 0,
    location VARCHAR(255),
    court_affiliation VARCHAR(255),
    bio TEXT,
    consultation_fee DECIMAL(10, 2) DEFAULT 0.00,
    profile_image_url TEXT,
    banner_image_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    profile_completion_score INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast profile discovery
CREATE INDEX IF NOT EXISTS idx_advocates_slug ON advocate_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_advocates_verified ON advocate_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_advocates_public ON advocate_profiles(is_public);
CREATE INDEX IF NOT EXISTS idx_advocates_location ON advocate_profiles(location);
CREATE INDEX IF NOT EXISTS idx_advocates_score ON advocate_profiles(profile_completion_score DESC);

-- 3. Professional Experience
CREATE TABLE IF NOT EXISTS advocate_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_experience_advocate ON advocate_experience(advocate_id);

-- 4. Education
CREATE TABLE IF NOT EXISTS advocate_education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255),
    start_year INT,
    end_year INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_education_advocate ON advocate_education(advocate_id);

-- 5. Notable Achievements / Cases
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date_achieved DATE,
    type VARCHAR(100) DEFAULT 'CASE', -- e.g. CASE, AWARD, PUBLICATION
    link_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_achievements_advocate ON achievements(advocate_id);

-- 6. Practice Areas Dictionary
CREATE TABLE IF NOT EXISTS practice_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(100)
);

-- 7. Advocate Practice Areas (Many-to-Many)
CREATE TABLE IF NOT EXISTS advocate_practice_areas (
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    practice_area_id UUID REFERENCES practice_areas(id) ON DELETE CASCADE,
    PRIMARY KEY (advocate_id, practice_area_id)
);
CREATE INDEX IF NOT EXISTS idx_apa_practice_area ON advocate_practice_areas(practice_area_id);

-- 8. Bookmarks (Saved Profiles)
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, advocate_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- 9. Verification Requests
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    documents_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_requests(status);

-- 10. Consultation Workflow
CREATE TABLE IF NOT EXISTS consultation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    preferred_type VARCHAR(50) DEFAULT 'Video Call',
    preferred_date TIMESTAMP,
    case_summary TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, COMPLETED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_consultation_advocate ON consultation_requests(advocate_id);
CREATE INDEX IF NOT EXISTS idx_consultation_status ON consultation_requests(status);

-- 11. Direct Messages / Contact Workflow
CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'UNREAD', -- UNREAD, READ, REPLIED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contact_advocate ON contact_requests(advocate_id);

-- 12. Moderation Reports
CREATE TABLE IF NOT EXISTS moderation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID,
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- NEW ANALYTICS TABLES
-- ==========================================

-- 13. Profile Views Analytics
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    viewer_ip VARCHAR(255),
    referrer VARCHAR(500),
    user_agent TEXT,
    source VARCHAR(100) DEFAULT 'direct', -- e.g., 'direct', 'search', 'social_linkedin', 'qr_code'
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_views_advocate_time ON profile_views(advocate_id, viewed_at);

-- 14. Profile Shares Analytics
CREATE TABLE IF NOT EXISTS profile_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id UUID REFERENCES advocate_profiles(id) ON DELETE CASCADE,
    platform VARCHAR(100) NOT NULL, -- e.g., 'whatsapp', 'linkedin', 'email', 'copy_link', 'native'
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shares_advocate_time ON profile_shares(advocate_id, shared_at);

-- 15. Search Appearances Analytics
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_query VARCHAR(255),
    practice_area_filter UUID REFERENCES practice_areas(id) ON DELETE SET NULL,
    results_count INT DEFAULT 0,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_search_analytics_time ON search_analytics(searched_at);
