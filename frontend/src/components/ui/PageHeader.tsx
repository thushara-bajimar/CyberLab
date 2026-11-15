import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold text-slate-50 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-slate-400">{description}</p>}
      </div>
      {actions}
    </header>
  )
}
