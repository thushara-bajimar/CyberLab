import { ChevronRight, ListChecks, SquareTerminal, Trophy, Type } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ChallengeSummary } from '../../api/types'
import { DifficultyBadge, StatusBadge } from '../ui/Badges'
import { ModuleIcon } from '../ui/ModuleIcon'

const answerLabel = { text: 'Typed answer', choice: 'Multiple choice' } as const

/** One row in a challenge list: title, difficulty, how it is solved, status and points. */
export function ChallengeCard({ challenge, number, showModule = false }: { challenge: ChallengeSummary; number?: number; showModule?: boolean }) {
  const AnswerIcon = challenge.answerType === 'choice' ? ListChecks : Type
  return (
    <article className="relative flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md sm:p-5">
      {number !== undefined ? (
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full text-base font-bold ${
            challenge.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-50 text-indigo-700'
          }`}
          aria-hidden="true"
        >
          {number}
        </span>
      ) : (
        <ModuleIcon moduleId={challenge.moduleId} />
      )}
      <div className="min-w-0 flex-1">
        {showModule && <p className="text-sm text-muted">{challenge.moduleTitle}</p>}
        <h3 className="text-lg font-semibold text-ink">
          <Link to={`/challenges/${challenge.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-indigo-500">
            {challenge.title}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700">
          <DifficultyBadge difficulty={challenge.difficulty} />
          {challenge.usesTerminal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5">
              <SquareTerminal className="size-3.5" aria-hidden="true" /> Terminal
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5">
            <AnswerIcon className="size-3.5" aria-hidden="true" /> {answerLabel[challenge.answerType]}
          </span>
        </div>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
        <StatusBadge status={challenge.status} />
        <span className="inline-flex items-center gap-1 text-sm text-muted">
          <Trophy className="size-3.5 text-amber-600" aria-hidden="true" />
          {challenge.status === 'completed' ? `${challenge.pointsAwarded}/${challenge.basePoints} pts` : `${challenge.basePoints} pts`}
        </span>
      </div>
      <div className="sm:hidden">
        <StatusBadge status={challenge.status} />
      </div>
      <ChevronRight className="hidden size-5 shrink-0 text-slate-400 sm:block" aria-hidden="true" />
    </article>
  )
}
