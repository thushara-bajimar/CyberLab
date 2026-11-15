import { ChevronLeft, Target } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getModule } from '../api/endpoints'
import { ChallengeCard } from '../components/content/ChallengeCard'
import { DifficultyBadge, StatusBadge } from '../components/ui/Badges'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'

export function ModuleDetailPage() {
  const { moduleId = '' } = useParams()
  const module = useApi(() => getModule(moduleId), moduleId)

  if (module.status === 'loading') return <LoadingState label="Loading module…" />
  if (module.status === 'error') {
    return module.notFound ? (
      <NotFoundState what="Module" backTo="/modules" backLabel="Browse all modules" />
    ) : (
      <ErrorState message={module.error} onRetry={module.reload} />
    )
  }

  const data = module.data
  return (
    <>
      <Link to="/modules" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-emerald-300">
        <ChevronLeft className="size-4" aria-hidden="true" /> All modules
      </Link>
      <PageHeader
        eyebrow={`Module ${data.order}`}
        title={data.title}
        description={data.introduction}
        actions={
          <div className="flex items-center gap-3">
            <DifficultyBadge difficulty={data.difficulty} />
            <StatusBadge status={data.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 lg:col-span-2" aria-labelledby="concept-heading">
          <h2 id="concept-heading" className="mb-3 text-sm font-semibold tracking-wide text-slate-300 uppercase">
            Key concepts
          </h2>
          <div className="flex flex-col gap-3 leading-relaxed text-slate-300">
            {data.concept.split('\n\n').map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5" aria-labelledby="objectives-heading">
          <h2 id="objectives-heading" className="mb-3 text-sm font-semibold tracking-wide text-slate-300 uppercase">
            You will learn to
          </h2>
          <ul className="flex flex-col gap-2 text-sm text-slate-300">
            {data.objectives.map((objective) => (
              <li key={objective} className="flex gap-2">
                <Target className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden="true" />
                {objective}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Progress</span>
              <span>
                {data.completedChallenges}/{data.totalChallenges} · {data.pointsEarned}/{data.pointsPossible} pts
              </span>
            </div>
            <ProgressBar value={data.completedChallenges} max={data.totalChallenges} label={`${data.title} progress`} />
          </div>
        </section>
      </div>

      <section className="mt-8" aria-labelledby="challenges-heading">
        <h2 id="challenges-heading" className="mb-3 text-lg font-semibold">
          Challenges
        </h2>
        {data.challenges.length === 0 ? (
          <EmptyState title="No challenges in this module yet" />
        ) : (
          <div className="flex flex-col gap-3">
            {data.challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
