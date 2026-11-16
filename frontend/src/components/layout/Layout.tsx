import { BookOpen, LayoutDashboard, ShieldCheck, Swords, TrendingUp, type LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import { getHealth } from '../../api/endpoints'
import { useApi } from '../../hooks/useApi'

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
  const dot = health.status === 'loading' ? 'bg-slate-500' : online ? 'bg-emerald-400' : 'bg-rose-500'
  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-400" role="status" title={health.error ?? undefined}>
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
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded focus:bg-emerald-500 focus:px-3 focus:py-1 focus:text-slate-950">
        Skip to main content
      </a>
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 font-semibold text-slate-50">
            <ShieldCheck className="size-6 text-emerald-400" aria-hidden="true" />
            CyberLab
          </NavLink>
          <nav aria-label="Main navigation" className="order-3 w-full sm:order-0 sm:w-auto">
            {/* Phones: four equal columns with the icon above a small label. From sm upwards: one row. */}
            <ul className="grid grid-cols-4 gap-1 sm:flex">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-xs transition-colors sm:flex-row sm:gap-2 sm:px-3 sm:text-sm ${
                        isActive ? 'bg-slate-800 text-emerald-300' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                      }`
                    }
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto">
            <ServerStatus />
          </div>
        </div>
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 focus:outline-none">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-400">
        CyberLab · Learn Cybersecurity by Doing · All exercises run in a simulated environment
      </footer>
      <ScrollRestoration />
    </div>
  )
}
