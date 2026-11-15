import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-slate-400" role="status">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-rose-900/70 bg-rose-950/40 p-4" role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-400" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-medium text-rose-200">Could not load this page</p>
          <p className="mt-1 text-sm text-rose-300/90">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-md border border-rose-800 px-3 py-1.5 text-sm text-rose-200 hover:bg-rose-900/50"
          >
            <RefreshCw className="size-4" aria-hidden="true" /> Retry
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-800 px-4 py-8 text-center">
      <Inbox className="size-6 text-slate-500" aria-hidden="true" />
      <p className="font-medium text-slate-300">{title}</p>
      {children && <div className="max-w-md text-sm text-slate-500">{children}</div>}
    </div>
  )
}
