/**
 * Colour theme handling. The preference ('light', 'dark' or 'system') is stored in localStorage, the only
 * thing CyberLab keeps in the browser; it is a display setting, not personal data. The resolved theme is applied
 * as the `dark` class on <html>, which switches every colour token in index.css.
 *
 * index.html runs the same logic in a tiny inline script before React loads, so the page never flashes white
 * for a learner who uses dark mode.
 */
export type ThemePreference = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'cyberlab-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

export function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  } catch {
    return 'system' // storage can be blocked (private mode, strict settings); fall back gracefully
  }
}

export function savePreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Not being able to remember the choice is harmless: it still applies for this visit.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return preference
}

export function applyTheme(preference: ThemePreference): void {
  document.documentElement.classList.toggle('dark', resolveTheme(preference) === 'dark')
}

/** Calls `listener` when the operating-system theme changes; returns an unsubscribe function. */
export function onSystemThemeChange(listener: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => {}
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', listener)
  return () => query.removeEventListener('change', listener)
}
