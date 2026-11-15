import { Loader2, RotateCcw } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ApiError } from '../../api/client'
import { resetProgress } from '../../api/endpoints'

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
    <section className="rounded-lg border border-rose-900/70 bg-rose-950/20 p-5" aria-labelledby="reset-heading">
      <h2 id="reset-heading" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-rose-200 uppercase">
        <RotateCcw className="size-4" aria-hidden="true" /> Reset progress
      </h2>
      <p className="mt-2 text-sm text-slate-300">
        Deletes your points, completed challenges, revealed hints, attempts and activity history so you can start the course again (for
        example before a demonstration). The course content is not changed. <strong className="text-rose-200">This cannot be undone.</strong>
      </p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">
            Type <span className="font-mono text-rose-200">{CONFIRM_WORD}</span> to confirm
          </span>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-slate-100 focus:border-rose-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={!armed || busy}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Reset all progress
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-rose-400" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
