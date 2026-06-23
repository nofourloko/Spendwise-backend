CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'PLN',
    password_hash VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Idempotent: ensures the column exists on databases created before auth was
-- added (CREATE TABLE IF NOT EXISTS won't alter an existing table).
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Opaque, rotatable, revocable refresh tokens (stored as a SHA-256 hash).
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS user_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),

    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),

    year INT NOT NULL CHECK (year >= 2000),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, month, year)
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255),
    expense_date DATE NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ocr')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    monthly_limit DECIMAL(10, 2) NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    UNIQUE (user_id, category_id, month, year)
);

TRUNCATE TABLE expenses, budget_limits, user_budgets, refresh_tokens, users, categories RESTART IDENTITY CASCADE;

INSERT INTO categories (id, name, icon, color) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Jedzenie',        'fork-knife',     '#1D9E75'),
    ('a1000000-0000-0000-0000-000000000002', 'Transport',       'car',            '#378ADD'),
    ('a1000000-0000-0000-0000-000000000003', 'Rozrywka',        'gamepad',        '#7F77DD'),
    ('a1000000-0000-0000-0000-000000000004', 'Zdrowie',         'heart',          '#E24B4A'),
    ('a1000000-0000-0000-0000-000000000005', 'Ubrania',         'shirt',          '#D4537E'),
    ('a1000000-0000-0000-0000-000000000006', 'Mieszkanie',      'home',           '#EF9F27'),
    ('a1000000-0000-0000-0000-000000000007', 'Edukacja',        'book',           '#5DCAA5'),
    ('a1000000-0000-0000-0000-000000000008', 'Elektronika',     'laptop',         '#85B7EB'),
    ('a1000000-0000-0000-0000-000000000009', 'Sport',           'dumbbell',       '#97C459'),
    ('a1000000-0000-0000-0000-000000000010', 'Inne',            'dots',           '#B4B2A9')
ON CONFLICT (id) DO NOTHING;

-- Test user. Password: "test1234" (bcrypt via pgcrypto; verifiable by bcryptjs).
INSERT INTO users (id, email, name, currency, password_hash, created_at) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'test@grosz.app', 'Jan Kowalski', 'PLN', crypt('test1234', gen_salt('bf', 10)), NOW())
ON CONFLICT (id) DO NOTHING;


INSERT INTO expenses (user_id, category_id, amount, description, expense_date, source) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 45.99,  'Biedronka — zakupy tygodniowe',   '2026-04-01', 'ocr'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 120.00, 'Paliwo',                          '2026-04-02', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 35.00,  'Netflix miesięczna subskrypcja',  '2026-04-03', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 28.50,  'Żabka — lunch',                   '2026-04-05', 'ocr'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 1800.00,'Czynsz kwiecień',                 '2026-04-05', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 60.00,  'Wizyta u lekarza',                '2026-04-07', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 92.30,  'Lidl — zakupy miesięczne',        '2026-04-08', 'ocr'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', 199.99, 'Kurtka wiosenna',                 '2026-04-10', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 48.00,  'Bilet miesięczny ZTM',            '2026-04-10', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', 149.00, 'Kurs online — React Native',      '2026-04-12', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 80.00,  'Kino + kolacja ze znajomymi',     '2026-04-13', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 55.20,  'Carrefour — warzywa i owoce',     '2026-04-15', 'ocr'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000009', 120.00, 'Karnet na siłownię',              '2026-04-15', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000008', 349.00, 'Słuchawki bezprzewodowe',         '2026-04-18', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 38.75,  'Restauracja — obiad',             '2026-04-20', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010', 25.00,  'Prezent urodzinowy',              '2026-04-22', 'manual'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 85.00,  'Paliwo — dłuższa trasa',          '2026-04-24', 'ocr'),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 67.40,  'Biedronka — weekend',             '2026-04-26', 'ocr');


INSERT INTO budget_limits (user_id, category_id, monthly_limit, month, year) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 500.00,  4, 2026),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 300.00,  4, 2026),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 150.00,  4, 2026),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', 200.00,  4, 2026),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', 300.00,  4, 2026),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', 2000.00, 4, 2026),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', 200.00,  4, 2026),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000008', 400.00,  4, 2026),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000009', 150.00,  4, 2026),
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010', 100.00,  4, 2026)
ON CONFLICT (user_id, category_id, month, year) DO NOTHING;

INSERT INTO user_budgets (
    user_id,
    amount,
    month,
    year
)
VALUES (
    'b1000000-0000-0000-0000-000000000001',
    5000.00,
    4,
    2026
)
ON CONFLICT (user_id, month, year) DO NOTHING;