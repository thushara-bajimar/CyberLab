import { ArrowRight, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ModuleSummary } from '../../api/types'
import { moduleTheme } from '../../utils/moduleTheme'
import { DifficultyBadge, StatusBadge } from '../ui/Badges'
import { ModuleIcon } from '../ui/ModuleIcon'
import { ProgressBar } from '../ui/ProgressBar'

const callToAction = { not_started: 'Start module', in_progress: 'Continue', completed: 'Review' } as const

export function ModuleCard({ module }: { module: ModuleSummary }) {
  return (
    <article className="relative flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent-line hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <ModuleIcon moduleId={module.id} size="lg" />
        <StatusBadge status={module.status} />
      </div>
      <p className="mt-4 text-sm font-semibold text-muted">Module {module.order}</p>
      <h2 className="mt-0.5 text-xl font-bold text-ink">
        {/* The link covers the whole card, so anywhere on the card opens the module. */}
        <Link to={`/modules/${module.id}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-accent">
          {module.title}
        </Link>
      </h2>
      <p className="mt-2 flex-1 leading-relaxed text-muted">{module.summary}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted">
        <DifficultyBadge difficulty={module.difficulty} />
        <span>{module.totalChallenges} challenges</span>
        <span className="inline-flex items-center gap-1">
          <Trophy className="size-3.5 text-warning-icon" aria-hidden="true" />
          {module.pointsEarned}/{module.pointsPossible} pts
        </span>
      </div>
      <div className="mt-3">
        <ProgressBar value={module.completedChallenges} max={module.totalChallenges} label={`${module.title} progress`} fill={moduleTheme(module.id).bar} />
      </div>
      <span className="mt-5 inline-flex items-center gap-1 font-semibold text-accent-ink" aria-hidden="true">
        {callToAction[module.status]} <ArrowRight className="size-4" />
      </span>
    </article>
  )
}
