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

export interface ModuleSummary {
  id: string
  title: string
  summary: string
  difficulty: Difficulty
  order: number
  totalChallenges: number
  completedChallenges: number
  pointsEarned: number
  pointsPossible: number
  status: ChallengeStatus
}

export interface ChallengeSummary {
  id: string
  moduleId: string
  moduleTitle: string
  title: string
  difficulty: Difficulty
  answerType: 'text' | 'choice'
  usesTerminal: boolean
  basePoints: number
  status: ChallengeStatus
  pointsAwarded: number
}

export interface ModuleDetail extends ModuleSummary {
  introduction: string
  concept: string
  objectives: string[]
  challenges: ChallengeSummary[]
}

export interface Explanation {
  solution: string
  why: string
  concept: string
  commands: { command: string; purpose: string }[]
  commonMistakes: string[]
  realWorld: string
}

export interface ChallengeDetail extends ChallengeSummary {
  scenario: string
  objective: string
  instructions: string[]
  resources: { title: string; body: string }[]
  options: { id: string; text: string }[] | null
  terminal: { environmentId: string; title: string; user: string; hostname: string; home: string } | null
  scoring: { basePoints: number; hintPenaltyPercent: number; pointsAvailable: number | null }
  hints: { total: number; used: number; revealed: { number: number; text: string }[] }
  progress: {
    status: ChallengeStatus
    attempts: number
    hintsUsed: number
    pointsAwarded: number
    startedAt: string | null
    completedAt: string | null
  }
  explanation: Explanation | null
  navigation: { previousId: string | null; nextId: string | null }
}

export interface TerminalRequest {
  challengeId: string
  command: string
  cwd?: string
  history?: string[]
}

export interface TerminalResponse {
  output: string
  cwd: string
  clear: boolean
  isError: boolean
}

export interface HintResponse {
  revealed: boolean
  challenge: ChallengeDetail
}

export interface SubmitResponse {
  outcome: 'correct' | 'incorrect' | 'already_completed'
  correct: boolean
  message: string
  pointsAwarded: number
  attempts: number
  challenge: ChallengeDetail
}

export interface ChallengeProgressRow {
  id: string
  title: string
  moduleId: string
  moduleTitle: string
  difficulty: Difficulty
  status: ChallengeStatus
  attempts: number
  hintsUsed: number
  pointsAwarded: number
  basePoints: number
  startedAt: string | null
  completedAt: string | null
}

export interface ProgressResponse {
  totals: DashboardResponse['totals'] & { attempts: number; hintsUsed: number; started: number }
  modules: (ModuleSummary & { completedAt: string | null })[]
  challenges: ChallengeProgressRow[]
  recentActivity: ActivityItem[]
  activityTotal: number
}

export interface ActivityPage {
  items: ActivityItem[]
  total: number
  limit: number
  offset: number
}

export interface ResetResponse {
  deleted: { progressRows: number; activityRows: number }
  progress: ProgressResponse
}
