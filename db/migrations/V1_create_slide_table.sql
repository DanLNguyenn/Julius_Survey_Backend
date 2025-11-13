-- If you use UUIDs:
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Slides: one record per image+caption. Weights can cover OCEAN, RIASEC, or both.
CREATE TABLE IF NOT EXISTS slides (
  id            TEXT PRIMARY KEY,                 -- e.g., 'S001'
  image_url     TEXT NOT NULL,                    -- e.g., '/img/brainstorm.jpg'
  caption       TEXT NOT NULL,
  weights_ocean  JSONB NOT NULL DEFAULT '{}'::jsonb,  -- e.g., {"O":1,"E":0.5}
  weights_riasec JSONB NOT NULL DEFAULT '{}'::jsonb,  -- e.g., {"A":0.6,"I":0.3}
  tags          TEXT[] DEFAULT '{}',
  active        BOOLEAN NOT NULL DEFAULT TRUE
);