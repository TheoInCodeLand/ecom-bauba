-- 002: Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id              SERIAL PRIMARY KEY,
    parent_id       INT REFERENCES categories(id) ON DELETE RESTRICT,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(120) UNIQUE NOT NULL,
    description     TEXT,
    image_url       TEXT,
    icon_class      VARCHAR(50),
    position        INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    show_in_nav     BOOLEAN DEFAULT TRUE,
    meta_title      VARCHAR(255),
    meta_description TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
