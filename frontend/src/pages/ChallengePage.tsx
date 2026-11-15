import { ChevronLeft, ChevronRight, Flag, KeyRound, Lightbulb, Target, TerminalSquare } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getChallenge } from '../api/endpoints'
import type { ChallengeDetail } from '../api/types'
import { ExplanationPanel } from '../components/challenge/ExplanationPanel'
import { DifficultyBadge, StatusBadge } from '../components/ui/Badges'
import { PageHeader } from '../components/ui/PageHeader'
import { PlannedFeature } from '../components/ui/PlannedFeature'
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

function TerminalPanel({ terminal }: { terminal: NonNullable<ChallengeDetail['terminal']> }) {
  return (
    <Panel title="Simulated terminal" icon={TerminalSquare} id="terminal-heading">
      <div className="rounded-md border border-slate-800 bg-black/60 p-4 font-mono text-sm text-slate-300">
        <p className="text-slate-500"># Environment: {terminal.title}</p>
        <p>
          <span className="text-emerald-400">
            {terminal.user}@{terminal.hostname}
          </span>
          :<span className="text-sky-400">~</span>$ <span className="animate-pulse">▌</span>
        </p>
      </div>
      <PlannedFeature phase={4}>the interactive terminal. You will type commands such as ls, cd and cat here; everything is simulated and nothing runs on a real machine.</PlannedFeature>
    </Panel>
  )
}

function HintsPanel({ challenge }: { challenge: ChallengeDetail }) {
  const { hints, scoring } = challenge
  return (
    <Panel title="Hints" icon={Lightbulb} id="hints-heading">
      <p className="text-sm text-slate-400">
        {hints.total} progressive hints are available. Each hint revealed before you solve the challenge reduces its points by{' '}
        {scoring.hintPenaltyPercent}% of the base ({(scoring.basePoints * scoring.hintPenaltyPercent) / 100} points).
      </p>
      {hints.revealed.length > 0 && (
        <ol className="mt-3 flex flex-col gap-2">
          {hints.revealed.map((hint) => (
            <li key={hint.number} className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
              <span className="mr-2 font-semibold text-amber-300">Hint {hint.number}</span>
              {hint.text}
            </li>
          ))}
        </ol>
      )}
      {challenge.status !== 'completed' && (
        <button type="button" disabled className="mt-3 rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-500">
          Reveal hint {hints.used + 1} of {hints.total}
        </button>
      )}
      {challenge.status !== 'completed' && <PlannedFeature phase={5}>revealing hints (the server records each reveal and applies the penalty).</PlannedFeature>}
    </Panel>
  )
}

function AnswerPanel({ challenge }: { challenge: ChallengeDetail }) {
  const [text, setText] = useState('')
  const [choice, setChoice] = useState('')
  if (challenge.status === 'completed') {
    return (
      <Panel title="Your answer" icon={KeyRound} id="answer-heading">
        <p className="text-sm text-emerald-300">
          Completed {challenge.progress.completedAt ? `on ${new Date(challenge.progress.completedAt).toLocaleString()}` : ''} for{' '}
          {challenge.pointsAwarded} points.
        </p>
      </Panel>
    )
  }
  return (
    <Panel title="Your answer" icon={KeyRound} id="answer-heading">
      <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-3">
        {challenge.options ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="sr-only">Choose one answer</legend>
            {challenge.options.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm ${
                  choice === option.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <input type="radio" name="answer" value={option.id} checked={choice === option.id} onChange={() => setChoice(option.id)} className="accent-emerald-500" />
                <span className="font-mono text-slate-500 uppercase">{option.id}</span>
                <span className="text-slate-200">{option.text}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Type your answer</span>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={200}
              autoComplete="off"
              spellCheck={false}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
              placeholder="Your answer"
            />
          </label>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled className="rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">
            Submit answer
          </button>
          {challenge.scoring.pointsAvailable !== null && <span className="text-sm text-slate-400">Worth {challenge.scoring.pointsAvailable} points now</span>}
        </div>
      </form>
      <PlannedFeature phase={5}>answer checking. Answers are checked and scored on the server, never in the browser.</PlannedFeature>
    </Panel>
  )
}

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

  const data = challenge.data
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-slate-400">
        <Link to="/modules" className="hover:text-emerald-300">Modules</Link>
        <ChevronRight className="size-4" aria-hidden="true" />
        <Link to={`/modules/${data.moduleId}`} className="hover:text-emerald-300">{data.moduleTitle}</Link>
      </nav>
      <PageHeader
        eyebrow="Challenge"
        title={data.title}
        actions={
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <DifficultyBadge difficulty={data.difficulty} />
            <StatusBadge status={data.status} />
            <span>{data.status === 'completed' ? `${data.pointsAwarded}/${data.basePoints} pts earned` : `${data.basePoints} pts`}</span>
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
          {data.terminal && <TerminalPanel terminal={data.terminal} />}
          <AnswerPanel key={data.id} challenge={data} />
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
          <HintsPanel challenge={data} />
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
