import type { DB } from '../db/connection.js'
import type { AnswerRule, ChoiceOption, Difficulty, Explanation, Resource } from '../content/types.js'

/** Content read back from SQLite. JSON columns are parsed here so callers get typed objects. */
export interface ModuleRecord {
  id: string
  title: string
  summary: string
  introduction: string
  concept: string
  objectives: string[]
  difficulty: Difficulty
  sortOrder: number
}

export interface ChallengeSummaryRecord {
  id: string
  moduleId: string
  moduleTitle: string
  title: string
  difficulty: Difficulty
  answerType: 'text' | 'choice'
  terminalEnv: string | null
  sortOrder: number
  moduleSortOrder: number
}

export interface ChallengeRecord extends ChallengeSummaryRecord {
  scenario: string
  objective: string
  instructions: string[]
  resources: Resource[]
  /** Public choice options (null for text answers). */
  options: ChoiceOption[] | null
  /** Server-only. */
  answer: AnswerRule
  explanation: Explanation
}

export interface HintRecord {
  number: number
  text: string
}

interface ModuleRow {
  id: string
  title: string
  summary: string
  introduction: string
  concept: string
  objectives_json: string
  difficulty: Difficulty
  sort_order: number
}

interface ChallengeRow {
  id: string
  module_id: string
  module_title: string
  title: string
  difficulty: Difficulty
  answer_type: 'text' | 'choice'
  terminal_env: string | null
  sort_order: number
  module_sort_order: number
  scenario: string
  objective: string
  instructions_json: string
  resources_json: string
  options_json: string | null
  answer_json: string
  explanation_json: string
}

const toModule = (row: ModuleRow): ModuleRecord => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  introduction: row.introduction,
  concept: row.concept,
  objectives: JSON.parse(row.objectives_json) as string[],
  difficulty: row.difficulty,
  sortOrder: row.sort_order,
})

const toSummary = (row: ChallengeRow): ChallengeSummaryRecord => ({
  id: row.id,
  moduleId: row.module_id,
  moduleTitle: row.module_title,
  title: row.title,
  difficulty: row.difficulty,
  answerType: row.answer_type,
  terminalEnv: row.terminal_env,
  sortOrder: row.sort_order,
  moduleSortOrder: row.module_sort_order,
})

const CHALLENGE_SELECT = `
  SELECT c.*, m.title AS module_title, m.sort_order AS module_sort_order
  FROM challenges c JOIN modules m ON m.id = c.module_id`

export function createContentRepository(db: DB) {
  return {
    listModules(): ModuleRecord[] {
      return (db.prepare('SELECT * FROM modules ORDER BY sort_order').all() as ModuleRow[]).map(toModule)
    },

    getModule(id: string): ModuleRecord | null {
      const row = db.prepare('SELECT * FROM modules WHERE id = ?').get(id) as ModuleRow | undefined
      return row ? toModule(row) : null
    },

    /** All challenges in learning order (module order, then challenge order), optionally for one module. */
    listChallenges(moduleId?: string): ChallengeSummaryRecord[] {
      const rows = moduleId
        ? db.prepare(`${CHALLENGE_SELECT} WHERE c.module_id = ? ORDER BY m.sort_order, c.sort_order`).all(moduleId)
        : db.prepare(`${CHALLENGE_SELECT} ORDER BY m.sort_order, c.sort_order`).all()
      return (rows as ChallengeRow[]).map(toSummary)
    },

    getChallenge(id: string): ChallengeRecord | null {
      const row = db.prepare(`${CHALLENGE_SELECT} WHERE c.id = ?`).get(id) as ChallengeRow | undefined
      if (!row) return null
      return {
        ...toSummary(row),
        scenario: row.scenario,
        objective: row.objective,
        instructions: JSON.parse(row.instructions_json) as string[],
        resources: JSON.parse(row.resources_json) as Resource[],
        options: row.options_json ? (JSON.parse(row.options_json) as ChoiceOption[]) : null,
        answer: JSON.parse(row.answer_json) as AnswerRule,
        explanation: JSON.parse(row.explanation_json) as Explanation,
      }
    },

    countHints(challengeId: string): number {
      const row = db.prepare('SELECT COUNT(*) AS count FROM challenge_hints WHERE challenge_id = ?').get(challengeId) as { count: number }
      return row.count
    },

    /** Hints 1..upTo only: unrevealed hints are never read for a response. */
    getHints(challengeId: string, upTo: number): HintRecord[] {
      return db
        .prepare('SELECT hint_number AS number, text FROM challenge_hints WHERE challenge_id = ? AND hint_number <= ? ORDER BY hint_number')
        .all(challengeId, upTo) as HintRecord[]
    },
  }
}

export type ContentRepository = ReturnType<typeof createContentRepository>
