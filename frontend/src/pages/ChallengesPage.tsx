import { useState } from 'react'
import { getChallenges } from '../api/endpoints'
import type { ChallengeStatus } from '../api/types'
import { ChallengeCard } from '../components/content/ChallengeCard'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

type Filter = 'all' | ChallengeStatus
const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'not_started', label: 'Not started' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
]

export function ChallengesPage() {
  const challenges = useApi(getChallenges)
  useDocumentTitle('Challenges')
  const [filter, setFilter] = useState<Filter>('all')
  const all = challenges.status === 'success' ? challenges.data.challenges : []
  const count = (id: Filter) => (id === 'all' ? all.length : all.filter((challenge) => challenge.status === id).length)

  return (
    <>
      <PageHeader
        eyebrow="Challenges"
        title="Practice challenges"
        description="Every challenge in the course, in the recommended order. Each one is a short, realistic scenario you solve step by step."
      />
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === item.id ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-ink hover:border-indigo-400 hover:bg-indigo-50'
            }`}
          >
            {item.label}
            {challenges.status === 'success' && (
              <span className={`rounded-full px-1.5 text-xs ${filter === item.id ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-700'}`}>{count(item.id)}</span>
            )}
          </button>
        ))}
      </div>
      {challenges.status === 'loading' && <LoadingState label="Loading challenges…" />}
      {challenges.status === 'error' && <ErrorState message={challenges.error} onRetry={challenges.reload} />}
      {challenges.status === 'success' &&
        (() => {
          const visible = all.filter((challenge) => filter === 'all' || challenge.status === filter)
          if (visible.length === 0) {
            return <EmptyState title={all.length === 0 ? 'No challenges available' : 'No challenges match this filter'} />
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
