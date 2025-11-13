-- One assessment (test run) per user/session.
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  model   TEXT NOT NULL DEFAULT 'both',   -- 'ocean' | 'riasec' | 'both'
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  secs_taken   INT
);