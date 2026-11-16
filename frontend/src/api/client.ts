/**
 * The only place that talks to the backend. Every request goes to a relative /api path, which the Vite dev
 * server proxies to Express. Failures are converted to ApiError with the server's message when available.
 */
export class ApiError extends Error {
  readonly status?: number
  readonly code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

const UNREACHABLE = 'Cannot reach the CyberLab server. Make sure the backend is running (cd backend; npm run dev).'

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(UNREACHABLE)
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string } } | null)?.error
    if (error?.message) throw new ApiError(error.message, response.status, error.code)
    // A server error without a JSON body comes from the dev proxy, not CyberLab: the backend is not reachable.
    if (body === null && response.status >= 500) {
      throw new ApiError(`${UNREACHABLE} (HTTP ${response.status} from the proxy.)`, response.status)
    }
    throw new ApiError(`Request failed (HTTP ${response.status}).`, response.status)
  }
  return body as T
}
