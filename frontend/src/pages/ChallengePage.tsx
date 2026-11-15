import { ChevronLeft, ChevronRight, Flag, Lightbulb, Target, TerminalSquare } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getChallenge } from '../api/endpoints'
import type { ChallengeDetail } from '../api/types'
import { AnswerPanel } from '../components/challenge/AnswerPanel'
import { ExplanationPanel } from '../components/challenge/ExplanationPanel'
import { HintsPanel } from '../components/challenge/HintsPanel'
import { Terminal } from '../components/challenge/Terminal'
import { DifficultyBadge, StatusBadge } from '../components/ui/Badges'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, LoadingState, NotFoundState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'

function Panel({ title, icon: Icon, children, id }: { title: string; icon: typeof Flag; children: ReactNode; id: string }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5" aria-labelledby={id}>
      <h2 id={id} className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
        <Icon className="size-4 text-emerald-400" aria-hidden="true" /> {title}
      </h2>
      {children}
    </section>
  )
}

/** Loads the challenge, then hands it to ChallengeView, which keeps it in state as hints and answers update it. */
export function ChallengePage() {
  const { challengeId = '' } = useParams()
  const challenge = useApi(() => getChallenge(challengeId), challengeId)

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
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-400">
        <Link to="/modules" className="hover:text-emerald-300">
          Modules
        </Link>
        <ChevronRight className="size-4" aria-hidden="true" />
        <Link to={`/modules/${data.moduleId}`} className="hover:text-emerald-300">
          {data.moduleTitle}
        </Link>
      </nav>
      <PageHeader
        eyebrow="Challenge"
        title={data.title}
        actions={
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <DifficultyBadge difficulty={data.difficulty} />
            <StatusBadge status={data.status} />
            <span>{data.status === 'completed' ? `${data.pointsAwarded}/${data.basePoints} pts earned` : `${data.scoring.pointsAvailable ?? data.basePoints} pts available`}</span>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <Panel title="Scenario" icon={Flag} id="scenario-heading">
            <p className="leading-relaxed text-slate-200">{data.scenario}</p>
            <p className="mt-4 flex gap-2 rounded-md bg-slate-950 p-3 text-sm text-slate-300">
              <Target className="mt-0.5 size-4 shrink-0 text-emerald-400" aria-hidden="true" />
              <span>
                <strong className="text-slate-100">Objective: </strong>
                {data.objective}
              </span>
            </p>
          </Panel>
          {data.terminal && (
            <Panel title="Simulated terminal" icon={TerminalSquare} id="terminal-heading">
              <p className="mb-3 text-sm text-slate-400">
                Environment: <span className="text-slate-200">{data.terminal.title}</span>. Commands run in a read-only simulation on the server;
                nothing you type touches a real system.
              </p>
              <Terminal challengeId={data.id} environment={data.terminal} />
            </Panel>
          )}
          <AnswerPanel challenge={data} onUpdate={setData} />
          {data.explanation && <ExplanationPanel explanation={data.explanation} />}
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel title="Instructions" icon={Target} id="instructions-heading">
            <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
              {data.instructions.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </Panel>
          <Panel title="Concepts and resources" icon={Lightbulb} id="resources-heading">
            <dl className="flex flex-col gap-3 text-sm">
              {data.resources.map((resource) => (
                <div key={resource.title}>
                  <dt className="font-medium text-slate-100">{resource.title}</dt>
                  <dd className="text-slate-400">{resource.body}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <HintsPanel challenge={data} onUpdate={setData} />
        </div>
      </div>

      <nav aria-label="Challenge navigation" className="mt-8 flex justify-between gap-4 border-t border-slate-800 pt-4 text-sm">
        {data.navigation.previousId ? (
          <Link to={`/challenges/${data.navigation.previousId}`} className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-300">
            <ChevronLeft className="size-4" aria-hidden="true" /> Previous challenge
          </Link>
        ) : (
          <span />
        )}
        {data.navigation.nextId && (
          <Link to={`/challenges/${data.navigation.nextId}`} className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-300">
            Next challenge <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </nav>
    </>
  )
}
