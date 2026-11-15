import { AppError, notFound } from '../errors.js'
import type { ContentRepository } from '../repositories/contentRepository.js'
import type { ProgressRepository } from '../repositories/progressRepository.js'
import { isCorrect } from './answerChecker.js'
import type { ChallengeDetail, createChallengeService } from './challengeService.js'
import { HINT_PENALTY_RATE, basePoints, pointsAfterHints } from './scoring.js'

export type SubmitOutcome = 'correct' | 'incorrect' | 'already_completed'

export interface SubmitResult {
  outcome: SubmitOutcome
  /** Whether the submitted answer is right (also reported for already-completed challenges, without scoring). */
  correct: boolean
  message: string
  /** Points stored for this challenge (0 until it is completed). */
  pointsAwarded: number
  attempts: number
  challenge: ChallengeDetail
}

export interface HintResult {
  /** false when the hint was already visible (repeat request) or the challenge is completed. */
  revealed: boolean
  challenge: ChallengeDetail
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/**
 * Hint reveals and answer submissions. All scoring happens here, on the server; the client only sends a hint
 * number or an answer string. Each action runs in one transaction, and the SQL updates have guard conditions,
 * so repeated or concurrent requests cannot reveal a hint twice or award points twice.
 */
export function createChallengeActionService(
  content: ContentRepository,
  progress: ProgressRepository,
  challenges: ReturnType<typeof createChallengeService>,
  clock: () => Date = () => new Date(),
) {
  return {
    revealHint(userId: number, challengeId: string, hintNumber: number): HintResult {
      const record = content.getChallenge(challengeId)
      if (!record) throw notFound('Challenge')
      const total = content.countHints(challengeId)
      if (hintNumber > total) throw new AppError(400, 'HINT_NOT_FOUND', `This challenge has ${total} hints.`)

      const revealed = progress.transaction(() => {
        const row = progress.getProgress(userId, challengeId)
        if (row?.status === 'completed') return false // every hint is already visible, free of charge
        const used = row?.hintsUsed ?? 0
        if (hintNumber <= used) return false // repeated request (e.g. a double click): nothing to do
        if (hintNumber > used + 1) throw new AppError(409, 'HINT_ORDER', `Hints are revealed in order: reveal hint ${used + 1} first.`)

        const now = clock().toISOString()
        progress.ensureStarted(userId, challengeId, now)
        if (!progress.incrementHints(userId, challengeId, used)) {
          throw new AppError(409, 'CONFLICT', 'The challenge changed while revealing the hint. Please try again.')
        }
        const cost = basePoints(record.difficulty) * HINT_PENALTY_RATE
        progress.logActivity(userId, challengeId, 'hint_revealed', `Hint ${hintNumber} of ${total} revealed (-${cost} points)`, now)
        return true
      })
      return { revealed, challenge: challenges.getChallenge(userId, challengeId) }
    },

    submitAnswer(userId: number, challengeId: string, answer: string): SubmitResult {
      const record = content.getChallenge(challengeId)
      if (!record) throw notFound('Challenge')
      // Checked before the transaction: an invalid multiple-choice id is a bad request, not an attempt.
      const correct = isCorrect(record.answer, answer)
      const base = basePoints(record.difficulty)

      const result = progress.transaction((): Omit<SubmitResult, 'challenge' | 'correct'> => {
        const existing = progress.getProgress(userId, challengeId)
        if (existing?.status === 'completed') {
          return {
            outcome: 'already_completed',
            message: `You have already completed this challenge and earned ${existing.pointsAwarded} points. Each challenge is scored only once.`,
            pointsAwarded: existing.pointsAwarded,
            attempts: existing.attempts,
          }
        }

        const now = clock().toISOString()
        progress.ensureStarted(userId, challengeId, now)
        const attempts = progress.incrementAttempts(userId, challengeId)
        const hintsUsed = progress.getProgress(userId, challengeId)?.hintsUsed ?? 0

        if (!correct) {
          progress.logActivity(userId, challengeId, 'incorrect_attempt', `Attempt ${attempts} was not correct`, now)
          return {
            outcome: 'incorrect',
            message: 'Not quite. Wrong answers cost no points: review the scenario and instructions, then try again.',
            pointsAwarded: 0,
            attempts,
          }
        }

        const points = pointsAfterHints(record.difficulty, hintsUsed)
        if (!progress.complete(userId, challengeId, points, now)) {
          throw new AppError(409, 'CONFLICT', 'This challenge was completed by another request. Reload the page.')
        }
        progress.logActivity(userId, challengeId, 'completed', `Solved in ${plural(attempts, 'attempt')} with ${plural(hintsUsed, 'hint')}: +${points} points`, now)
        return {
          outcome: 'correct',
          message:
            hintsUsed === 0
              ? `Correct! You earned all ${points} points.`
              : `Correct! You earned ${points} of ${base} points (${plural(hintsUsed, 'hint')} used).`,
          pointsAwarded: points,
          attempts,
        }
      })

      return { ...result, correct, challenge: challenges.getChallenge(userId, challengeId) }
    },
  }
}
