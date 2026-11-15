import type { ActivityType, ChallengeStatus, Difficulty } from '../api/types'

export const difficultyLabel: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export const statusLabel: Record<ChallengeStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
}

export const activityLabel: Record<ActivityType, string> = {
  hint_revealed: 'Revealed a hint',
  incorrect_attempt: 'Incorrect attempt',
  completed: 'Completed',
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const steps: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.35],
  ['month', 12],
  ['year', Number.POSITIVE_INFINITY],
]

/** "3 minutes ago", "yesterday", ... */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const time = Date.parse(iso)
  if (Number.isNaN(time)) return iso
  let value = (time - now.getTime()) / 1000
  for (const [unit, size] of steps) {
    if (Math.abs(value) < size) return relative.format(Math.round(value), unit)
    value /= size
  }
  return iso
}

export const formatDateTime = (iso: string) =>
  Number.isNaN(Date.parse(iso)) ? iso : new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
