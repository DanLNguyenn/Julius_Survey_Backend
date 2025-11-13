-- One response per slide answered in an assessment.
CREATE TABLE IF NOT EXISTS responses (
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  slide_id      TEXT NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
  choice        TEXT NOT NULL CHECK (choice IN ('ME','NOT_ME')),
  rt_ms         INT,
  PRIMARY KEY (assessment_id, slide_id)
);