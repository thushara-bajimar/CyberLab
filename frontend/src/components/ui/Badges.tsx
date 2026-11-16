import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import type { ChallengeStatus, Difficulty } from '../../api/types'
import { difficultyLabel, statusLabel } from '../../utils/format'

const difficultyStyle: Record<Difficulty, string> = {
  beginner: 'bg-success-soft text-success-ink ring-success-line',
  intermediate: 'bg-warning-soft text-warning-ink ring-warning-line',
  advanced: 'bg-danger-soft text-danger-ink ring-danger-line',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${difficultyStyle[difficulty]}`}>
      {difficultyLabel[difficulty]}
    </span>
  )
}

const statusStyle: Record<ChallengeStatus, string> = {
  not_started: 'bg-surface-3 text-muted',
  in_progress: 'bg-info-soft text-info-ink',
  completed: 'bg-success-soft text-success-ink',
}

const statusIcon: Record<ChallengeStatus, typeof Circle> = {
  not_started: Circle,
  in_progress: CircleDot,
  completed: CheckCircle2,
}

export function StatusBadge({ status }: { status: ChallengeStatus }) {
  const Icon = statusIcon[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[status]}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {statusLabel[status]}
    </span>
  )
}
