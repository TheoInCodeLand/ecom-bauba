-- 008: Create wishlists
CREATE TABLE IF NOT EXISTS wishlists (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id  INT REFERENCES product_variants(id) ON DELETE SET NULL,
    added_at    TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlists(product_id);
