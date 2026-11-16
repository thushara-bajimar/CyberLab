import { Lightbulb, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ApiError } from '../../api/client'
import { revealHint } from '../../api/endpoints'
import type { ChallengeDetail } from '../../api/types'
import { secondaryButton } from '../../utils/styles'

/**
 * Progressive hints. Revealing a hint costs points, so the panel first states the exact cost and asks for
 * confirmation. The request sends the hint number; the server ignores repeats, so a double click is free.
 */
export function HintsPanel({ challenge, onUpdate }: { challenge: ChallengeDetail; onUpdate: (challenge: ChallengeDetail) => void }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { hints, scoring } = challenge
  const completed = challenge.status === 'completed'
  const cost = (scoring.basePoints * scoring.hintPenaltyPercent) / 100
  const next = hints.used + 1
  const available = scoring.pointsAvailable ?? 0

  async function reveal() {
    setBusy(true)
    setError(null)
    try {
      const result = await revealHint(challenge.id, next)
      onUpdate(result.challenge)
      setConfirming(false)
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'The hint could not be revealed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-warning-line bg-warning-soft p-5 shadow-sm sm:p-6" aria-labelledby="hints-heading">
      <h2 id="hints-heading" className="flex items-center gap-2.5 text-base font-semibold text-ink">
        <span className="grid size-8 place-items-center rounded-lg bg-warning-tile text-warning-ink" aria-hidden="true">
          <Lightbulb className="size-4" />
        </span>
        Need a hint?
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        {completed
          ? 'Challenge completed: all hints are shown for review, free of charge.'
          : `Stuck? That is part of learning. There are ${hints.total} hints, from a gentle nudge to a strong clue. Each one revealed before you solve the challenge costs ${cost} points (${scoring.hintPenaltyPercent}% of ${scoring.basePoints}).`}
      </p>

      {hints.revealed.length > 0 && (
        <ol className="mt-4 flex flex-col gap-2.5" aria-live="polite">
          {hints.revealed.map((hint) => (
            <li key={hint.number} className="rounded-xl border border-warning-line bg-surface p-3.5 text-sm leading-relaxed text-ink">
              <span className="mb-1 block text-xs font-bold tracking-wide text-warning-ink uppercase">Hint {hint.number}</span>
              {hint.text}
            </li>
          ))}
        </ol>
      )}

      {!completed && next <= hints.total && (
        <div className="mt-4">
          {confirming ? (
            <div className="rounded-xl border border-warning-line bg-surface p-4 text-sm" role="alertdialog" aria-label="Confirm hint">
              <p className="text-ink">
                Reveal hint {next}? This challenge will then be worth <strong>{available - cost}</strong> points instead of {available}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={reveal}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 font-semibold text-slate-950 shadow-sm hover:bg-amber-400 disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Reveal hint {next}
                </button>
                <button type="button" onClick={() => setConfirming(false)} disabled={busy} className={secondaryButton}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className={`${secondaryButton} border-warning-line hover:border-amber-500 hover:bg-warning-tile`}>
              <Lightbulb className="size-4 text-warning-ink" aria-hidden="true" />
              Reveal hint {next} of {hints.total} (-{cost} points)
            </button>
          )}
        </div>
      )}
      {!completed && next > hints.total && <p className="mt-4 text-sm text-muted">All hints revealed. You have everything you need!</p>}
      {error && (
        <p className="mt-3 text-sm font-medium text-danger-ink" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
