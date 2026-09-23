-- YPPReady database schema (SQLite-compatible, via @libsql/client — a local
-- file in development, a hosted Turso database in production).
-- Kept deliberately relational/portable: this same shape maps cleanly onto
-- Postgres or MySQL if the project later migrates off SQLite.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_code TEXT NOT NULL,
  other_text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user ON user_organizations(user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  organization_scope TEXT NOT NULL DEFAULT 'General',
  category TEXT NOT NULL,
  subcategory TEXT,
  difficulty TEXT NOT NULL,
  question_en TEXT NOT NULL,
  question_fr TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation_en TEXT NOT NULL,
  explanation_fr TEXT NOT NULL,
  skill_tested_en TEXT,
  skill_tested_fr TEXT,
  source TEXT
);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);

CREATE TABLE IF NOT EXISTS question_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  assessment_session_id INTEGER,
  context TEXT NOT NULL,
  selected_answer TEXT,
  is_correct INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_session ON question_attempts(assessment_session_id);

CREATE TABLE IF NOT EXISTS assessment_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT,
  question_ids_json TEXT NOT NULL,
  time_limit_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user ON assessment_sessions(user_id);

CREATE TABLE IF NOT EXISTS assessment_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_session_id INTEGER NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL,
  category_scores_json TEXT NOT NULL,
  strongest_area TEXT,
  priority_area TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  org_scope TEXT,
  title_en TEXT NOT NULL,
  title_fr TEXT NOT NULL,
  simple_definition_en TEXT NOT NULL,
  simple_definition_fr TEXT NOT NULL,
  why_it_matters_en_json TEXT NOT NULL,
  why_it_matters_fr_json TEXT NOT NULL,
  why_you_should_know_en TEXT NOT NULL,
  why_you_should_know_fr TEXT NOT NULL,
  quiz_json TEXT NOT NULL,
  sources_json TEXT NOT NULL,
  last_updated TEXT,
  -- Added for "International Development News" lessons (and available to any
  -- lesson): african_context is the required Africa-specific angle, the rest
  -- back the "en clair / pourquoi / contexte africain / mots techniques /
  -- exemple concret / résumé / réflexe QCM" structure. All nullable — older
  -- lessons (Development Knowledge, Organization Knowledge) don't set them.
  african_context_en TEXT,
  african_context_fr TEXT,
  technical_terms_json TEXT,
  concrete_example_en TEXT,
  concrete_example_fr TEXT,
  one_line_summary_en TEXT,
  one_line_summary_fr TEXT,
  qcm_reflex_en TEXT,
  qcm_reflex_fr TEXT,
  -- Ordered pedagogical walkthrough (e.g. why/what/how/attention points/money
  -- for the Ten-Year Strategy, or the two Four Cardinal Points sub-lists).
  -- Nullable — most lessons don't use it.
  structured_sections_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_lessons_category ON lessons(category);
CREATE INDEX IF NOT EXISTS idx_lessons_org_scope ON lessons(org_scope);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  quiz_score INTEGER,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);

CREATE TABLE IF NOT EXISTS interview_questions (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  org_scope TEXT NOT NULL DEFAULT 'General',
  question_en TEXT NOT NULL,
  question_fr TEXT NOT NULL,
  tip_en TEXT,
  tip_fr TEXT,
  label TEXT NOT NULL DEFAULT 'Practice Interview Question'
);
CREATE INDEX IF NOT EXISTS idx_interview_questions_category ON interview_questions(category);

CREATE TABLE IF NOT EXISTS interview_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_question_id TEXT NOT NULL REFERENCES interview_questions(id),
  situation TEXT,
  task TEXT,
  action TEXT,
  result TEXT,
  ai_score_json TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, interview_question_id)
);
CREATE INDEX IF NOT EXISTS idx_interview_answers_user ON interview_answers(user_id);

CREATE TABLE IF NOT EXISTS mock_interview_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  question_ids_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_mock_interview_sessions_user ON mock_interview_sessions(user_id);

CREATE TABLE IF NOT EXISTS mock_interview_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mock_interview_session_id INTEGER NOT NULL REFERENCES mock_interview_sessions(id) ON DELETE CASCADE,
  readiness_score INTEGER,
  strengths_json TEXT,
  weaknesses_json TEXT,
  recommendations_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_challenge_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_date TEXT NOT NULL,
  items_json TEXT NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, challenge_date)
);
CREATE INDEX IF NOT EXISTS idx_daily_challenge_user_date ON daily_challenge_progress(user_id, challenge_date);

CREATE TABLE IF NOT EXISTS user_progress_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_readiness INTEGER,
  development_knowledge INTEGER,
  organization_knowledge INTEGER,
  interview_readiness INTEGER,
  practice_consistency INTEGER,
  overall_readiness INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_user_progress_snapshots_user ON user_progress_snapshots(user_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  event_name TEXT NOT NULL,
  properties_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
