import { openDatabase, type DB } from '../src/db/connection.js'
import { GUEST_USER_ID } from '../src/db/schema.js'

/** Minimal rows for tests that need data without depending on the real course content. */
export function insertModule(db: DB, id: string, sortOrder: number) {
  db.prepare(
    `INSERT INTO modules (id, title, summary, introduction, concept, objectives_json, difficulty, sort_order)
     VALUES (?, ?, 'summary', 'intro', 'concept', '[]', 'beginner', ?)`,
  ).run(id, `Module ${id}`, sortOrder)
}

export function insertChallenge(db: DB, id: string, moduleId: string, sortOrder: number, difficulty = 'beginner') {
  db.prepare(
    `INSERT INTO challenges (id, module_id, title, difficulty, answer_type, scenario, objective, instructions_json,
       resources_json, options_json, terminal_env, answer_json, explanation_json, sort_order)
     VALUES (?, ?, ?, ?, 'text', 's', 'o', '[]', '[]', NULL, NULL, '{"type":"text","accepted":["x"]}', '{}', ?)`,
  ).run(id, moduleId, `Challenge ${id}`, difficulty, sortOrder)
}

export function insertProgress(
  db: DB,
  challengeId: string,
  values: { status: 'in_progress' | 'completed'; hintsUsed?: number; points?: number; completedAt?: string },
) {
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO challenge_progress (user_id, challenge_id, status, attempts, hints_used, points_awarded, started_at, completed_at)
     VALUES (?, ?, ?, 1, ?, ?, ?, ?)`,
  ).run(
    GUEST_USER_ID,
    challengeId,
    values.status,
    values.hintsUsed ?? 0,
    values.points ?? 0,
    now,
    values.status === 'completed' ? (values.completedAt ?? now) : null,
  )
}

export function insertActivity(db: DB, challengeId: string, eventType: string, createdAt: string) {
  db.prepare('INSERT INTO activity_log (user_id, challenge_id, event_type, detail, created_at) VALUES (?, ?, ?, ?, ?)').run(
    GUEST_USER_ID,
    challengeId,
    eventType,
    `${eventType} detail`,
    createdAt,
  )
}

/** Opens an in-memory database and registers it for closing after each test. */
export function trackedDatabases() {
  const opened: DB[] = []
  return {
    open(): DB {
      const db = openDatabase(':memory:')
      opened.push(db)
      return db
    },
    closeAll() {
      while (opened.length) opened.pop()?.close()
    },
  }
}
