import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import type { ChallengeStatus, Difficulty } from '../../api/types'
import { difficultyLabel, statusLabel } from '../../utils/format'

const difficultyStyle: Record<Difficulty, string> = {
  beginner: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  intermediate: 'bg-amber-50 text-amber-900 ring-amber-200',
  advanced: 'bg-rose-50 text-rose-800 ring-rose-200',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${difficultyStyle[difficulty]}`}>
      {difficultyLabel[difficulty]}
    </span>
  )
}

const statusStyle: Record<ChallengeStatus, string> = {
  not_started: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-sky-50 text-sky-800',
  completed: 'bg-emerald-50 text-emerald-800',
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
