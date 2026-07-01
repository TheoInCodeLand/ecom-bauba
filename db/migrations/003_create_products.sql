-- 003: Create products table
CREATE TABLE IF NOT EXISTS products (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    category_id         INT NOT NULL REFERENCES categories(id),
    slug                VARCHAR(255) UNIQUE NOT NULL,
    
    -- Identification
    name                VARCHAR(255) NOT NULL,
    brand               VARCHAR(100),
    sku_prefix          VARCHAR(50),
    
    -- Rich description
    short_description   VARCHAR(500),
    description         TEXT NOT NULL DEFAULT '',
    material_details    TEXT,
    care_instructions   TEXT,
    fit_and_sizing      TEXT,
    origin_country      VARCHAR(100),
    designer_notes      TEXT,
    
    -- Pricing
    base_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
    compare_at_price    DECIMAL(10,2),
    cost_price          DECIMAL(10,2),
    vat_inclusive       BOOLEAN DEFAULT TRUE,
    vat_rate            DECIMAL(5,2) DEFAULT 15.00,
    
    -- Tax & shipping
    weight_grams        INT,
    length_cm           DECIMAL(8,2),
    width_cm            DECIMAL(8,2),
    height_cm           DECIMAL(8,2),
    requires_shipping   BOOLEAN DEFAULT TRUE,
    is_fragile          BOOLEAN DEFAULT FALSE,
    
    -- Discovery
    tags                TEXT[],
    search_vector       TSVECTOR,
    
    -- Status
    is_active           BOOLEAN DEFAULT FALSE,
    is_featured         BOOLEAN DEFAULT FALSE,
    is_new_arrival      BOOLEAN DEFAULT FALSE,
    is_bestseller       BOOLEAN DEFAULT FALSE,
    is_limited_edition  BOOLEAN DEFAULT FALSE,
    
    -- SEO
    meta_title          VARCHAR(255),
    meta_description    TEXT,
    canonical_url       TEXT,
    
    -- Analytics (denormalised)
    view_count          INT DEFAULT 0,
    wishlist_count      INT DEFAULT 0,
    purchase_count      INT DEFAULT 0,
    average_rating      DECIMAL(3,2) DEFAULT 0,
    review_count        INT DEFAULT 0,
    
    -- Timestamps
    published_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'D') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_search_vector ON products;
CREATE TRIGGER trg_product_search_vector
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_product_search_vector();

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON products(is_bestseller) WHERE is_bestseller = TRUE;

-- Product images
CREATE TABLE IF NOT EXISTS product_images (
    id          SERIAL PRIMARY KEY,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id  INT,
    url         TEXT NOT NULL,
    alt_text    VARCHAR(255),
    position    INT DEFAULT 0,
    is_primary  BOOLEAN DEFAULT FALSE,
    width       INT,
    height      INT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_variant_id ON product_images(variant_id);
