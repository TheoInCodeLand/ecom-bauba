-- 013: Create collections
CREATE TABLE IF NOT EXISTS collections (
    id              SERIAL PRIMARY KEY,
    slug            VARCHAR(120) UNIQUE NOT NULL,
    name            VARCHAR(255) NOT NULL,
    headline        VARCHAR(500),
    description     TEXT,
    hero_image_url  TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    position        INT DEFAULT 0,
    valid_from      TIMESTAMPTZ,
    valid_until     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_products (
    collection_id   INT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    position        INT DEFAULT 0,
    PRIMARY KEY (collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON collections(is_active);
