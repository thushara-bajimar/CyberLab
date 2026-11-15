import { ArrowRight, CheckCircle2, Clock, Layers, Percent, Trophy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/endpoints'
import type { DashboardResponse } from '../api/types'
import { ActivityList } from '../components/content/ActivityList'
import { DifficultyBadge } from '../components/ui/Badges'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'

function Recommended({ recommended, allDone }: { recommended: DashboardResponse['recommended']; allDone: boolean }) {
  if (!recommended) {
    return (
      <EmptyState title={allDone ? 'Every challenge is complete' : 'No challenge to recommend yet'}>
        {allDone ? 'You have finished all available challenges. Great work!' : 'Challenges appear here once course content is loaded.'}
      </EmptyState>
    )
  }
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs text-slate-400">{recommended.reason === 'continue' ? 'Pick up where you left off' : 'Next in your learning path'}</p>
        <h3 className="mt-1 text-lg font-semibold text-slate-50">{recommended.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <span>{recommended.moduleTitle}</span>
          <DifficultyBadge difficulty={recommended.difficulty} />
          <span>{recommended.points} points available</span>
        </div>
      </div>
      <Link
        to={`/challenges/${recommended.challengeId}`}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400"
      >
        {recommended.reason === 'continue' ? 'Continue' : 'Start challenge'} <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-300 uppercase">{title}</h2>
      {children}
    </section>
  )
}

export function DashboardPage() {
  const dashboard = useApi(getDashboard)

  if (dashboard.status === 'loading') return <LoadingState label="Loading your dashboard…" />
  if (dashboard.status === 'error') return <ErrorState message={dashboard.error} onRetry={dashboard.reload} />

  const { learner, totals, modules, recentActivity, recommended } = dashboard.data
  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome, ${learner.displayName}`}
        description="Learn cybersecurity by doing: pick a challenge, explore the simulated environment, and check your answer."
      />

      <section aria-label="Your statistics" className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Challenges" value={totals.challenges} icon={Layers} note="Available in the course" />
        <StatCard label="Completed" value={totals.completed} icon={CheckCircle2} />
        <StatCard label="Pending" value={totals.pending} icon={Clock} />
        <StatCard label="Points" value={totals.points} icon={Trophy} note={`of ${totals.possiblePoints} possible`} />
        <StatCard label="Completion" value={`${totals.completionPercent}%`} icon={Percent} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Section title="Recommended next">
            <Recommended recommended={recommended} allDone={totals.challenges > 0 && totals.pending === 0} />
          </Section>
          <Section title="Learning progress">
            {modules.length === 0 ? (
              <EmptyState title="No modules yet">Modules appear here once course content is loaded.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-4">
                {modules.map((module) => (
                  <li key={module.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <Link to={`/modules/${module.id}`} className="font-medium text-slate-200 hover:text-emerald-300">
                        {module.title}
                      </Link>
                      <span className="text-slate-400">
                        {module.completedChallenges} / {module.totalChallenges}
                      </span>
                    </div>
                    <ProgressBar value={module.completedChallenges} max={module.totalChallenges} label={`${module.title} progress`} />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <Section title="Recent activity">
          {recentActivity.length === 0 ? (
            <EmptyState title="No activity yet">Hints you reveal, answers you submit and challenges you complete will be listed here.</EmptyState>
          ) : (
            <>
              <ActivityList items={recentActivity} />
              <Link to="/progress" className="mt-4 inline-flex items-center gap-1 text-sm text-emerald-300 hover:underline">
                View full progress <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </>
          )}
        </Section>
      </div>
    </>
  )
}
