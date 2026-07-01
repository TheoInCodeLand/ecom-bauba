-- 004: Create product variants and attribute types
CREATE TABLE IF NOT EXISTS variant_attribute_types (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    input_type  VARCHAR(20) DEFAULT 'text'
                    CHECK (input_type IN ('text','colour','image','button')),
    position    INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default attribute types
INSERT INTO variant_attribute_types (name, display_name, input_type, position) VALUES
    ('Size', 'Size', 'button', 1),
    ('Colour', 'Colour', 'colour', 2),
    ('Material', 'Material', 'button', 3),
    ('Length', 'Length', 'button', 4),
    ('Width', 'Width', 'button', 5),
    ('Style', 'Style', 'button', 6),
    ('Edition', 'Edition', 'button', 7)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS product_variants (
    id              SERIAL PRIMARY KEY,
    uuid            UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    product_id      INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku             VARCHAR(100) UNIQUE,
    
    -- Pricing override (NULL = use product base_price)
    price_override  DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    
    -- Stock
    stock_quantity  INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INT DEFAULT 3,
    track_inventory BOOLEAN DEFAULT TRUE,
    allow_backorder BOOLEAN DEFAULT FALSE,
    
    -- Physical
    weight_grams    INT,
    
    -- Display
    image_url       TEXT,
    position        INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT TRUE,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

CREATE TABLE IF NOT EXISTS variant_attributes (
    id              SERIAL PRIMARY KEY,
    variant_id      INT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_type  VARCHAR(50) NOT NULL,
    attribute_value VARCHAR(100) NOT NULL,
    display_value   VARCHAR(100),
    position        INT DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_variant_attrs_unique
    ON variant_attributes(variant_id, attribute_type);
CREATE INDEX IF NOT EXISTS idx_variant_attrs_variant_id ON variant_attributes(variant_id);

-- Add FK from product_images to product_variants
ALTER TABLE product_images 
    ADD CONSTRAINT IF NOT EXISTS fk_product_images_variant 
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL;
