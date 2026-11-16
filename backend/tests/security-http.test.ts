import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { challenges, modules } from '../src/content/index.js'
import { seedContent } from '../src/db/seed.js'
import { hostnameOf } from '../src/middleware/security.js'
import { trackedDatabases } from './helpers.js'

const databases = trackedDatabases()
afterEach(() => {
  databases.closeAll()
  vi.restoreAllMocks()
})

function setup() {
  const db = databases.open()
  seedContent(db, modules, challenges)
  return { db, app: createApp({ db }) }
}

/** Every endpoint of the API with a valid request, used for checks that must hold everywhere. */
const ENDPOINTS: { method: 'get' | 'post'; path: string; body?: object }[] = [
  { method: 'get', path: '/api/health' },
  { method: 'get', path: '/api/dashboard' },
  { method: 'get', path: '/api/modules' },
  { method: 'get', path: '/api/modules/linux-basics' },
  { method: 'get', path: '/api/challenges' },
  { method: 'get', path: '/api/challenges/linux-find-note' },
  { method: 'post', path: '/api/challenges/linux-find-note/hints', body: { hintNumber: 1 } },
  { method: 'post', path: '/api/challenges/linux-find-note/submit', body: { answer: 'wrong' } },
  { method: 'post', path: '/api/terminal/execute', body: { challengeId: 'linux-find-note', command: 'ls' } },
  { method: 'get', path: '/api/progress' },
  { method: 'get', path: '/api/activity' },
  { method: 'post', path: '/api/progress/reset', body: { confirm: 'RESET' } },
]

const send = (app: ReturnType<typeof setup>['app'], endpoint: (typeof ENDPOINTS)[number]) =>
  endpoint.method === 'get' ? request(app).get(endpoint.path) : request(app).post(endpoint.path).send(endpoint.body!)

const progressRows = (db: ReturnType<typeof setup>['db']) => (db.prepare('SELECT COUNT(*) AS n FROM challenge_progress').get() as { n: number }).n

describe('every endpoint', () => {
  it('answers a valid request with JSON and the security headers', async () => {
    const { app } = setup()
    for (const endpoint of ENDPOINTS) {
      const response = await send(app, endpoint)
      expect(response.status, endpoint.path).toBe(200)
      expect(response.headers['content-type'], endpoint.path).toMatch(/^application\/json/)
      expect(response.headers).toMatchObject({
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
        'x-frame-options': 'DENY',
        'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
        'cross-origin-resource-policy': 'same-origin',
        'cache-control': 'no-store',
      })
      expect(response.headers['x-powered-by'], endpoint.path).toBeUndefined()
    }
  })

  it('rejects malformed input with 400 and the standard error shape', async () => {
    const { app } = setup()
    const invalid: [string, () => request.Test][] = [
      ['module id', () => request(app).get('/api/modules/..%2F..%2Fetc')],
      ['challenge id', () => request(app).get("/api/challenges/x'%20OR%20'1'='1")],
      ['hint number', () => request(app).post('/api/challenges/linux-find-note/hints').send({ hintNumber: '1' })],
      ['answer type', () => request(app).post('/api/challenges/linux-find-note/submit').send({ answer: ['TUX-4821'] })],
      ['terminal body', () => request(app).post('/api/terminal/execute').send({ command: 'ls' })],
      ['activity limit', () => request(app).get('/api/activity?limit=1;DROP%20TABLE%20scans')],
      ['reset word', () => request(app).post('/api/progress/reset').send({ confirm: 'yes' })],
    ]
    for (const [name, call] of invalid) {
      const response = await call()
      expect(response.status, name).toBe(400)
      expect(response.body.error, name).toEqual(expect.objectContaining({ code: expect.any(String), message: expect.any(String) }))
    }
  })
})

describe('DNS-rebinding protection (Host header allowlist)', () => {
  it('accepts the local host names', async () => {
    const { app } = setup()
    for (const host of ['localhost:4000', '127.0.0.1:5173', '[::1]:4000', 'LOCALHOST']) {
      expect((await request(app).get('/api/health').set('Host', host)).status, host).toBe(200)
    }
  })

  it('refuses requests addressed to any other host name', async () => {
    const { app } = setup()
    for (const host of ['evil.example', 'evil.example:4000', 'localhost.evil.example', '127.0.0.1.nip.io', '192.168.1.20:4000']) {
      const response = await request(app).get('/api/progress').set('Host', host)
      expect(response.status, host).toBe(403)
      expect(response.body.error.code).toBe('HOST_NOT_ALLOWED')
    }
  })

  it('can be extended through configuration', async () => {
    const db = databases.open()
    const app = createApp({ db, allowedHosts: ['lab-pc.local'] })
    expect((await request(app).get('/api/health').set('Host', 'lab-pc.local:4000')).status).toBe(200)
    expect((await request(app).get('/api/health').set('Host', 'localhost:4000')).status).toBe(403)
  })

  it('parses host names with ports and IPv6 brackets', () => {
    expect(hostnameOf('LocalHost:4000')).toBe('localhost')
    expect(hostnameOf('[::1]:4000')).toBe('[::1]')
    expect(hostnameOf('127.0.0.1')).toBe('127.0.0.1')
  })
})

