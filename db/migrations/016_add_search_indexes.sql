-- 016: Add additional search indexes and constraints
-- Full-text search GIN index already created in 003
-- Additional composite indexes for common query patterns

CREATE INDEX IF NOT EXISTS idx_products_active_featured
    ON products(is_active, is_featured) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_products_active_new_arrival
    ON products(is_active, published_at DESC) WHERE is_new_arrival = TRUE AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_products_active_bestseller
    ON products(is_active, purchase_count DESC) WHERE is_bestseller = TRUE AND is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_product_variants_active_stock
    ON product_variants(product_id, stock_quantity) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_orders_user_created
    ON orders(user_id, created_at DESC);

-- Ensure updated_at is auto-updated by trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to key tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['users','products','product_variants','orders','categories','collections','stock_reservations','idempotency_keys']
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
            CREATE TRIGGER trg_%s_updated_at
            BEFORE UPDATE ON %s
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;
