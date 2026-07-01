-- 011: Create stock reservations
CREATE TABLE IF NOT EXISTS stock_reservations (
    id              SERIAL PRIMARY KEY,
    variant_id      INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    user_id         INT REFERENCES users(id) ON DELETE SET NULL,
    session_id      VARCHAR(255),
    quantity        INT NOT NULL CHECK (quantity > 0),
    reservation_token VARCHAR(255) UNIQUE NOT NULL,
    status          VARCHAR(20) DEFAULT 'held'
                        CHECK (status IN ('held','confirmed','released','expired')),
    expires_at      TIMESTAMPTZ NOT NULL,
    order_id        INT REFERENCES orders(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_variant_id ON stock_reservations(variant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_session ON stock_reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON stock_reservations(expires_at) WHERE status = 'held';
CREATE INDEX IF NOT EXISTS idx_reservations_token ON stock_reservations(reservation_token);
CREATE INDEX IF NOT EXISTS idx_reservations_order_id ON stock_reservations(order_id);
