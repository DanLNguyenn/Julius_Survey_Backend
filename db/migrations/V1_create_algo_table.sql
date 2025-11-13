-- Supports linear OCEAN, linear RIASEC, and CROSS O×R.
CREATE TABLE IF NOT EXISTS weights_algo (
  label TEXT PRIMARY KEY,                           -- e.g., 'Creator'
  bias  DOUBLE PRECISION NOT NULL DEFAULT 0,
  cross_weights  JSONB NOT NULL DEFAULT '{}'::jsonb   -- {"O":{"R":0.2,"I":0.5,...}, "C":{...}, ...}
);