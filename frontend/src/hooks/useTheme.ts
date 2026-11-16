import { useCallback, useEffect, useState } from 'react'
import { applyTheme, onSystemThemeChange, readPreference, savePreference, type ThemePreference } from '../utils/theme'

/** The learner's theme preference: applied immediately, remembered, and following the OS when set to 'system'. */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference)

  useEffect(() => {
    applyTheme(preference)
    if (preference !== 'system') return
    return onSystemThemeChange(() => applyTheme('system'))
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    savePreference(next)
    setPreferenceState(next)
  }, [])

  return { preference, setPreference }
}
