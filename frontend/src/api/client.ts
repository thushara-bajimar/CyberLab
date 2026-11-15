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
    throw new ApiError('Cannot reach the CyberLab server. Make sure the backend is running.')
  }

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string } } | null)?.error
    throw new ApiError(error?.message ?? `Request failed (HTTP ${response.status}).`, response.status, error?.code)
  }
  return body as T
}
