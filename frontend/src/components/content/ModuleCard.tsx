import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ModuleSummary } from '../../api/types'
import { DifficultyBadge, StatusBadge } from '../ui/Badges'
import { ProgressBar } from '../ui/ProgressBar'

export function ModuleCard({ module }: { module: ModuleSummary }) {
  return (
    <article className="flex flex-col rounded-lg border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-slate-400">Module {module.order}</span>
        <DifficultyBadge difficulty={module.difficulty} />
      </div>
      <h2 className="mt-2 text-lg font-semibold text-slate-50">
        <Link to={`/modules/${module.id}`} className="after:absolute after:inset-0 hover:text-emerald-300 focus-visible:outline-none">
          {module.title}
        </Link>
      </h2>
      <p className="mt-1 flex-1 text-sm text-slate-400">{module.summary}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <StatusBadge status={module.status} />
        <span>
          {module.completedChallenges}/{module.totalChallenges} challenges · {module.pointsEarned}/{module.pointsPossible} pts
        </span>
      </div>
      <div className="mt-2">
        <ProgressBar value={module.completedChallenges} max={module.totalChallenges} label={`${module.title} progress`} />
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-300" aria-hidden="true">
        Open module <ArrowRight className="size-4" />
      </span>
    </article>
  )
}
