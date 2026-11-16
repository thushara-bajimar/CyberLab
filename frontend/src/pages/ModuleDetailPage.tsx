import { BookOpen, CheckCircle2, ChevronLeft, Swords, Target, Trophy } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getModule } from '../api/endpoints'
import { ChallengeCard } from '../components/content/ChallengeCard'
import { DifficultyBadge, StatusBadge } from '../components/ui/Badges'
import { Card } from '../components/ui/Card'
import { ModuleIcon } from '../components/ui/ModuleIcon'
import { PageHeader } from '../components/ui/PageHeader'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState, ErrorState, LoadingState, NotFoundState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { moduleTheme } from '../utils/moduleTheme'

export function ModuleDetailPage() {
  const { moduleId = '' } = useParams()
  const module = useApi(() => getModule(moduleId), moduleId)
  useDocumentTitle(module.status === 'success' ? module.data.title : module.notFound ? 'Module not found' : null)

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
      <Link to="/modules" className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline">
        <ChevronLeft className="size-4" aria-hidden="true" /> All modules
      </Link>
      <PageHeader
        icon={<ModuleIcon moduleId={data.id} size="lg" />}
        eyebrow={`Module ${data.order}`}
        title={data.title}
        description={data.introduction}
        actions={
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={data.difficulty} />
            <StatusBadge status={data.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Key ideas" icon={BookOpen} id="concept-heading" className="lg:col-span-2">
          <div className="flex flex-col gap-4 text-base leading-relaxed text-muted">
            {data.concept.split('\n\n').map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Card>
        <Card title="What you will learn" icon={Target} tone="emerald" id="objectives-heading">
          <ul className="flex flex-col gap-3 text-ink">
            {data.objectives.map((objective) => (
              <li key={objective} className="flex gap-2.5">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span className="leading-relaxed">{objective}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold text-ink">
                {data.completedChallenges} of {data.totalChallenges} challenges done
              </span>
              <span className="inline-flex items-center gap-1 text-muted">
                <Trophy className="size-3.5 text-amber-600" aria-hidden="true" /> {data.pointsEarned}/{data.pointsPossible} pts
              </span>
            </div>
            <ProgressBar value={data.completedChallenges} max={data.totalChallenges} label={`${data.title} progress`} fill={moduleTheme(data.id).bar} />
          </div>
        </Card>
      </div>

      <section className="mt-8" aria-labelledby="challenges-heading">
        <h2 id="challenges-heading" className="mb-4 flex items-center gap-2.5 text-xl font-bold text-ink">
          <Swords className="size-5 text-indigo-600" aria-hidden="true" /> Practise what you learned
        </h2>
        {data.challenges.length === 0 ? (
          <EmptyState title="No challenges in this module yet" />
        ) : (
          <div className="flex flex-col gap-3">
            {data.challenges.map((challenge, index) => (
              <ChallengeCard key={challenge.id} challenge={challenge} number={index + 1} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
