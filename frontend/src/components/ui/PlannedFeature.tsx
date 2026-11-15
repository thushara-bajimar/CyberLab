import { Construction } from 'lucide-react'
import type { ReactNode } from 'react'

/** Clearly labels a part of the interface that a later development phase will enable. */
export function PlannedFeature({ phase, children }: { phase: number; children: ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-md border border-amber-900/60 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
      <Construction className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        <strong>Coming in Phase {phase}:</strong> {children}
      </span>
    </p>
  )
}
