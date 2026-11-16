import { Loader2, RotateCcw } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { resetProgress } from '../../api/endpoints'
import { textInput } from '../../utils/styles'

const CONFIRM_WORD = 'RESET'

/**
 * Deletes all progress after the learner types RESET. The server independently requires the same word,
 * so a stray request cannot wipe progress either.
 */
export function ResetProgressPanel({ onReset }: { onReset: (message: string) => void }) {
  const [confirmText, setConfirmText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const armed = confirmText === CONFIRM_WORD

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!armed || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await resetProgress()
      setConfirmText('')
      onReset(
        `Progress reset: ${result.deleted.progressRows} challenge record(s) and ${result.deleted.activityRows} activity entr${result.deleted.activityRows === 1 ? 'y' : 'ies'} were deleted.`,
      )
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Progress could not be reset.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-2xl border border-danger-line bg-surface p-5 shadow-sm sm:p-6" aria-labelledby="reset-heading">
      <h2 id="reset-heading" className="flex items-center gap-2.5 text-base font-semibold text-ink">
        <span className="grid size-8 place-items-center rounded-lg bg-danger-tile text-danger-ink" aria-hidden="true">
          <RotateCcw className="size-4" />
        </span>
        Start over
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted">
        Deletes your points, completed challenges, revealed hints, attempts and activity history so you can start the course again (for example
        before a demonstration). The course content is not changed. <strong className="text-danger-ink">This cannot be undone.</strong>
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          <span>
            Type <span className="rounded bg-danger-soft px-1.5 py-0.5 font-mono font-semibold text-danger-ink">{CONFIRM_WORD}</span> to confirm
          </span>
          <input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} autoComplete="off" spellCheck={false} className={`${textInput} font-mono sm:w-56`} />
        </label>
        <button
          type="submit"
          disabled={!armed || busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Reset all progress
        </button>
      </form>
      {error && (
        <p className="mt-3 text-sm font-medium text-danger-ink" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
