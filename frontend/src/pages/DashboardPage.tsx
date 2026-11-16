import { ArrowRight, CheckCircle2, Clock, History, Map as MapIcon, Percent, PartyPopper, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/endpoints'
import type { DashboardResponse } from '../api/types'
import { ActivityList } from '../components/content/ActivityList'
import { DifficultyBadge } from '../components/ui/Badges'
import { Card } from '../components/ui/Card'
import { ModuleIcon } from '../components/ui/ModuleIcon'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { moduleTheme } from '../utils/moduleTheme'
import { primaryButton } from '../utils/styles'

/** A short, honest encouragement based on real progress. */
function encouragement(completed: number, total: number): string {
  if (total === 0) return 'The course content has not been loaded yet.'
  if (completed === 0) return 'Every security expert started at zero. Pick your first challenge and learn by doing.'
  if (completed === total) return 'You have completed every challenge. Amazing work!'
  if (completed / total >= 0.5) return 'You are more than halfway there. Keep going!'
  return 'Nice progress. Every challenge teaches a skill real security teams use.'
}

function UpNext({ recommended, allDone }: { recommended: DashboardResponse['recommended']; allDone: boolean }) {
  if (!recommended) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-6 text-center text-ink shadow-lg">
        <PartyPopper className="size-8 text-indigo-600" aria-hidden="true" />
        <p className="font-semibold">{allDone ? 'Every challenge is complete' : 'No challenge to recommend yet'}</p>
        <p className="text-sm text-muted">{allDone ? 'Review any challenge to revisit its explanation.' : 'Challenges appear once course content is loaded.'}</p>
      </div>
    )
  }
  return (
    <div className="rounded-2xl bg-white p-5 text-ink shadow-lg sm:p-6">
      <p className="text-sm font-semibold text-indigo-700">{recommended.reason === 'continue' ? 'Pick up where you left off' : 'Up next'}</p>
      <div className="mt-3 flex items-start gap-3">
        <ModuleIcon moduleId={recommended.moduleId} />
        <div>
          <h2 className="text-lg font-bold">{recommended.title}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>{recommended.moduleTitle}</span>
            <DifficultyBadge difficulty={recommended.difficulty} />
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800">
          <Trophy className="size-4" aria-hidden="true" /> {recommended.points} points available
        </span>
        <Link to={`/challenges/${recommended.challengeId}`} className={primaryButton}>
          {recommended.reason === 'continue' ? 'Continue' : 'Start challenge'} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const dashboard = useApi(getDashboard)
  useDocumentTitle('Dashboard')

  if (dashboard.status === 'loading') return <LoadingState label="Loading your dashboard…" />
  if (dashboard.status === 'error') return <ErrorState message={dashboard.error} onRetry={dashboard.reload} />

  const { learner, totals, modules, recentActivity, recommended } = dashboard.data
  return (
    <>
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-md sm:p-8" aria-labelledby="welcome-heading">
        <div className="grid items-center gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="text-sm font-semibold text-indigo-100">Dashboard</p>
            <h1 id="welcome-heading" className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome, {learner.displayName}!
            </h1>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-indigo-50">{encouragement(totals.completed, totals.challenges)}</p>
            <div className="mt-6 max-w-xl">
              <div className="mb-2 flex justify-between text-sm font-semibold">
                <span>
                  {totals.completed} of {totals.challenges} challenges completed
                </span>
                <span>{totals.completionPercent}%</span>
              </div>
              <ProgressBar value={totals.completed} max={totals.challenges} label="Course progress" fill="bg-white" track="bg-white/25" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <UpNext recommended={recommended} allDone={totals.challenges > 0 && totals.pending === 0} />
          </div>
        </div>
      </section>

      <section aria-label="Your statistics" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Completed" value={`${totals.completed}/${totals.challenges}`} icon={CheckCircle2} tone="emerald" note="Challenges solved" />
        <StatCard label="Points" value={totals.points} icon={Trophy} tone="amber" note={`of ${totals.possiblePoints} possible`} />
        <StatCard label="Still to do" value={totals.pending} icon={Clock} tone="sky" note="Challenges remaining" />
        <StatCard label="Completion" value={`${totals.completionPercent}%`} icon={Percent} tone="indigo" note="Of the whole course" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Your learning path" icon={MapIcon} id="path-heading" className="lg:col-span-2" action={
          <Link to="/modules" className="text-sm font-semibold text-indigo-700 hover:underline">All modules</Link>
        }>
          {modules.length === 0 ? (
            <EmptyState title="No modules yet">Modules appear here once course content is loaded.</EmptyState>
          ) : (
            <ol className="flex flex-col gap-3">
              {modules.map((module) => (
                <li key={module.id}>
                  <Link to={`/modules/${module.id}`} className="flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-slate-50">
                    <ModuleIcon moduleId={module.id} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-semibold text-ink">{module.title}</span>
                        <span className="shrink-0 text-muted">
                          {module.completedChallenges} of {module.totalChallenges}
                        </span>
                      </div>
                      <ProgressBar value={module.completedChallenges} max={module.totalChallenges} label={`${module.title} progress`} fill={moduleTheme(module.id).bar} />
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Recent activity" icon={History} tone="slate" id="activity-heading">
          {recentActivity.length === 0 ? (
            <EmptyState title="No activity yet">Hints you reveal, answers you submit and challenges you complete will be listed here.</EmptyState>
          ) : (
            <>
              <ActivityList items={recentActivity} />
              <Link to="/progress" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline">
                View full progress <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
