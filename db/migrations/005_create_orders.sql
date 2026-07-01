-- 005: Create orders and order items
CREATE TABLE IF NOT EXISTS discount_codes (
    id                  SERIAL PRIMARY KEY,
    code                VARCHAR(50) UNIQUE NOT NULL,
    description         VARCHAR(255),
    type                VARCHAR(20) NOT NULL
                            CHECK (type IN ('percentage','fixed','free_shipping','bogo')),
    value               DECIMAL(10,2),
    minimum_order_value DECIMAL(10,2),
    maximum_discount    DECIMAL(10,2),
    applies_to          VARCHAR(20) DEFAULT 'all'
                            CHECK (applies_to IN ('all','category','product','collection')),
    applicable_ids      INT[],
    customer_ids        INT[],
    usage_limit         INT,
    usage_per_customer  INT DEFAULT 1,
    usage_count         INT DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE,
    starts_at           TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id                  SERIAL PRIMARY KEY,
    uuid                UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    order_number        VARCHAR(30) UNIQUE NOT NULL,
    user_id             INT REFERENCES users(id) ON DELETE SET NULL,
    
    status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                            CHECK (status IN (
                                'pending',
                                'payment_pending',
                                'paid',
                                'processing',
                                'ready_to_ship',
                                'shipped',
                                'delivered',
                                'cancelled',
                                'refunded',
                                'partially_refunded',
                                'failed'
                            )),
    payment_status      VARCHAR(30) DEFAULT 'unpaid'
                            CHECK (payment_status IN ('unpaid','paid','failed','refunded','partial_refund')),
    
    payment_method      VARCHAR(50),
    payment_reference   VARCHAR(255),
    payfast_payment_id  VARCHAR(255),
    idempotency_key     VARCHAR(255) UNIQUE,
    
    subtotal            DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_cost       DECIMAL(12,2) DEFAULT 0.00,
    discount_amount     DECIMAL(12,2) DEFAULT 0.00,
    vat_amount          DECIMAL(12,2) DEFAULT 0.00,
    total_amount        DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    discount_code_id    INT REFERENCES discount_codes(id),
    discount_code       VARCHAR(50),
    
    -- Shipping address snapshot
    shipping_first_name     VARCHAR(100),
    shipping_last_name      VARCHAR(100),
    shipping_company        VARCHAR(150),
    shipping_address_line_1 VARCHAR(255),
    shipping_address_line_2 VARCHAR(255),
    shipping_city           VARCHAR(100),
    shipping_province       VARCHAR(100),
    shipping_postal_code    VARCHAR(20),
    shipping_country        VARCHAR(100),
    shipping_phone          VARCHAR(30),
    
    -- Billing
    billing_same_as_shipping BOOLEAN DEFAULT TRUE,
    billing_first_name      VARCHAR(100),
    billing_last_name       VARCHAR(100),
    billing_address_line_1  VARCHAR(255),
    billing_city            VARCHAR(100),
    billing_province        VARCHAR(100),
    billing_postal_code     VARCHAR(20),
    billing_country         VARCHAR(100),
    
    -- Fulfilment
    shipping_carrier        VARCHAR(100),
    tracking_number         VARCHAR(255),
    tracking_url            TEXT,
    estimated_delivery      DATE,
    shipped_at              TIMESTAMPTZ,
    delivered_at            TIMESTAMPTZ,
    
    customer_notes          TEXT,
    internal_notes          TEXT,
    
    paid_at             TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

CREATE TABLE IF NOT EXISTS order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      INT REFERENCES products(id) ON DELETE SET NULL,
    variant_id      INT REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name        VARCHAR(255) NOT NULL,
    variant_description TEXT,
    sku                 VARCHAR(100),
    product_image_url   TEXT,
    quantity        INT NOT NULL CHECK (quantity > 0),
    unit_price      DECIMAL(10,2) NOT NULL,
    total_price     DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    refunded_quantity   INT DEFAULT 0,
    refunded_amount     DECIMAL(10,2) DEFAULT 0.00,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

CREATE TABLE IF NOT EXISTS order_status_history (
    id          SERIAL PRIMARY KEY,
    order_id    INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status      VARCHAR(30) NOT NULL,
    note        TEXT,
    changed_by  INT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);

CREATE TABLE IF NOT EXISTS discount_code_uses (
    id              SERIAL PRIMARY KEY,
    discount_code_id INT NOT NULL REFERENCES discount_codes(id),
    user_id         INT REFERENCES users(id),
    order_id        INT REFERENCES orders(id),
    discount_amount DECIMAL(10,2),
    used_at         TIMESTAMPTZ DEFAULT NOW()
);
