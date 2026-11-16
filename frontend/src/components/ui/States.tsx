import { CloudOff, Compass, Inbox, Loader2, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { primaryButton, secondaryButton } from '../../utils/styles'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <Loader2 className="size-6 animate-spin text-indigo-600" aria-hidden="true" />
      <span className="text-base">{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5" role="alert">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700" aria-hidden="true">
          <CloudOff className="size-5" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-rose-900">Could not load this page</p>
          <p className="mt-1 text-sm text-rose-800">{message}</p>
        </div>
        {onRetry && (
          <button type="button" onClick={onRetry} className={secondaryButton}>
            <RefreshCw className="size-4" aria-hidden="true" /> Retry
          </button>
        )}
      </div>
    </div>
  )
}

/** For content that does not exist (HTTP 404): no retry, a link back instead. */
export function NotFoundState({ what, backTo, backLabel }: { what: string; backTo: string; backLabel: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center" role="alert">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-indigo-100 text-indigo-700" aria-hidden="true">
        <Compass className="size-8" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-ink">{what} not found</h1>
      <p className="mt-2 text-muted">The address may be mistyped, or the content may have been removed from the course.</p>
      <Link to={backTo} className={`${primaryButton} mt-6`}>
        {backLabel}
      </Link>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-4 py-8 text-center">
      <Inbox className="size-7 text-slate-500" aria-hidden="true" />
      <p className="font-semibold text-ink">{title}</p>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
    </div>
  )
}
