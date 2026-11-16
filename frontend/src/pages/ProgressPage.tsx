import { CheckCircle2, History, Layers, Lightbulb, ListChecks, Loader2, Percent, Target, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getActivity, getProgress } from '../api/endpoints'
import type { ActivityItem, ProgressResponse } from '../api/types'
import { ActivityList } from '../components/content/ActivityList'
import { ResetProgressPanel } from '../components/content/ResetProgressPanel'
import { DifficultyBadge, StatusBadge } from '../components/ui/Badges'
import { Card } from '../components/ui/Card'
import { ModuleIcon } from '../components/ui/ModuleIcon'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDateTime } from '../utils/format'
import { moduleTheme } from '../utils/moduleTheme'
import { secondaryButton } from '../utils/styles'

const PAGE_SIZE = 20

/** Full activity history: starts with the newest entries and loads older ones on request. */
function ActivityHistory({ initial, total }: { initial: ActivityItem[]; total: number }) {
  const [items, setItems] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMore() {
    setBusy(true)
    setError(null)
    try {
      const page = await getActivity(PAGE_SIZE, items.length)
      setItems((current) => [...current, ...page.items])
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not load more activity.')
    } finally {
      setBusy(false)
    }
  }

  if (total === 0) return <EmptyState title="No activity yet">Hints you reveal, answers you submit and challenges you complete are recorded here.</EmptyState>
  return (
    <>
      {/* Long histories scroll inside the card so the page layout stays balanced. tabIndex lets keyboard users scroll it. */}
      <div className="max-h-[28rem] overflow-y-auto pr-1" tabIndex={0} aria-label="Activity entries">
        <ActivityList items={items} showModule />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
        <span>
          Showing {items.length} of {total}
        </span>
        {items.length < total && (
          <button type="button" onClick={loadMore} disabled={busy} className={`${secondaryButton} px-3 py-1.5 text-sm`}>
            {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />} Load older activity
          </button>
        )}
        {error && <span className="font-medium text-rose-800">{error}</span>}
      </div>
    </>
  )
}

function ProgressContent({ data }: { data: ProgressResponse }) {
  const { totals } = data
  return (
    <>
      <section aria-label="Progress summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <StatCard label="Completed" value={`${totals.completed}/${totals.challenges}`} icon={CheckCircle2} tone="emerald" note={`${totals.started} started`} />
        <StatCard label="Completion" value={`${totals.completionPercent}%`} icon={Percent} tone="indigo" />
        <StatCard label="Points" value={totals.points} icon={Trophy} tone="amber" note={`of ${totals.possiblePoints} possible`} />
        <StatCard label="Attempts" value={totals.attempts} icon={Target} tone="sky" note="Answers submitted" />
        <StatCard label="Hints used" value={totals.hintsUsed} icon={Lightbulb} tone="slate" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Modules" icon={Layers} id="modules-heading" className="lg:col-span-2">
          <ul className="flex flex-col gap-4">
            {data.modules.map((module) => (
              <li key={module.id} className="flex items-center gap-4">
                <ModuleIcon moduleId={module.id} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Link to={`/modules/${module.id}`} className="font-semibold text-ink hover:text-indigo-700 hover:underline">
                        {module.title}
                      </Link>
                      <StatusBadge status={module.status} />
                    </span>
                    <span className="text-muted">
                      {module.completedChallenges}/{module.totalChallenges} · {module.pointsEarned}/{module.pointsPossible} pts
                      {module.completedAt && ` · finished ${formatDateTime(module.completedAt)}`}
                    </span>
                  </div>
                  <ProgressBar value={module.completedChallenges} max={module.totalChallenges} label={`${module.title} progress`} fill={moduleTheme(module.id).bar} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Activity history" icon={History} tone="slate" id="activity-heading">
          <ActivityHistory initial={data.recentActivity} total={data.activityTotal} />
        </Card>
      </div>

      <Card title="Challenges" icon={ListChecks} tone="sky" id="challenges-heading" className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-muted uppercase">
              <tr>
                <th scope="col" className="rounded-l-lg px-3 py-2.5">Challenge</th>
                <th scope="col" className="px-3 py-2.5">Status</th>
                <th scope="col" className="px-3 py-2.5 text-right">Attempts</th>
                <th scope="col" className="px-3 py-2.5 text-right">Hints</th>
                <th scope="col" className="px-3 py-2.5 text-right">Points</th>
                <th scope="col" className="rounded-r-lg px-3 py-2.5">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.challenges.map((challenge) => (
                <tr key={challenge.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3">
                    <Link to={`/challenges/${challenge.id}`} className="font-semibold text-ink hover:text-indigo-700 hover:underline">
                      {challenge.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                      {challenge.moduleTitle} <DifficultyBadge difficulty={challenge.difficulty} />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={challenge.status} />
                  </td>
                  <td className="px-3 py-3 text-right text-ink">{challenge.attempts}</td>
                  <td className="px-3 py-3 text-right text-ink">{challenge.hintsUsed}</td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">
                    {challenge.pointsAwarded}/{challenge.basePoints}
                  </td>
                  <td className="px-3 py-3 text-muted">{challenge.completedAt ? formatDateTime(challenge.completedAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

export function ProgressPage() {
  const [version, setVersion] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const progress = useApi(getProgress, String(version))
  useDocumentTitle('Progress')

  return (
    <>
      <PageHeader eyebrow="Progress" title="Your learning progress" description="Everything you have done in CyberLab so far: what you completed, how many hints you used and your full activity history." />
      {notice && (
        <p className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900" role="status">
          <CheckCircle2 className="size-5" aria-hidden="true" /> {notice}
        </p>
      )}
      {progress.status === 'loading' && <LoadingState label="Loading progress…" />}
      {progress.status === 'error' && <ErrorState message={progress.error} onRetry={progress.reload} />}
      {progress.status === 'success' && <ProgressContent key={version} data={progress.data} />}
      {/* Offering a reset makes no sense while the server cannot even be reached. */}
      {progress.status !== 'error' && (
        <div className="mt-8">
          <ResetProgressPanel
            onReset={(message) => {
              setNotice(message)
              setVersion((value) => value + 1)
            }}
          />
        </div>
      )}
    </>
  )
}
