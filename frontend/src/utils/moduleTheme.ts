import { BookOpen, Fish, KeyRound, Lock, Network, Search, ShieldCheck, SquareTerminal, type LucideIcon } from 'lucide-react'

/**
 * Each module gets its own icon and colour so the course reads like a learning path. Presentation only: the
 * backend knows nothing about it. Unknown modules fall back to a neutral book icon.
 */
export interface ModuleTheme {
  icon: LucideIcon
  /** Icon tile background + icon colour. */
  tile: string
  /** Progress bar fill. */
  bar: string
}

const themes: Record<string, ModuleTheme> = {
  fundamentals: { icon: ShieldCheck, tile: 'bg-accent-tile text-accent-ink', bar: 'bg-accent' },
  'linux-basics': { icon: SquareTerminal, tile: 'bg-track text-ink', bar: 'bg-slate-600 dark:bg-slate-400' },
  networking: { icon: Network, tile: 'bg-info-tile text-info-ink', bar: 'bg-sky-500' },
  passwords: { icon: KeyRound, tile: 'bg-warning-tile text-warning-ink', bar: 'bg-amber-500' },
  // Violet and teal are only used here, so they get explicit dark variants instead of their own tokens.
  cryptography: { icon: Lock, tile: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300', bar: 'bg-violet-500' },
  phishing: { icon: Fish, tile: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300', bar: 'bg-teal-500' },
  forensics: { icon: Search, tile: 'bg-danger-tile text-danger-ink', bar: 'bg-rose-500' },
}

const fallback: ModuleTheme = { icon: BookOpen, tile: 'bg-surface-3 text-muted', bar: 'bg-accent' }

export function moduleTheme(moduleId: string): ModuleTheme {
  return Object.hasOwn(themes, moduleId) ? themes[moduleId]! : fallback
}
