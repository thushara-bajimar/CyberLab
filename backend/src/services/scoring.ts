import type { Difficulty } from '../content/types.js'

/**
 * Scoring policy (documented in README and docs/PLAN.md):
 *   base points    = 100 beginner | 200 intermediate | 300 advanced
 *   hint penalty   = 10% of base for each hint revealed before the challenge is completed
 *   points awarded = base - hintsUsed x 10% x base, computed once on the first correct answer
 * Wrong answers cost nothing.
 */
export const BASE_POINTS: Record<Difficulty, number> = { beginner: 100, intermediate: 200, advanced: 300 }
export const HINT_PENALTY_RATE = 0.1
export const MAX_HINTS = 3

export function basePoints(difficulty: Difficulty): number {
  return BASE_POINTS[difficulty]
}

/** Points the learner would receive if they answered correctly now, after `hintsUsed` hints. */
export function pointsAfterHints(difficulty: Difficulty, hintsUsed: number): number {
  if (!Number.isInteger(hintsUsed) || hintsUsed < 0 || hintsUsed > MAX_HINTS) {
    throw new RangeError(`hintsUsed must be an integer between 0 and ${MAX_HINTS}.`)
  }
  const base = basePoints(difficulty)
  return Math.round(base - hintsUsed * HINT_PENALTY_RATE * base)
}
