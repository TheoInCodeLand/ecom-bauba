-- 009: Create sessions table (managed by connect-pg-simple)
CREATE TABLE IF NOT EXISTS session (
    sid     VARCHAR NOT NULL COLLATE "default",
    sess    JSON NOT NULL,
    expire  TIMESTAMPTZ NOT NULL
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'session_pkey'
    ) THEN
        ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire);
