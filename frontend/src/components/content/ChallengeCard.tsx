import { ListChecks, TerminalSquare, Type } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ChallengeSummary } from '../../api/types'
import { DifficultyBadge, StatusBadge } from '../ui/Badges'

const answerLabel = { text: 'Typed answer', choice: 'Multiple choice' } as const

/** One row in a challenge list: title, difficulty, how it is solved, status and points. */
export function ChallengeCard({ challenge, showModule = false }: { challenge: ChallengeSummary; showModule?: boolean }) {
  const AnswerIcon = challenge.answerType === 'choice' ? ListChecks : Type
  return (
    <article className="relative flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {showModule && <p className="text-xs text-slate-500">{challenge.moduleTitle}</p>}
        <h3 className="font-medium text-slate-100">
          <Link to={`/challenges/${challenge.id}`} className="after:absolute after:inset-0 hover:text-emerald-300 focus-visible:outline-none">
            {challenge.title}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <DifficultyBadge difficulty={challenge.difficulty} />
          {challenge.usesTerminal && (
            <span className="inline-flex items-center gap-1">
              <TerminalSquare className="size-3.5" aria-hidden="true" /> Terminal
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <AnswerIcon className="size-3.5" aria-hidden="true" /> {answerLabel[challenge.answerType]}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
        <StatusBadge status={challenge.status} />
        <span className="text-xs text-slate-400">
          {challenge.status === 'completed' ? `${challenge.pointsAwarded} / ${challenge.basePoints} pts earned` : `${challenge.basePoints} pts`}
        </span>
      </div>
    </article>
  )
}
