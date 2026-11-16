import { BookOpen, LayoutDashboard, ShieldCheck, Swords, TrendingUp, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { getHealth } from '../../api/endpoints'
import { useApi } from '../../hooks/useApi'
import { ThemeToggle } from './ThemeToggle'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/modules', label: 'Modules', icon: BookOpen },
  { to: '/challenges', label: 'Challenges', icon: Swords },
  { to: '/progress', label: 'Progress', icon: TrendingUp },
]

function ServerStatus() {
  const health = useApi(getHealth)
  const online = health.status === 'success' && health.data.database.status === 'ok'
  const label = health.status === 'loading' ? 'Checking server' : online ? 'Server online' : 'Server offline'
  const style =
    health.status === 'loading' ? 'bg-surface-3 text-muted' : online ? 'bg-success-soft text-success-ink' : 'bg-danger-soft text-danger-ink'
  const dot = health.status === 'loading' ? 'bg-slate-400' : online ? 'bg-emerald-500' : 'bg-rose-500'
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style}`} role="status" title={health.error ?? undefined}>
      <span className={`size-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}

/**
 * After client-side navigation, move keyboard focus to the new page's content so keyboard and screen-reader
 * users start reading the new page instead of staying on the link they clicked. Not done on the first load,
 * so the "Skip to main content" link remains the first thing Tab reaches.
 */
function useFocusMainOnNavigation() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const previous = useRef(pathname)
  useEffect(() => {
    if (previous.current !== pathname) mainRef.current?.focus({ preventScroll: true })
    previous.current = pathname
  }, [pathname])
  return mainRef
}

export function Layout() {
  const mainRef = useFocusMainOnNavigation()
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-20 focus:m-2 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-white shadow-sm" aria-hidden="true">
              <ShieldCheck className="size-6" />
            </span>
            <span className="leading-tight">
              <span className="block text-lg font-bold text-ink">CyberLab</span>
              <span className="block text-xs text-muted">Learn cybersecurity by doing</span>
            </span>
          </NavLink>
          <nav aria-label="Main navigation" className="order-3 w-full sm:order-0 sm:w-auto">
            {/* Phones: four equal columns with the icon above a small label. From sm upwards: one row. */}
            <ul className="grid grid-cols-4 gap-1 sm:flex sm:gap-1.5">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs font-semibold transition-colors sm:flex-row sm:gap-2 sm:px-3.5 sm:text-sm ${
                        isActive ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-surface-3 hover:text-ink'
                      }`
                    }
                  >
                    <Icon className="size-5 sm:size-4" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ServerStatus />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 focus:outline-none sm:py-10">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-surface py-5 text-center text-sm text-muted">
        CyberLab · Learn Cybersecurity by Doing · Every exercise runs in a safe, simulated environment
      </footer>
      <ScrollRestoration />
    </div>
  )
}
