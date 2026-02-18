CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  website_index INT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  "time" TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  room TEXT NOT NULL DEFAULT '',
  speakers TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  knowledge_partners TEXT NOT NULL DEFAULT '',
  watch_live_link TEXT NOT NULL DEFAULT '',
  transcript TEXT NOT NULL DEFAULT '',
  people JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_sessions_website_index ON sessions(website_index);

-- Add people column to existing tables (no-op if already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'people') THEN
    ALTER TABLE sessions ADD COLUMN people JSONB NOT NULL DEFAULT '[]';
  END IF;
END $$;
