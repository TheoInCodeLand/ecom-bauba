-- 010: Create idempotency keys
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id              SERIAL PRIMARY KEY,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    user_id         INT REFERENCES users(id),
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     INT,
    request_hash    TEXT,
    response_status INT,
    response_body   JSONB,
    status          VARCHAR(20) DEFAULT 'processing'
                        CHECK (status IN ('processing','completed','failed')),
    expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_keys(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_user ON idempotency_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);
