CREATE TABLE IF NOT EXISTS lesson_assessments (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  course TEXT NOT NULL,
  session_label TEXT NOT NULL,
  topic_number INTEGER NOT NULL DEFAULT 0,
  assessment_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  read_time_required_seconds INTEGER NOT NULL DEFAULT 0,
  read_time_completed_at TEXT,
  submitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (consultation_id, course, session_label, assessment_type)
);

CREATE INDEX IF NOT EXISTS idx_lesson_assessments_consultation_id
  ON lesson_assessments(consultation_id);

CREATE INDEX IF NOT EXISTS idx_lesson_assessments_user_id
  ON lesson_assessments(user_id);

CREATE INDEX IF NOT EXISTS idx_lesson_assessments_submitted_at
  ON lesson_assessments(submitted_at);
