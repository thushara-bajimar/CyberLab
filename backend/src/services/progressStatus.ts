import type { ProgressRecord } from '../repositories/progressRepository.js'

/** A challenge with no progress row has not been started; the API exposes all three states. */
export type ChallengeStatus = 'not_started' | 'in_progress' | 'completed'

export function statusOf(progress: ProgressRecord | null | undefined): ChallengeStatus {
  return progress?.status ?? 'not_started'
}

export function progressByChallenge(rows: ProgressRecord[]): Map<string, ProgressRecord> {
  return new Map(rows.map((row) => [row.challengeId, row]))
}
