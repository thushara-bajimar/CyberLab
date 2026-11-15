import { findEnvironment } from '../content/environments.js'
import type { ChoiceOption, Difficulty, Explanation, Resource } from '../content/types.js'
import { notFound } from '../errors.js'
import type { ChallengeSummaryRecord, ContentRepository, HintRecord } from '../repositories/contentRepository.js'
import type { ProgressRecord, ProgressRepository } from '../repositories/progressRepository.js'
import { progressByChallenge, statusOf, type ChallengeStatus } from './progressStatus.js'
import { HINT_PENALTY_RATE, basePoints, pointsAfterHints } from './scoring.js'

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

/** Public view of one challenge. It never contains the answer rules. */
export interface ChallengeDetail extends ChallengeSummary {
  scenario: string
  objective: string
  instructions: string[]
  resources: Resource[]
  /** Choice options for multiple-choice challenges, null for typed answers. */
  options: ChoiceOption[] | null
  terminal: { environmentId: string; title: string; user: string; hostname: string; home: string } | null
  scoring: { basePoints: number; hintPenaltyPercent: number; pointsAvailable: number | null }
  hints: { total: number; used: number; revealed: HintRecord[] }
  progress: {
    status: ChallengeStatus
    attempts: number
    hintsUsed: number
    pointsAwarded: number
    startedAt: string | null
    completedAt: string | null
  }
  /** Only after the challenge is completed, so the solution cannot be read in advance. */
  explanation: Explanation | null
  navigation: { previousId: string | null; nextId: string | null }
}

export function summarizeChallenges(records: ChallengeSummaryRecord[], progress: Map<string, ProgressRecord>): ChallengeSummary[] {
  return records.map((record) => {
    const row = progress.get(record.id)
    return {
      id: record.id,
      moduleId: record.moduleId,
      moduleTitle: record.moduleTitle,
      title: record.title,
      difficulty: record.difficulty,
      answerType: record.answerType,
      usesTerminal: record.terminalEnv !== null,
      basePoints: basePoints(record.difficulty),
      status: statusOf(row),
      pointsAwarded: row?.pointsAwarded ?? 0,
    }
  })
}

export function createChallengeService(content: ContentRepository, progress: ProgressRepository) {
  return {
    listChallenges(userId: number): ChallengeSummary[] {
      return summarizeChallenges(content.listChallenges(), progressByChallenge(progress.listProgress(userId)))
    },

    getChallenge(userId: number, challengeId: string): ChallengeDetail {
      const record = content.getChallenge(challengeId)
      if (!record) throw notFound('Challenge')
      const row = progress.getProgress(userId, challengeId)
      const status = statusOf(row)
      const completed = status === 'completed'
      const hintsUsed = row?.hintsUsed ?? 0
      const totalHints = content.countHints(challengeId)
      const environment = record.terminalEnv ? findEnvironment(record.terminalEnv) : undefined

      const ordered = content.listChallenges()
      const index = ordered.findIndex((challenge) => challenge.id === challengeId)
      const [summary] = summarizeChallenges([record], new Map(row ? [[record.id, row]] : []))

      return {
        ...summary!,
        scenario: record.scenario,
        objective: record.objective,
        instructions: record.instructions,
        resources: record.resources,
        options: record.options,
        terminal: environment
          ? { environmentId: environment.id, title: environment.title, user: environment.user, hostname: environment.hostname, home: environment.home }
          : null,
        scoring: {
          basePoints: basePoints(record.difficulty),
          hintPenaltyPercent: HINT_PENALTY_RATE * 100,
          pointsAvailable: completed ? null : pointsAfterHints(record.difficulty, hintsUsed),
        },
        // After completion every hint is shown for review, at no cost.
        hints: { total: totalHints, used: hintsUsed, revealed: content.getHints(challengeId, completed ? totalHints : hintsUsed) },
        progress: {
          status,
          attempts: row?.attempts ?? 0,
          hintsUsed,
          pointsAwarded: row?.pointsAwarded ?? 0,
          startedAt: row?.startedAt ?? null,
          completedAt: row?.completedAt ?? null,
        },
        explanation: completed ? record.explanation : null,
        navigation: {
          previousId: index > 0 ? (ordered[index - 1]?.id ?? null) : null,
          nextId: index >= 0 ? (ordered[index + 1]?.id ?? null) : null,
        },
      }
    },
  }
}
