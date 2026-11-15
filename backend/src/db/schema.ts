/**
 * Database schema. Content tables (modules, challenges, challenge_hints) are filled from version-controlled
 * content files at startup; progress tables (challenge_progress, activity_log) hold the learner's data.
 */
export const SCHEMA_VERSION = 1

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY,
  display_name TEXT    NOT NULL,
  created_at   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS modules (
  id              TEXT    PRIMARY KEY,
  title           TEXT    NOT NULL,
  summary         TEXT    NOT NULL,
  introduction    TEXT    NOT NULL,
  concept         TEXT    NOT NULL,
  objectives_json TEXT    NOT NULL,
  difficulty      TEXT    NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  sort_order      INTEGER NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS challenges (
  id                TEXT    PRIMARY KEY,
  module_id         TEXT    NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title             TEXT    NOT NULL,
  difficulty        TEXT    NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  answer_type       TEXT    NOT NULL CHECK (answer_type IN ('text', 'choice')),
  scenario          TEXT    NOT NULL,
  objective         TEXT    NOT NULL,
  instructions_json TEXT    NOT NULL,
  resources_json    TEXT    NOT NULL,
  options_json      TEXT,
  terminal_env      TEXT,
  answer_json       TEXT    NOT NULL,
  explanation_json  TEXT    NOT NULL,
  sort_order        INTEGER NOT NULL,
  UNIQUE (module_id, sort_order)
);
CREATE INDEX IF NOT EXISTS idx_challenges_module ON challenges(module_id, sort_order);

CREATE TABLE IF NOT EXISTS challenge_hints (
  challenge_id TEXT    NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  hint_number  INTEGER NOT NULL CHECK (hint_number BETWEEN 1 AND 3),
  text         TEXT    NOT NULL,
  PRIMARY KEY (challenge_id, hint_number)
);

CREATE TABLE IF NOT EXISTS challenge_progress (
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id   TEXT    NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  status         TEXT    NOT NULL CHECK (status IN ('in_progress', 'completed')),
  attempts       INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  hints_used     INTEGER NOT NULL DEFAULT 0 CHECK (hints_used BETWEEN 0 AND 3),
  points_awarded INTEGER NOT NULL DEFAULT 0 CHECK (points_awarded >= 0),
  started_at     TEXT    NOT NULL,
  completed_at   TEXT,
  PRIMARY KEY (user_id, challenge_id),
  CHECK ((status = 'completed') = (completed_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT    NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  event_type   TEXT    NOT NULL CHECK (event_type IN ('hint_revealed', 'incorrect_attempt', 'completed')),
  detail       TEXT    NOT NULL,
  created_at   TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_user_time ON activity_log(user_id, created_at DESC, id DESC);
`

/** The single local learner profile used by the MVP (see docs/PLAN.md, "one local guest profile"). */
export const GUEST_USER_ID = 1
