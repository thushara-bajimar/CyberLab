import type { DB } from '../db/connection.js'

export type ProgressStatus = 'in_progress' | 'completed'

export interface ProgressRecord {
  challengeId: string
  status: ProgressStatus
  attempts: number
  hintsUsed: number
  pointsAwarded: number
  startedAt: string
  completedAt: string | null
}

export interface ActivityRecord {
  id: number
  challengeId: string
  challengeTitle: string
  moduleTitle: string
  eventType: 'hint_revealed' | 'incorrect_attempt' | 'completed'
  detail: string
  createdAt: string
}

const PROGRESS_SELECT = `
  SELECT challenge_id AS challengeId, status, attempts, hints_used AS hintsUsed,
         points_awarded AS pointsAwarded, started_at AS startedAt, completed_at AS completedAt
  FROM challenge_progress`

export function createProgressRepository(db: DB) {
  return {
    listProgress(userId: number): ProgressRecord[] {
      return db.prepare(`${PROGRESS_SELECT} WHERE user_id = ?`).all(userId) as ProgressRecord[]
    },

    getProgress(userId: number, challengeId: string): ProgressRecord | null {
      return (db.prepare(`${PROGRESS_SELECT} WHERE user_id = ? AND challenge_id = ?`).get(userId, challengeId) as ProgressRecord | undefined) ?? null
    },

    recentActivity(userId: number, limit: number): ActivityRecord[] {
      return db
        .prepare(
          `SELECT a.id, a.challenge_id AS challengeId, c.title AS challengeTitle, m.title AS moduleTitle,
                  a.event_type AS eventType, a.detail, a.created_at AS createdAt
           FROM activity_log a
           JOIN challenges c ON c.id = a.challenge_id
           JOIN modules m ON m.id = c.module_id
           WHERE a.user_id = ?
           ORDER BY a.created_at DESC, a.id DESC
           LIMIT ?`,
        )
        .all(userId, limit) as ActivityRecord[]
    },

    getDisplayName(userId: number): string {
      const row = db.prepare('SELECT display_name AS displayName FROM users WHERE id = ?').get(userId) as { displayName: string } | undefined
      return row?.displayName ?? 'Learner'
    },

    // ---- writes: each update has a guard condition so the database itself refuses double updates ----

    /** Runs fn inside one SQLite transaction: everything in it is saved together or not at all. */
    transaction<T>(fn: () => T): T {
      return db.transaction(fn)()
    },

    /** Creates the progress row the first time a learner acts on a challenge (no-op if it exists). */
    ensureStarted(userId: number, challengeId: string, now: string): void {
      db.prepare(
        `INSERT OR IGNORE INTO challenge_progress (user_id, challenge_id, status, attempts, hints_used, points_awarded, started_at)
         VALUES (?, ?, 'in_progress', 0, 0, 0, ?)`,
      ).run(userId, challengeId, now)
    },

    /** Counts one more hint only if exactly `expectedUsed` were used before and the challenge is unfinished. */
    incrementHints(userId: number, challengeId: string, expectedUsed: number): boolean {
      const result = db
        .prepare(
          `UPDATE challenge_progress SET hints_used = hints_used + 1
           WHERE user_id = ? AND challenge_id = ? AND status = 'in_progress' AND hints_used = ?`,
        )
        .run(userId, challengeId, expectedUsed)
      return result.changes === 1
    },

    incrementAttempts(userId: number, challengeId: string): number {
      const row = db
        .prepare(
          `UPDATE challenge_progress SET attempts = attempts + 1
           WHERE user_id = ? AND challenge_id = ? AND status = 'in_progress' RETURNING attempts`,
        )
        .get(userId, challengeId) as { attempts: number } | undefined
      return row?.attempts ?? 0
    },

    /** Marks the challenge completed and stores its points; returns false if it was already completed. */
    complete(userId: number, challengeId: string, points: number, now: string): boolean {
      const result = db
        .prepare(
          `UPDATE challenge_progress SET status = 'completed', points_awarded = ?, completed_at = ?
           WHERE user_id = ? AND challenge_id = ? AND status = 'in_progress'`,
        )
        .run(points, now, userId, challengeId)
      return result.changes === 1
    },

    logActivity(userId: number, challengeId: string, eventType: ActivityRecord['eventType'], detail: string, now: string): void {
      db.prepare('INSERT INTO activity_log (user_id, challenge_id, event_type, detail, created_at) VALUES (?, ?, ?, ?, ?)').run(
        userId,
        challengeId,
        eventType,
        detail,
        now,
      )
    },
  }
}

export type ProgressRepository = ReturnType<typeof createProgressRepository>
