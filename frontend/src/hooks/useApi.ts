import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'

export type ApiState<T> =
  | { status: 'loading'; data: null; error: null; notFound: false }
  | { status: 'success'; data: T; error: null; notFound: false }
  | { status: 'error'; data: null; error: string; notFound: boolean }

/**
 * Loads data from the API when the component mounts (and when `key` changes) and exposes loading / success /
 * error states plus a reload function. Responses that arrive after the component unmounted are ignored.
 */
export function useApi<T>(fetcher: () => Promise<T>, key: string = ''): ApiState<T> & { reload: () => void } {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading', data: null, error: null, notFound: false })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState({ status: 'loading', data: null, error: null, notFound: false })
    fetcher()
      .then((data) => active && setState({ status: 'success', data, error: null, notFound: false }))
      .catch((error: unknown) => {
        if (!active) return
        const apiError = error instanceof ApiError ? error : null
        setState({ status: 'error', data: null, error: apiError?.message ?? 'Something went wrong.', notFound: apiError?.status === 404 })
      })
    return () => {
      active = false
    }
    // The fetcher is recreated on every render; `key` and `attempt` decide when to load again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const reload = useCallback(() => setAttempt((value) => value + 1), [])
  return { ...state, reload }
}
