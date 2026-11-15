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
  }
}

export type ProgressRepository = ReturnType<typeof createProgressRepository>
