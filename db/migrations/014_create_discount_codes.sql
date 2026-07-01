-- 014: Discount codes (already created in 005, this ensures completeness)
-- The discount_codes table was created in 005_create_orders.sql
-- This migration adds the discount_code_uses index
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);
