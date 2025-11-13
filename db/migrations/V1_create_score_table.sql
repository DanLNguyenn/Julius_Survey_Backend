-- Scores for an assessment. OCEAN 0..100; RIASEC 0..100.
-- A2/E2/C2 are just column names to avoid clashing with OCEAN.A/E/C.
CREATE TABLE IF NOT EXISTS scores (
  assessment_id UUID PRIMARY KEY REFERENCES assessments(id) ON DELETE CASCADE,
  -- OCEAN
  O INT, C INT, E INT, A INT, N INT,
  -- RIASEC
  R INT, I INT, A2 INT, S INT, E2 INT, C2 INT,
  -- Final labels from your company algorithm
  primary_label   TEXT,
  secondary_label TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);