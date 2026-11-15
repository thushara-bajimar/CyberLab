/** Response types mirroring the backend. Kept in one file so a mismatch is easy to spot. */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type ChallengeStatus = 'not_started' | 'in_progress' | 'completed'
export type ActivityType = 'hint_revealed' | 'incorrect_attempt' | 'completed'

export interface HealthResponse {
  status: 'ok' | 'degraded'
  service: string
  database: { status: 'ok' | 'unavailable'; schemaVersion?: number }
}

export interface ActivityItem {
  id: number
  challengeId: string
  challengeTitle: string
  moduleTitle: string
  eventType: ActivityType
  detail: string
  createdAt: string
}

export interface DashboardResponse {
  learner: { displayName: string }
  totals: {
    challenges: number
    completed: number
    pending: number
    points: number
    possiblePoints: number
    completionPercent: number
  }
  modules: { id: string; title: string; difficulty: Difficulty; totalChallenges: number; completedChallenges: number }[]
  recentActivity: ActivityItem[]
  recommended: {
    challengeId: string
    title: string
    moduleId: string
    moduleTitle: string
    difficulty: Difficulty
    points: number
    reason: 'continue' | 'next'
  } | null
}
