import { CheckCircle2, KeyRound, Loader2, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { submitAnswer } from '../../api/endpoints'
import type { ChallengeDetail, SubmitResponse } from '../../api/types'
import { formatDateTime } from '../../utils/format'

type Feedback = { tone: 'success' | 'retry' | 'info' | 'error'; message: string }

const toneStyle: Record<Feedback['tone'], string> = {
  success: 'border-emerald-800 bg-emerald-950/40 text-emerald-200',
  retry: 'border-amber-900/70 bg-amber-950/30 text-amber-100',
  info: 'border-slate-700 bg-slate-900 text-slate-200',
  error: 'border-rose-900/70 bg-rose-950/40 text-rose-200',
}

function feedbackFor(result: SubmitResponse): Feedback {
  if (result.outcome === 'correct') return { tone: 'success', message: result.message }
  if (result.outcome === 'incorrect') return { tone: 'retry', message: `${result.message} (Attempt ${result.attempts}.)` }
  return { tone: 'info', message: result.message }
}

/** Answer form. The browser only sends the answer text; the server checks it and calculates the points. */
export function AnswerPanel({ challenge, onUpdate }: { challenge: ChallengeDetail; onUpdate: (challenge: ChallengeDetail) => void }) {
  const [text, setText] = useState('')
  const [choice, setChoice] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const completed = challenge.status === 'completed'
  const answer = challenge.options ? choice : text

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    if (answer.trim() === '') {
      setFeedback({ tone: 'error', message: challenge.options ? 'Choose one of the options first.' : 'Type your answer first.' })
      return
    }
    setBusy(true)
    setFeedback(null)
    try {
      const result = await submitAnswer(challenge.id, answer)
      setFeedback(feedbackFor(result))
      onUpdate(result.challenge)
    } catch (reason) {
      setFeedback({ tone: 'error', message: reason instanceof ApiError ? reason.message : 'The answer could not be checked.' })
    } finally {
      setBusy(false)
    }
  }

  const feedbackBox = feedback && (
    <div className={`flex items-start gap-2 rounded-md border p-3 text-sm ${toneStyle[feedback.tone]}`}>
      {feedback.tone === 'success' ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <span>{feedback.message}</span>
    </div>
  )

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5" aria-labelledby="answer-heading">
      <h2 id="answer-heading" className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
        <KeyRound className="size-4 text-emerald-400" aria-hidden="true" /> Your answer
      </h2>
      <div aria-live="polite">{feedbackBox}</div>

      {completed ? (
        <div className={`${feedback ? 'mt-3 ' : ''}flex flex-col gap-3 text-sm text-slate-300`}>
          <p className="flex items-center gap-2 text-emerald-300">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Completed{challenge.progress.completedAt ? ` on ${formatDateTime(challenge.progress.completedAt)}` : ''}.
          </p>
          <dl className="grid grid-cols-3 gap-2 rounded-md bg-slate-950 p-3 text-center">
            <div>
              <dt className="text-xs text-slate-400">Points</dt>
              <dd className="text-lg font-semibold text-slate-100">
                {challenge.pointsAwarded}/{challenge.basePoints}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Attempts</dt>
              <dd className="text-lg font-semibold text-slate-100">{challenge.progress.attempts}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Hints used</dt>
              <dd className="text-lg font-semibold text-slate-100">{challenge.progress.hintsUsed}</dd>
            </div>
          </dl>
          {challenge.navigation.nextId && (
            <Link to={`/challenges/${challenge.navigation.nextId}`} className="self-start rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400">
              Next challenge
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className={`${feedback ? 'mt-3 ' : ''}flex flex-col gap-3`}>
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
                  <span className="font-mono text-slate-400 uppercase">{option.id}</span>
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
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                placeholder="Your answer"
              />
            </label>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {busy ? 'Checking…' : 'Submit answer'}
            </button>
            {challenge.scoring.pointsAvailable !== null && (
              <span className="text-sm text-slate-400">
                Worth {challenge.scoring.pointsAvailable} points now · wrong answers cost nothing
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
