import { ArrowRight, CheckCircle2, Info, KeyRound, Loader2, RotateCcw, Trophy, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../api/client'
import { submitAnswer } from '../../api/endpoints'
import type { ChallengeDetail, SubmitResponse } from '../../api/types'
import { formatDateTime } from '../../utils/format'
import { primaryButton, textInput } from '../../utils/styles'

type Feedback = { tone: 'success' | 'retry' | 'info' | 'error'; message: string }

const toneStyle: Record<Feedback['tone'], { box: string; Icon: typeof CheckCircle2 }> = {
  success: { box: 'border-success-line bg-success-soft text-success-ink', Icon: CheckCircle2 },
  retry: { box: 'border-warning-line bg-warning-soft text-warning-ink', Icon: RotateCcw },
  info: { box: 'border-info-line bg-info-soft text-info-ink', Icon: Info },
  error: { box: 'border-danger-line bg-danger-soft text-danger-ink', Icon: XCircle },
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

  const FeedbackIcon = feedback ? toneStyle[feedback.tone].Icon : null
  const feedbackBox = feedback && FeedbackIcon && (
    <div className={`mb-4 flex items-start gap-3 rounded-xl border p-4 text-sm font-medium ${toneStyle[feedback.tone].box}`}>
      <FeedbackIcon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <span>{feedback.message}</span>
    </div>
  )

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6" aria-labelledby="answer-heading">
      <h2 id="answer-heading" className="mb-4 flex items-center gap-2.5 text-base font-semibold text-ink">
        <span className="grid size-8 place-items-center rounded-lg bg-accent-tile text-accent-ink" aria-hidden="true">
          <KeyRound className="size-4" />
        </span>
        Your answer
      </h2>
      <div aria-live="polite">{feedbackBox}</div>

      {completed ? (
        <div className="flex flex-col gap-4 text-sm">
          <p className="flex items-center gap-2 font-semibold text-success-ink">
            <CheckCircle2 className="size-5" aria-hidden="true" />
            Completed{challenge.progress.completedAt ? ` on ${formatDateTime(challenge.progress.completedAt)}` : ''}.
          </p>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-warning-soft p-3">
              <dt className="text-xs font-medium text-warning-ink">Points</dt>
              <dd className="mt-0.5 text-xl font-bold text-ink">
                {challenge.pointsAwarded}/{challenge.basePoints}
              </dd>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <dt className="text-xs font-medium text-muted">Attempts</dt>
              <dd className="mt-0.5 text-xl font-bold text-ink">{challenge.progress.attempts}</dd>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <dt className="text-xs font-medium text-muted">Hints used</dt>
              <dd className="mt-0.5 text-xl font-bold text-ink">{challenge.progress.hintsUsed}</dd>
            </div>
          </dl>
          {challenge.navigation.nextId && (
            <Link to={`/challenges/${challenge.navigation.nextId}`} className={`${primaryButton} self-start`}>
              Next challenge <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          {challenge.options ? (
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-1 text-sm font-medium text-muted">Choose one answer</legend>
              {challenge.options.map((option) => {
                const selected = choice === option.id
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3.5 transition-colors ${
                      selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent-line hover:bg-surface-2'
                    }`}
                  >
                    <input type="radio" name="answer" value={option.id} checked={selected} onChange={() => setChoice(option.id)} className="size-4 shrink-0 accent-indigo-600" />
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold uppercase ${
                        selected ? 'bg-accent text-white' : 'bg-surface-3 text-muted'
                      }`}
                      aria-hidden="true"
                    >
                      {option.id}
                    </span>
                    <span className="font-medium text-ink">{option.text}</span>
                  </label>
                )
              })}
            </fieldset>
          ) : (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Type your answer
              <input
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={200}
                autoComplete="off"
                spellCheck={false}
                className={`${textInput} font-mono`}
                placeholder={challenge.terminal ? 'e.g. what you found in the terminal' : 'Type your answer here'}
              />
            </label>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={busy} className={primaryButton}>
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {busy ? 'Checking…' : 'Submit answer'}
            </button>
            {challenge.scoring.pointsAvailable !== null && (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                <Trophy className="size-4 text-warning-icon" aria-hidden="true" />
                Worth {challenge.scoring.pointsAvailable} points now · wrong answers cost nothing
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
