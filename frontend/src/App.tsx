import { ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ApiError } from './api/client'
import { getHealth } from './api/endpoints'
import type { HealthResponse } from './api/types'

type HealthState = { kind: 'loading' } | { kind: 'ok'; health: HealthResponse } | { kind: 'error'; message: string }

/** Phase 1 foundation screen: proves the frontend can reach the API and the database. Replaced in Phase 2. */
function App() {
  const [state, setState] = useState<HealthState>({ kind: 'loading' })

  useEffect(() => {
    let active = true
    getHealth()
      .then((health) => active && setState({ kind: 'ok', health }))
      .catch((error: unknown) =>
        active && setState({ kind: 'error', message: error instanceof ApiError ? error.message : 'Unknown error.' }),
      )
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-4">
      <div className="flex items-center gap-3">
        <ShieldCheck className="size-10 text-emerald-400" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-semibold">CyberLab</h1>
          <p className="text-sm text-slate-400">Learn Cybersecurity by Doing.</p>
        </div>
      </div>
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4" aria-live="polite">
        <h2 className="mb-2 text-sm font-medium text-slate-300">System status</h2>
        {state.kind === 'loading' && <p className="text-slate-400">Checking the API…</p>}
        {state.kind === 'error' && <p className="text-rose-400">{state.message}</p>}
        {state.kind === 'ok' && (
          <dl className="grid grid-cols-2 gap-1 text-sm">
            <dt className="text-slate-400">API</dt>
            <dd className="text-emerald-400">{state.health.status}</dd>
            <dt className="text-slate-400">Database</dt>
            <dd className={state.health.database.status === 'ok' ? 'text-emerald-400' : 'text-rose-400'}>
              {state.health.database.status}
              {state.health.database.schemaVersion !== undefined && ` (schema v${state.health.database.schemaVersion})`}
            </dd>
          </dl>
        )}
      </section>
    </main>
  )
}

export default App
