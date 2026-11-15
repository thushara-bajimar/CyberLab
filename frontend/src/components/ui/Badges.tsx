import { CheckCircle2, Circle, CircleDot } from 'lucide-react'
import type { ChallengeStatus, Difficulty } from '../../api/types'
import { difficultyLabel, statusLabel } from '../../utils/format'

const difficultyStyle: Record<Difficulty, string> = {
  beginner: 'border-emerald-700/60 bg-emerald-950/60 text-emerald-300',
  intermediate: 'border-amber-700/60 bg-amber-950/60 text-amber-300',
  advanced: 'border-rose-700/60 bg-rose-950/60 text-rose-300',
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${difficultyStyle[difficulty]}`}>
      {difficultyLabel[difficulty]}
    </span>
  )
}

const statusStyle: Record<ChallengeStatus, string> = {
  not_started: 'text-slate-400',
  in_progress: 'text-sky-300',
  completed: 'text-emerald-300',
}

const statusIcon: Record<ChallengeStatus, typeof Circle> = {
  not_started: Circle,
  in_progress: CircleDot,
  completed: CheckCircle2,
}

export function StatusBadge({ status }: { status: ChallengeStatus }) {
  const Icon = statusIcon[status]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusStyle[status]}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {statusLabel[status]}
    </span>
  )
}
