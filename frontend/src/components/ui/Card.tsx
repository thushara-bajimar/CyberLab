import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

const iconTones = {
  indigo: 'bg-indigo-100 text-indigo-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-800',
  sky: 'bg-sky-100 text-sky-700',
  rose: 'bg-rose-100 text-rose-700',
  slate: 'bg-slate-100 text-slate-700',
}

export type Tone = keyof typeof iconTones

/** White card with an optional heading and coloured icon chip: the basic building block of every page. */
export function Card({
  title,
  icon: Icon,
  tone = 'indigo',
  id,
  action,
  className = '',
  children,
}: {
  title?: ReactNode
  icon?: LucideIcon
  tone?: Tone
  id?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6 ${className}`} aria-labelledby={title && id ? id : undefined}>
      {title && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id={id} className="flex items-center gap-2.5 text-base font-semibold text-ink">
            {Icon && (
              <span className={`grid size-8 place-items-center rounded-lg ${iconTones[tone]}`} aria-hidden="true">
                <Icon className="size-4" />
              </span>
            )}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function IconChip({ icon: Icon, tone = 'indigo' }: { icon: LucideIcon; tone?: Tone }) {
  return (
    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${iconTones[tone]}`} aria-hidden="true">
      <Icon className="size-5" />
    </span>
  )
}
