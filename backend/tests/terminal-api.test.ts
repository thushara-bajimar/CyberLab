import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { challenges, modules } from '../src/content/index.js'
import { seedContent } from '../src/db/seed.js'
import { trackedDatabases } from './helpers.js'

const databases = trackedDatabases()
afterEach(() => databases.closeAll())

function app() {
  const db = databases.open()
  seedContent(db, modules, challenges)
  return createApp({ db })
}

const execute = (server: ReturnType<typeof app>, body: unknown) => request(server).post('/api/terminal/execute').send(body as object)

describe('POST /api/terminal/execute', () => {
  it('runs a command in the challenge environment', async () => {
    const response = await execute(app(), { challengeId: 'linux-find-note', command: 'ls' })
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ output: 'documents/  downloads/  README.txt', cwd: '/home/student', clear: false, isError: false })
  })

  it('keeps the current folder between requests through the client', async () => {
    const server = app()
    const first = await execute(server, { challengeId: 'linux-find-note', command: 'cd documents/onboarding', cwd: '/home/student' })
    expect(first.body.cwd).toBe('/home/student/documents/onboarding')
    const second = await execute(server, { challengeId: 'linux-find-note', command: 'cat note.txt', cwd: first.body.cwd })
    expect(second.body.output).toContain('TUX-4821')
  })

  it('uses the history sent by the client for the history command', async () => {
    const response = await execute(app(), { challengeId: 'linux-find-note', command: 'history', history: ['pwd', 'ls'] })
    expect(response.body.output).toBe('   1  pwd\n   2  ls\n   3  history')
  })

  it('returns 404 for an unknown challenge and 400 for a challenge without a terminal', async () => {
    const server = app()
    expect((await execute(server, { challengeId: 'no-such-challenge', command: 'ls' })).status).toBe(404)
    const noTerminal = await execute(server, { challengeId: 'crypto-caesar', command: 'ls' })
    expect(noTerminal.status).toBe(400)
    expect(noTerminal.body.error.code).toBe('NO_TERMINAL')
  })

  it('validates the request body', async () => {
    const server = app()
    const invalid: unknown[] = [
      {},
      { challengeId: 'linux-find-note' },
      { challengeId: 'linux-find-note', command: 42 },
      { challengeId: 'linux-find-note', command: 'x'.repeat(201) },
      { challengeId: 'linux-find-note', command: 'ls\ncat /etc/passwd' },
      { challengeId: 'linux-find-note', command: 'ls\u0000' },
      { challengeId: 'linux-find-note', command: 'ls', extra: true },
      { challengeId: 'linux-find-note', command: 'ls', history: Array.from({ length: 51 }, () => 'ls') },
      { challengeId: 'linux-find-note', command: 'ls', history: ['x'.repeat(201)] },
      { challengeId: 'linux-find-note', command: 'ls', cwd: 5 },
      { challengeId: '../../etc', command: 'ls' },
    ]
    for (const body of invalid) {
      const response = await execute(server, body)
      expect(response.status, JSON.stringify(body).slice(0, 80)).toBe(400)
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
    }
  })

  it('never echoes the submitted command in validation errors', async () => {
    const secret = 'my-secret-password-123'
    const response = await execute(app(), { challengeId: 'linux-find-note', command: `${secret}\n${'x'.repeat(250)}` })
    expect(response.status).toBe(400)
    expect(JSON.stringify(response.body)).not.toContain(secret)
  })

  it('treats a hostile command as text and answers with an explanation', async () => {
    const response = await execute(app(), { challengeId: 'forensics-server-does-not-exist'.slice(0, 16), command: 'ls' })
    expect(response.status).toBe(404)
    const hostile = await execute(app(), { challengeId: 'forensics-brute-force', command: 'cat /etc/passwd; rm -rf /' })
    expect(hostile.status).toBe(200)
    expect(hostile.body).toMatchObject({ isError: true, output: expect.stringMatching(/one command at a time/) })
  })
})
