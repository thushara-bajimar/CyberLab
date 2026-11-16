import { Lightbulb, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ApiError } from '../../api/client'
import { revealHint } from '../../api/endpoints'
import type { ChallengeDetail } from '../../api/types'

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
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5" aria-labelledby="hints-heading">
      <h2 id="hints-heading" className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-300 uppercase">
        <Lightbulb className="size-4 text-emerald-400" aria-hidden="true" /> Hints
      </h2>
      <p className="text-sm text-slate-400">
        {completed
          ? 'Challenge completed: all hints are shown for review, free of charge.'
          : `${hints.total} progressive hints. Each one revealed before you solve the challenge costs ${cost} points (${scoring.hintPenaltyPercent}% of ${scoring.basePoints}).`}
      </p>

      {hints.revealed.length > 0 && (
        <ol className="mt-3 flex flex-col gap-2" aria-live="polite">
          {hints.revealed.map((hint) => (
            <li key={hint.number} className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200">
              <span className="mr-2 font-semibold text-amber-300">Hint {hint.number}</span>
              {hint.text}
            </li>
          ))}
        </ol>
      )}

      {!completed && next <= hints.total && (
        <div className="mt-3">
          {confirming ? (
            <div className="rounded-md border border-amber-900/60 bg-amber-950/30 p-3 text-sm" role="alertdialog" aria-label="Confirm hint">
              <p className="text-amber-100">
                Reveal hint {next}? This challenge will then be worth <strong>{available - cost}</strong> points instead of {available}.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={reveal}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-3 py-1.5 font-medium text-slate-950 hover:bg-amber-300 disabled:opacity-60"
                >
                  {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Reveal hint {next}
                </button>
                <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="rounded-md border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:border-amber-500 hover:text-amber-200">
              Reveal hint {next} of {hints.total} (-{cost} points)
            </button>
          )}
        </div>
      )}
      {!completed && next > hints.total && <p className="mt-3 text-xs text-slate-400">All hints revealed.</p>}
      {error && (
        <p className="mt-2 text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
