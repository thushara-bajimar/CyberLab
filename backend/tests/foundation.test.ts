import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { BACKEND_ROOT, loadConfig } from '../src/config.js'
import { openDatabase, type DB } from '../src/db/connection.js'
import { GUEST_USER_ID, SCHEMA_VERSION } from '../src/db/schema.js'

const opened: DB[] = []
function memoryDb(): DB {
  const db = openDatabase(':memory:')
  opened.push(db)
  return db
}
afterEach(() => {
  while (opened.length) opened.pop()?.close()
})

describe('GET /api/health', () => {
  it('reports the API and database as healthy', async () => {
    const response = await request(createApp({ db: memoryDb() })).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'ok',
      service: 'cyberlab-api',
      database: { status: 'ok', schemaVersion: SCHEMA_VERSION },
    })
  })

  it('reports 503 when the database cannot be queried', async () => {
    const db = openDatabase(':memory:')
    const app = createApp({ db })
    db.close()
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(503)
    expect(response.body.database.status).toBe('unavailable')
  })

  it('does not advertise the server framework', async () => {
    const response = await request(createApp({ db: memoryDb() })).get('/api/health')
    expect(response.headers['x-powered-by']).toBeUndefined()
  })
})

describe('error responses', () => {
  it('returns the standard error shape for unknown API routes', async () => {
    const response = await request(createApp({ db: memoryDb() })).get('/api/does-not-exist')
    expect(response.status).toBe(404)
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'This API endpoint does not exist.' } })
  })

  it('rejects malformed JSON with 400', async () => {
    const response = await request(createApp({ db: memoryDb() }))
      .post('/api/anything')
      .set('Content-Type', 'application/json')
      .send('{"broken": ')
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_JSON')
  })

  it('rejects bodies larger than 10 KB with 413', async () => {
    const response = await request(createApp({ db: memoryDb() }))
      .post('/api/anything')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ text: 'x'.repeat(11 * 1024) }))
    expect(response.status).toBe(413)
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE')
  })
})

describe('database schema', () => {
  it('creates every table and the guest learner profile', () => {
    const db = memoryDb()
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((row) => (row as { name: string }).name)
    expect(tables).toEqual(['activity_log', 'challenge_hints', 'challenge_progress', 'challenges', 'modules', 'users'])
    expect(db.prepare('SELECT id, display_name FROM users').all()).toEqual([{ id: GUEST_USER_ID, display_name: 'Learner' }])
  })

  it('enforces foreign keys and CHECK constraints', () => {
    const db = memoryDb()
    const now = new Date().toISOString()
    // Progress for a challenge that does not exist violates the foreign key.
    expect(() =>
      db.prepare('INSERT INTO challenge_progress (user_id, challenge_id, status, started_at) VALUES (1, ?, ?, ?)').run('missing', 'in_progress', now),
    ).toThrow(/FOREIGN KEY/)
    // An unknown difficulty violates a CHECK constraint.
    expect(() =>
      db.prepare(
        "INSERT INTO modules (id, title, summary, introduction, concept, objectives_json, difficulty, sort_order) VALUES ('m', 't', 's', 'i', 'c', '[]', 'expert', 1)",
      ).run(),
    ).toThrow(/CHECK/)
  })

  it('keeps data in the database file after it is closed and reopened', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberlab-'))
    const file = path.join(directory, 'test.sqlite')
    try {
      const first = openDatabase(file)
      first.prepare('UPDATE users SET display_name = ? WHERE id = ?').run('Persisted', GUEST_USER_ID)
      first.close()
      const second = openDatabase(file)
      expect(second.prepare('SELECT display_name FROM users WHERE id = ?').get(GUEST_USER_ID)).toEqual({ display_name: 'Persisted' })
      second.close()
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  })
})

describe('configuration', () => {
  it('uses local defaults', () => {
    expect(loadConfig({})).toEqual({
      port: 4000,
      host: '127.0.0.1',
      databasePath: path.resolve(BACKEND_ROOT, 'data/cyberlab.sqlite'),
      allowedHosts: ['localhost', '127.0.0.1', '[::1]'],
    })
  })

  it('adds extra allowed host names from ALLOWED_HOSTS', () => {
    expect(loadConfig({ ALLOWED_HOSTS: ' Lab-PC.local , localhost' }).allowedHosts).toEqual(['localhost', '127.0.0.1', '[::1]', 'lab-pc.local'])
  })

  it('rejects an invalid port', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/)
  })
})
