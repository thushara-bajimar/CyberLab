import { useState } from 'react'
import { getChallenges } from '../api/endpoints'
import type { ChallengeStatus } from '../api/types'
import { ChallengeCard } from '../components/content/ChallengeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'

type Filter = 'all' | ChallengeStatus
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'not_started', label: 'Not started' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
]

export function ChallengesPage() {
  const challenges = useApi(getChallenges)
  const [filter, setFilter] = useState<Filter>('all')

  return (
    <>
      <PageHeader eyebrow="Challenges" title="All challenges" description="Every challenge in the course, in the recommended learning order." />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === item.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 text-slate-400 hover:text-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {challenges.status === 'loading' && <LoadingState label="Loading challenges…" />}
      {challenges.status === 'error' && <ErrorState message={challenges.error} onRetry={challenges.reload} />}
      {challenges.status === 'success' &&
        (() => {
          const visible = challenges.data.challenges.filter((challenge) => filter === 'all' || challenge.status === filter)
          if (visible.length === 0) {
            return <EmptyState title={challenges.data.challenges.length === 0 ? 'No challenges available' : 'No challenges match this filter'} />
          }
          return (
            <div className="flex flex-col gap-3">
              {visible.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} showModule />
              ))}
            </div>
          )
        })()}
    </>
  )
}
