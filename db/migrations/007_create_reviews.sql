-- 007: Create reviews
CREATE TABLE IF NOT EXISTS reviews (
    id          SERIAL PRIMARY KEY,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id    INT REFERENCES orders(id) ON DELETE SET NULL,
    
    rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title       VARCHAR(255),
    body        TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    
    helpful_yes INT DEFAULT 0,
    helpful_no  INT DEFAULT 0,
    
    status      VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
    moderated_at TIMESTAMPTZ,
    
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
