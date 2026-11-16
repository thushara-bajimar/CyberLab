import { vi } from 'vitest'
import type { ChallengeDetail } from '../api/types'

/** A complete challenge object for component tests; override only what a test cares about. */
export function makeChallenge(overrides: Partial<ChallengeDetail> = {}): ChallengeDetail {
  return {
    id: 'linux-hidden-files',
    moduleId: 'linux-basics',
    moduleTitle: 'Linux & Command-Line Basics',
    title: 'Hidden Files',
    difficulty: 'beginner',
    answerType: 'text',
    usesTerminal: true,
    basePoints: 100,
    status: 'not_started',
    pointsAwarded: 0,
    scenario: 'A developer is about to publish a folder.',
    objective: 'Find the leaked password.',
    instructions: ['Look inside webapp.', 'Use ls -a.'],
    resources: [{ title: 'ls -a', body: 'Shows hidden files.' }],
    options: null,
    terminal: { environmentId: 'linux-hidden', title: 'Web developer workstation', user: 'student', hostname: 'dev-ws07', home: '/home/student' },
    scoring: { basePoints: 100, hintPenaltyPercent: 10, pointsAvailable: 100 },
    hints: { total: 3, used: 0, revealed: [] },
    progress: { status: 'not_started', attempts: 0, hintsUsed: 0, pointsAwarded: 0, startedAt: null, completedAt: null },
    explanation: null,
    navigation: { previousId: 'linux-find-note', nextId: 'networking-gateway' },
    ...overrides,
  }
}

export interface RecordedRequest {
  url: string
  method: string
  body: unknown
}

/**
 * Replaces window.fetch. `respond` receives each request and returns [status, json body].
 * Returns the list of recorded requests so tests can assert exactly what the browser sent.
 */
export function mockFetch(respond: (request: RecordedRequest) => [number, unknown] | Promise<[number, unknown]>) {
  const requests: RecordedRequest[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const request = { url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined }
      requests.push(request)
      const [status, json] = await respond(request)
      return new Response(JSON.stringify(json), { status, headers: { 'Content-Type': 'application/json' } })
    }),
  )
  return requests
}
