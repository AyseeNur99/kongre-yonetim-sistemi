-- ============================================
-- KONGRE YÖNETİM SİSTEMİ - VERİTABANI ŞEMASI
-- PostgreSQL
-- ============================================

-- Kullanıcılar: hem yazar hem hakem hem admin olabilir (role alanı ile)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'author', -- 'author' | 'reviewer' | 'admin'
    institution VARCHAR(200),                    -- kurum/üniversite bilgisi
    created_at TIMESTAMP DEFAULT NOW()
);

-- Kongreler
CREATE TABLE congresses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    submission_deadline DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Temalar: bir kongrenin altında birden fazla tema olur
CREATE TABLE themes (
    id SERIAL PRIMARY KEY,
    congress_id INTEGER NOT NULL REFERENCES congresses(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,       -- örn: "Kardiyoloji", "Onkoloji"
    description TEXT
);

-- Bildiriler / Makaleler
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    abstract TEXT,                     -- özet
    file_path VARCHAR(500) NOT NULL,   -- yüklenen dosyanın sunucudaki yolu
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected'
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- Hakem Atamaları: hangi 10 hakem hangi bildiriye atandı
CREATE TABLE reviewer_assignments (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(submission_id, reviewer_id)  -- aynı hakem aynı bildiriye 2 kez atanamaz
);

-- Değerlendirmeler: her hakemin verdiği onay/red kararı
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    decision VARCHAR(20) NOT NULL,     -- 'approved' | 'rejected'
    comment TEXT,                       -- hakemin isteğe bağlı yorumu
    reviewed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(submission_id, reviewer_id)  -- bir hakem bir bildiriye tek oy verir
);

-- Sık sorgulanan alanlar için index'ler
CREATE INDEX idx_submissions_author ON submissions(author_id);
CREATE INDEX idx_submissions_theme ON submissions(theme_id);
CREATE INDEX idx_reviews_submission ON reviews(submission_id);
