import type { LucideIcon } from 'lucide-react'

export function StatCard({ label, value, note, icon: Icon }: { label: string; value: string | number; note?: string; icon: LucideIcon }) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-center justify-between text-slate-400">
        <h3 className="text-xs font-medium tracking-wide uppercase">{label}</h3>
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </article>
  )
}