describe('cross-site request forgery', () => {
  it('rejects POSTs that are not JSON, so an HTML form on another site cannot reset progress', async () => {
    const { db, app } = setup()
    await request(app).post('/api/challenges/linux-find-note/submit').send({ answer: 'TUX-4821' })
    const attempts: [string, string][] = [
      ['text/plain', '{"confirm":"RESET"}'],
      ['application/x-www-form-urlencoded', 'confirm=RESET'],
      ['multipart/form-data; boundary=x', '--x\r\nContent-Disposition: form-data; name="confirm"\r\n\r\nRESET\r\n--x--'],
    ]
    for (const [type, payload] of attempts) {
      const response = await request(app).post('/api/progress/reset').set('Content-Type', type).send(payload)
      expect(response.status, type).toBe(415)
      expect(response.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE')
    }
    expect((await request(app).post('/api/progress/reset')).status).toBe(415) // no body, no content type
    expect(progressRows(db)).toBe(1)
  })

  it('never grants cross-origin access (no CORS headers, preflights are not approved)', async () => {
    const { app } = setup()
    const preflight = await request(app)
      .options('/api/progress/reset')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
    expect(preflight.headers['access-control-allow-origin']).toBeUndefined()
    const get = await request(app).get('/api/progress').set('Origin', 'https://evil.example')
    expect(get.headers['access-control-allow-origin']).toBeUndefined()
  })
})

describe('methods and unknown paths', () => {
  it('answers a wrong method on a known path with 405 and an Allow header', async () => {
    const { app } = setup()
    const cases: [request.Test, string][] = [
      [request(app).get('/api/progress/reset'), 'POST'],
      [request(app).delete('/api/dashboard'), 'GET'],
      [request(app).put('/api/challenges/linux-find-note/submit').send({ answer: 'x' }), 'POST'],
      [request(app).delete('/api/health'), 'GET'],
    ]
    for (const [call, allow] of cases) {
      const response = await call
      expect(response.status).toBe(405)
      expect(response.headers.allow).toBe(allow)
      expect(response.body.error.code).toBe('METHOD_NOT_ALLOWED')
    }
  })

  it('returns JSON 404s for every unknown path, including non-API ones', async () => {
    const { app } = setup()
    for (const path of ['/', '/index.html', '/api', '/api/unknown', '/.env', '/backend/data/cyberlab.sqlite']) {
      const response = await request(app).get(path)
      expect(response.status, path).toBe(404)
      expect(response.body.error.code, path).toBe('NOT_FOUND')
    }
  })
})

describe('injection attempts', () => {
  it('treats SQL in answers and terminal commands as plain text', async () => {
    const { db, app } = setup()
    const payloads = ["' OR '1'='1", "x'); DROP TABLE challenge_progress; --", '1; DELETE FROM modules']
    for (const answer of payloads) {
      const response = await request(app).post('/api/challenges/linux-find-note/submit').send({ answer })
      expect(response.body.outcome).toBe('incorrect')
      await request(app).post('/api/terminal/execute').send({ challengeId: 'linux-find-note', command: `cat "${answer}"` })
    }
    expect(db.prepare('SELECT COUNT(*) AS n FROM modules').get()).toEqual({ n: 7 })
    expect(progressRows(db)).toBe(1)
  })

  it('rejects prototype-pollution payloads and leaves Object.prototype untouched', async () => {
    const { app } = setup()
    const payloads = [
      '{"answer":"x","__proto__":{"polluted":true}}',
      '{"answer":"x","constructor":{"prototype":{"polluted":true}}}',
      '{"challengeId":"linux-find-note","command":"ls","__proto__":{"polluted":true}}',
    ]
    for (const payload of payloads) {
      const path = payload.includes('challengeId') ? '/api/terminal/execute' : '/api/challenges/linux-find-note/submit'
      const response = await request(app).post(path).set('Content-Type', 'application/json').send(payload)
      expect(response.status, payload).toBe(400)
    }
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('survives deeply nested and oversized JSON', async () => {
    const { app } = setup()
    const deep = `{"answer":${'['.repeat(3000)}${']'.repeat(3000)}}`
    expect((await request(app).post('/api/challenges/linux-find-note/submit').set('Content-Type', 'application/json').send(deep)).status).toBe(400)
    const huge = JSON.stringify({ answer: 'x'.repeat(20_000) })
    expect((await request(app).post('/api/challenges/linux-find-note/submit').set('Content-Type', 'application/json').send(huge)).status).toBe(413)
  })
})

describe('unexpected errors', () => {
  it('return a generic 500 without internal details', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { db, app } = setup()
    db.close()
    const response = await request(app).get('/api/dashboard')
    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } })
    expect(JSON.stringify(response.body)).not.toMatch(/sqlite|database|stack|\.ts/i)
    expect(consoleError).toHaveBeenCalled()
  })
})
