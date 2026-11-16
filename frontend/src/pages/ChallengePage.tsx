import { BookOpen, ChevronLeft, ChevronRight, Flag, ListOrdered, SquareTerminal, Target, Trophy } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getChallenge } from '../api/endpoints'
import type { ChallengeDetail } from '../api/types'
import { AnswerPanel } from '../components/challenge/AnswerPanel'
import { ExplanationPanel } from '../components/challenge/ExplanationPanel'
import { HintsPanel } from '../components/challenge/HintsPanel'
import { Terminal } from '../components/challenge/Terminal'
import { DifficultyBadge, StatusBadge } from '../components/ui/Badges'
import { Card } from '../components/ui/Card'
import { ModuleIcon } from '../components/ui/ModuleIcon'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, LoadingState, NotFoundState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { secondaryButton } from '../utils/styles'

/** Loads the challenge, then hands it to ChallengeView, which keeps it in state as hints and answers update it. */
export function ChallengePage() {
  const { challengeId = '' } = useParams()
  const challenge = useApi(() => getChallenge(challengeId), challengeId)
  useDocumentTitle(challenge.status === 'success' ? challenge.data.title : challenge.notFound ? 'Challenge not found' : null)

  if (challenge.status === 'loading') return <LoadingState label="Loading challenge…" />
  if (challenge.status === 'error') {
    return challenge.notFound ? (
      <NotFoundState what="Challenge" backTo="/challenges" backLabel="Browse all challenges" />
    ) : (
      <ErrorState message={challenge.error} onRetry={challenge.reload} />
    )
  }
  return <ChallengeView key={challenge.data.id} initial={challenge.data} />
}

/**
 * Hint and answer responses contain the refreshed challenge, so the page updates in place instead of
 * reloading (which would also wipe the terminal session).
 */
function ChallengeView({ initial }: { initial: ChallengeDetail }) {
  const [data, setData] = useState(initial)

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-sm font-medium text-muted">
        <Link to="/modules" className="text-accent-ink hover:underline">
          Modules
        </Link>
        <ChevronRight className="size-4" aria-hidden="true" />
        <Link to={`/modules/${data.moduleId}`} className="text-accent-ink hover:underline">
          {data.moduleTitle}
        </Link>
      </nav>
      <PageHeader
        icon={<ModuleIcon moduleId={data.moduleId} size="lg" />}
        eyebrow="Challenge"
        title={data.title}
        actions={
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <DifficultyBadge difficulty={data.difficulty} />
            <StatusBadge status={data.status} />
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning-ink ring-1 ring-warning-line ring-inset">
              <Trophy className="size-3.5" aria-hidden="true" />
              {data.status === 'completed' ? `${data.pointsAwarded}/${data.basePoints} pts earned` : `${data.scoring.pointsAvailable ?? data.basePoints} pts available`}
            </span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-3">
          <Card title="Your mission" icon={Flag} id="scenario-heading">
            <p className="text-lg leading-relaxed text-ink">{data.scenario}</p>
            <div className="mt-5 flex gap-3 rounded-xl border border-accent-line bg-accent-soft p-4">
              <Target className="mt-0.5 size-5 shrink-0 text-accent-ink" aria-hidden="true" />
              <p className="text-ink">
                <strong className="font-semibold">Your goal: </strong>
                {data.objective}
              </p>
            </div>
          </Card>
          {data.terminal && (
            <Card title="Investigate in the terminal" icon={SquareTerminal} tone="slate" id="terminal-heading">
              <p className="mb-4 text-sm leading-relaxed text-muted">
                You are working on the <strong className="font-semibold text-ink">{data.terminal.title}</strong>. Type commands below and press Enter. It
                is a safe simulation: nothing you type can harm a real computer, so feel free to explore.
              </p>
              <Terminal challengeId={data.id} environment={data.terminal} />
            </Card>
          )}
          <AnswerPanel challenge={data} onUpdate={setData} />
          {data.explanation && <ExplanationPanel explanation={data.explanation} />}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card title="How to approach it" icon={ListOrdered} tone="sky" id="instructions-heading">
            <ol className="flex flex-col gap-3">
              {data.instructions.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-info-tile text-xs font-bold text-info-ink" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card title="Key concepts" icon={BookOpen} tone="emerald" id="resources-heading">
            <dl className="flex flex-col gap-3">
              {data.resources.map((resource) => (
                <div key={resource.title} className="rounded-xl bg-surface-2 p-3.5">
                  <dt className="font-semibold text-ink">{resource.title}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-muted">{resource.body}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <HintsPanel challenge={data} onUpdate={setData} />
        </div>
      </div>

      <nav aria-label="Challenge navigation" className="mt-10 flex justify-between gap-4 border-t border-line pt-6">
        {data.navigation.previousId ? (
          <Link to={`/challenges/${data.navigation.previousId}`} className={secondaryButton}>
            <ChevronLeft className="size-4" aria-hidden="true" /> Previous challenge
          </Link>
        ) : (
          <span />
        )}
        {data.navigation.nextId && (
          <Link to={`/challenges/${data.navigation.nextId}`} className={secondaryButton}>
            Next challenge <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </nav>
    </>
  )
}
