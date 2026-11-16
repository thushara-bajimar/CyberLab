import type { ReactNode } from 'react'

export function PageHeader({ eyebrow, title, description, actions, icon }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        {icon}
        <div>
          {eyebrow && <p className="text-sm font-semibold text-indigo-700">{eyebrow}</p>}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {actions}
    </header>
  )
}
