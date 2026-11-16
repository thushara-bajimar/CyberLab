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
  fundamentals: { icon: ShieldCheck, tile: 'bg-indigo-100 text-indigo-700', bar: 'bg-indigo-500' },
  'linux-basics': { icon: SquareTerminal, tile: 'bg-slate-200 text-slate-800', bar: 'bg-slate-600' },
  networking: { icon: Network, tile: 'bg-sky-100 text-sky-700', bar: 'bg-sky-500' },
  passwords: { icon: KeyRound, tile: 'bg-amber-100 text-amber-800', bar: 'bg-amber-500' },
  cryptography: { icon: Lock, tile: 'bg-violet-100 text-violet-700', bar: 'bg-violet-500' },
  phishing: { icon: Fish, tile: 'bg-teal-100 text-teal-800', bar: 'bg-teal-500' },
  forensics: { icon: Search, tile: 'bg-rose-100 text-rose-700', bar: 'bg-rose-500' },
}

const fallback: ModuleTheme = { icon: BookOpen, tile: 'bg-slate-100 text-slate-700', bar: 'bg-indigo-500' }

export function moduleTheme(moduleId: string): ModuleTheme {
  return Object.hasOwn(themes, moduleId) ? themes[moduleId]! : fallback
}
