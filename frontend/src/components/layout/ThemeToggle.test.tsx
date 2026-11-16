import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, readPreference } from '../../utils/theme'
import { ThemeToggle } from './ThemeToggle'

/** A controllable stand-in for the browser's prefers-color-scheme media query. */
function mockSystemTheme(initiallyDark: boolean) {
  const listeners = new Set<() => void>()
  const query = {
    matches: initiallyDark,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => query))
  return {
    change(dark: boolean) {
      query.matches = dark
      listeners.forEach((listener) => listener())
    },
  }
}

const isDark = () => document.documentElement.classList.contains('dark')

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('dark')
})
afterEach(() => vi.unstubAllGlobals())

describe('ThemeToggle', () => {
  it('follows the operating system by default', () => {
    mockSystemTheme(true)
    render(<ThemeToggle />)
    expect(isDark()).toBe(true)
    expect(screen.getByRole('button', { name: 'Use system theme' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('switches theme on click and remembers the choice', async () => {
    mockSystemTheme(false)
    const user = userEvent.setup()
    render(<ThemeToggle />)
    expect(isDark()).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Dark theme' }))
    expect(isDark()).toBe(true)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'false')

    await user.click(screen.getByRole('button', { name: 'Light theme' }))
    expect(isDark()).toBe(false)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('restores the saved choice on the next visit, even if the system prefers the other theme', () => {
    mockSystemTheme(false)
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    render(<ThemeToggle />)
    expect(isDark()).toBe(true)
  })

  it('reacts to operating-system changes only while set to system', async () => {
    const system = mockSystemTheme(false)
    const user = userEvent.setup()
    render(<ThemeToggle />)
    act(() => system.change(true))
    expect(isDark()).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Light theme' }))
    act(() => system.change(true))
    expect(isDark()).toBe(false)
  })

  it('falls back to the system theme when storage is unavailable or holds rubbish', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, '<script>')
    expect(readPreference()).toBe('system')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readPreference()).toBe('system')
  })
})
