import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import type { ThemePreference } from '../../utils/theme'

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light theme', icon: Sun },
  { value: 'dark', label: 'Dark theme', icon: Moon },
  { value: 'system', label: 'Use system theme', icon: Monitor },
]

/** Three-way switch in the header. Each button says what it does; the active one is marked with aria-pressed. */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface-2 p-0.5" role="group" aria-label="Colour theme">
      {options.map(({ value, label, icon: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={`grid size-8 place-items-center rounded-full transition-colors ${
              active ? 'bg-surface text-accent-ink shadow-sm ring-1 ring-line' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
