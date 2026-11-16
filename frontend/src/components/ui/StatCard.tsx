import type { LucideIcon } from 'lucide-react'
import { IconChip, type Tone } from './Card'

/** A single number with a coloured icon. Stacks icon above text on phones (two cards per row), side by side from sm. */
export function StatCard({ label, value, note, icon, tone = 'indigo' }: { label: string; value: string | number; note?: string; icon: LucideIcon; tone?: Tone }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-sm sm:flex-row sm:items-center sm:gap-4">
      <IconChip icon={icon} tone={tone} />
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-muted">{label}</h3>
        <p className="text-2xl font-bold text-ink">{value}</p>
        {note && <p className="text-xs text-muted">{note}</p>}
      </div>
    </article>
  )
}
