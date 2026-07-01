-- 001: Create users table
CREATE TABLE IF NOT EXISTS users (
    id                      SERIAL PRIMARY KEY,
    uuid                    UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    role                    VARCHAR(20) NOT NULL DEFAULT 'customer'
                                CHECK (role IN ('visitor','customer','owner')),
    -- Identity
    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100) NOT NULL,
    email                   VARCHAR(255) UNIQUE NOT NULL,
    phone                   VARCHAR(30),
    date_of_birth           DATE,
    gender                  VARCHAR(20) CHECK (gender IN ('male','female','non-binary','prefer_not_to_say')),
    
    -- Authentication
    password_hash           TEXT NOT NULL,
    email_verified          BOOLEAN DEFAULT FALSE,
    email_verify_token      TEXT,
    email_verify_token_exp  TIMESTAMPTZ,
    is_active               BOOLEAN DEFAULT TRUE,
    
    -- Profile enrichment
    avatar_url              TEXT,
    preferred_language      VARCHAR(10) DEFAULT 'en',
    preferred_currency      VARCHAR(3) DEFAULT 'ZAR',
    newsletter_opt_in       BOOLEAN DEFAULT FALSE,
    sms_opt_in              BOOLEAN DEFAULT FALSE,
    marketing_opt_in        BOOLEAN DEFAULT FALSE,
    
    -- Account stats (denormalised for performance)
    total_orders            INT DEFAULT 0,
    total_spent             DECIMAL(12,2) DEFAULT 0.00,
    loyalty_points          INT DEFAULT 0,
    
    -- Loyalty tier
    loyalty_tier            VARCHAR(20) DEFAULT 'bronze'
                                CHECK (loyalty_tier IN ('bronze','silver','gold','platinum')),
    
    -- Security
    failed_login_attempts   INT DEFAULT 0,
    locked_until            TIMESTAMPTZ,
    last_login_at           TIMESTAMPTZ,
    last_login_ip           INET,
    last_seen_at            TIMESTAMPTZ,
    
    -- Meta
    notes                   TEXT,
    referred_by             INT REFERENCES users(id),
    referral_code           VARCHAR(20) UNIQUE,
    
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_loyalty_tier ON users(loyalty_tier);

CREATE TABLE IF NOT EXISTS addresses (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label           VARCHAR(50) DEFAULT 'Home',
    is_default      BOOLEAN DEFAULT FALSE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    company         VARCHAR(150),
    address_line_1  VARCHAR(255) NOT NULL,
    address_line_2  VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    province        VARCHAR(100),
    postal_code     VARCHAR(20),
    country         VARCHAR(100) DEFAULT 'South Africa',
    phone           VARCHAR(30),
    delivery_notes  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_user_id ON password_reset_tokens(user_id);
