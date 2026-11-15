import { CheckCircle2, Lightbulb, Loader2, Percent, RotateCcw, Target, Trophy } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getActivity, getProgress } from '../api/endpoints'
import type { ActivityItem, ProgressResponse } from '../api/types'
import { ActivityList } from '../components/content/ActivityList'
import { ResetProgressPanel } from '../components/content/ResetProgressPanel'
import { DifficultyBadge, StatusBadge } from '../components/ui/Badges'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { formatDateTime } from '../utils/format'

const PAGE_SIZE = 20

function Section({ title, children, id }: { title: string; children: ReactNode; id: string }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5" aria-labelledby={id}>
      <h2 id={id} className="mb-4 text-sm font-semibold tracking-wide text-slate-300 uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

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
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
        <span>
          Showing {items.length} of {total}
        </span>
        {items.length < total && (
          <button type="button" onClick={loadMore} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1 text-slate-200 hover:bg-slate-800">
            {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />} Load older activity
          </button>
        )}
        {error && <span className="text-rose-400">{error}</span>}
      </div>
    </>
  )
}

function ProgressContent({ data }: { data: ProgressResponse }) {
  const { totals } = data
  return (
    <>
      <section aria-label="Progress summary" className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Completed" value={`${totals.completed}/${totals.challenges}`} icon={CheckCircle2} note={`${totals.started} started`} />
        <StatCard label="Completion" value={`${totals.completionPercent}%`} icon={Percent} />
        <StatCard label="Points" value={totals.points} icon={Trophy} note={`of ${totals.possiblePoints} possible`} />
        <StatCard label="Attempts" value={totals.attempts} icon={Target} note="Answers submitted" />
        <StatCard label="Hints used" value={totals.hintsUsed} icon={Lightbulb} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Modules" id="modules-heading">
            <ul className="flex flex-col gap-4">
              {data.modules.map((module) => (
                <li key={module.id}>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Link to={`/modules/${module.id}`} className="font-medium text-slate-200 hover:text-emerald-300">
                        {module.title}
                      </Link>
                      <StatusBadge status={module.status} />
                    </span>
                    <span className="text-slate-400">
                      {module.completedChallenges}/{module.totalChallenges} · {module.pointsEarned}/{module.pointsPossible} pts
                      {module.completedAt && ` · finished ${formatDateTime(module.completedAt)}`}
                    </span>
                  </div>
                  <ProgressBar value={module.completedChallenges} max={module.totalChallenges} label={`${module.title} progress`} />
                </li>
              ))}
            </ul>
          </Section>
        </div>
        <Section title="Activity history" id="activity-heading">
          <ActivityHistory initial={data.recentActivity} total={data.activityTotal} />
        </Section>
      </div>

      <div className="mt-6">
        <Section title="Challenges" id="challenges-heading">
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="border-b border-slate-800 text-xs text-slate-400 uppercase">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">Challenge</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Attempts</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Hints</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Points</th>
                  <th scope="col" className="py-2 font-medium">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {data.challenges.map((challenge) => (
                  <tr key={challenge.id}>
                    <td className="py-2 pr-3">
                      <Link to={`/challenges/${challenge.id}`} className="text-slate-100 hover:text-emerald-300">
                        {challenge.title}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        {challenge.moduleTitle} <DifficultyBadge difficulty={challenge.difficulty} />
                      </div>
                    </td>
                    <td className="py-2 pr-3">
                      <StatusBadge status={challenge.status} />
                    </td>
                    <td className="py-2 pr-3 text-right text-slate-300">{challenge.attempts}</td>
                    <td className="py-2 pr-3 text-right text-slate-300">{challenge.hintsUsed}</td>
                    <td className="py-2 pr-3 text-right text-slate-300">
                      {challenge.pointsAwarded}/{challenge.basePoints}
                    </td>
                    <td className="py-2 text-slate-400">{challenge.completedAt ? formatDateTime(challenge.completedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </>
  )
}

export function ProgressPage() {
  const [version, setVersion] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const progress = useApi(getProgress, String(version))

  return (
    <>
      <PageHeader eyebrow="Progress" title="Your learning progress" description="Everything recorded about your work in CyberLab, computed from the database." />
      {notice && (
        <p className="mb-6 flex items-center gap-2 rounded-md border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200" role="status">
          <RotateCcw className="size-4" aria-hidden="true" /> {notice}
        </p>
      )}
      {progress.status === 'loading' && <LoadingState label="Loading progress…" />}
      {progress.status === 'error' && <ErrorState message={progress.error} onRetry={progress.reload} />}
      {progress.status === 'success' && <ProgressContent key={version} data={progress.data} />}
      <div className="mt-8">
        <ResetProgressPanel
          onReset={(message) => {
            setNotice(message)
            setVersion((value) => value + 1)
          }}
        />
      </div>
    </>
  )
}
