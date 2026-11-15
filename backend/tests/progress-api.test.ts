import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { challenges, modules } from '../src/content/index.js'
import { seedContent } from '../src/db/seed.js'
import { trackedDatabases } from './helpers.js'

const databases = trackedDatabases()
afterEach(() => databases.closeAll())

function setup() {
  const db = databases.open()
  seedContent(db, modules, challenges)
  let tick = Date.parse('2026-11-15T10:00:00.000Z')
  const app = createApp({ db, clock: () => new Date((tick += 1000)) })
  const hint = (id: string, hintNumber: number) => request(app).post(`/api/challenges/${id}/hints`).send({ hintNumber })
  const submit = (id: string, answer: string) => request(app).post(`/api/challenges/${id}/submit`).send({ answer })
  return { db, app, hint, submit }
}

describe('GET /api/progress', () => {
  it('describes an untouched course', async () => {
    const { app } = setup()
    const { status, body } = await request(app).get('/api/progress')
    expect(status).toBe(200)
    expect(body.totals).toEqual({
      challenges: 14,
      completed: 0,
      pending: 14,
      points: 0,
      possiblePoints: 1900,
      completionPercent: 0,
      attempts: 0,
      hintsUsed: 0,
      started: 0,
    })
    expect(body.challenges).toHaveLength(14)
    expect(body.challenges[0]).toMatchObject({ id: 'fundamentals-cia-triad', status: 'not_started', startedAt: null, completedAt: null })
    expect(body.modules.every((module: { completedAt: string | null }) => module.completedAt === null)).toBe(true)
    expect(body.recentActivity).toEqual([])
    expect(body.activityTotal).toBe(0)
  })

  it('reports per-challenge details, module completion and totals', async () => {
    const { app, hint, submit } = setup()
    await submit('fundamentals-cia-triad', 'a')
    await submit('fundamentals-cia-triad', 'c') // 10:00:02
    await hint('fundamentals-least-privilege', 1)
    await submit('fundamentals-least-privilege', 'c') // 10:00:04, 90 points
    await hint('crypto-caesar', 1)

    const { body } = await request(app).get('/api/progress')
    expect(body.totals).toMatchObject({ completed: 2, points: 190, attempts: 3, hintsUsed: 2, started: 3, completionPercent: 14 })
    const cia = body.challenges.find((challenge: { id: string }) => challenge.id === 'fundamentals-cia-triad')
    expect(cia).toMatchObject({ status: 'completed', attempts: 2, hintsUsed: 0, pointsAwarded: 100, basePoints: 100, completedAt: '2026-11-15T10:00:02.000Z' })
    const caesar = body.challenges.find((challenge: { id: string }) => challenge.id === 'crypto-caesar')
    expect(caesar).toMatchObject({ status: 'in_progress', attempts: 0, hintsUsed: 1, pointsAwarded: 0, completedAt: null })
    const fundamentals = body.modules.find((module: { id: string }) => module.id === 'fundamentals')
    expect(fundamentals).toMatchObject({ status: 'completed', completedChallenges: 2, pointsEarned: 190, completedAt: '2026-11-15T10:00:04.000Z' })
    expect(body.modules.find((module: { id: string }) => module.id === 'cryptography')).toMatchObject({ status: 'in_progress', completedAt: null })
    expect(body.activityTotal).toBe(5)
    expect(body.recentActivity[0]).toMatchObject({ challengeId: 'crypto-caesar', eventType: 'hint_revealed' })
  })
})

describe('GET /api/activity', () => {
  it('pages through the full history, newest first', async () => {
    const { app, submit } = setup()
    for (let attempt = 0; attempt < 5; attempt += 1) await submit('linux-find-note', `wrong-${attempt}`)
    const firstPage = await request(app).get('/api/activity?limit=2')
    expect(firstPage.body).toMatchObject({ total: 5, limit: 2, offset: 0 })
    expect(firstPage.body.items.map((item: { detail: string }) => item.detail)).toEqual(['Attempt 5 was not correct', 'Attempt 4 was not correct'])
    const lastPage = await request(app).get('/api/activity?limit=2&offset=4')
    expect(lastPage.body.items.map((item: { detail: string }) => item.detail)).toEqual(['Attempt 1 was not correct'])
    expect((await request(app).get('/api/activity')).body.limit).toBe(20)
  })

  it('validates paging parameters', async () => {
    const { app } = setup()
    for (const query of ['limit=0', 'limit=101', 'limit=abc', 'offset=-1', 'limit=2.5', 'sort=asc']) {
      const response = await request(app).get(`/api/activity?${query}`)
      expect(response.status, query).toBe(400)
    }
  })
})

describe('POST /api/progress/reset', () => {
  it('requires the exact confirmation word', async () => {
    const { db, app, submit } = setup()
    await submit('linux-find-note', 'TUX-4821')
    for (const body of [{}, { confirm: 'reset' }, { confirm: 'yes' }, { confirm: true }, { confirm: 'RESET', userId: 2 }]) {
      const response = await request(app).post('/api/progress/reset').send(body)
      expect(response.status, JSON.stringify(body)).toBe(400)
    }
    expect(db.prepare('SELECT COUNT(*) AS n FROM challenge_progress').get()).toEqual({ n: 1 })
  })

  it('deletes progress and activity, keeps the course, and makes challenges fresh again', async () => {
    const { db, app, hint, submit } = setup()
    await hint('crypto-caesar', 1)
    await submit('crypto-caesar', 'FIREFLY')
    await submit('linux-find-note', 'nope')

    const response = await request(app).post('/api/progress/reset').send({ confirm: 'RESET' })
    expect(response.status).toBe(200)
    expect(response.body.deleted).toEqual({ progressRows: 2, activityRows: 3 })
    expect(response.body.progress.totals).toMatchObject({ completed: 0, points: 0, attempts: 0, hintsUsed: 0, started: 0 })

    expect(db.prepare('SELECT COUNT(*) AS n FROM challenges').get()).toEqual({ n: 14 })
    expect(db.prepare('SELECT COUNT(*) AS n FROM users').get()).toEqual({ n: 1 })
    const caesar = (await request(app).get('/api/challenges/crypto-caesar')).body
    expect(caesar).toMatchObject({ status: 'not_started', pointsAwarded: 0, explanation: null })
    expect(caesar.hints).toEqual({ total: 3, used: 0, revealed: [] })
    expect((await request(app).get('/api/dashboard')).body.recentActivity).toEqual([])

    // The challenge can be completed and scored again after a reset.
    expect((await submit('crypto-caesar', 'FIREFLY')).body).toMatchObject({ outcome: 'correct', pointsAwarded: 200 })
  })

  it('is safe to repeat and only affects this learner', async () => {
    const { db, app, submit } = setup()
    db.prepare("INSERT INTO users (id, display_name, created_at) VALUES (2, 'Other', '2026-11-15T09:00:00Z')").run()
    db.prepare(
      "INSERT INTO challenge_progress (user_id, challenge_id, status, attempts, hints_used, points_awarded, started_at, completed_at) VALUES (2, 'linux-find-note', 'completed', 1, 0, 100, 'x', 'y')",
    ).run()
    db.prepare("INSERT INTO activity_log (user_id, challenge_id, event_type, detail, created_at) VALUES (2, 'linux-find-note', 'completed', '+100', 'y')").run()
    await submit('linux-find-note', 'TUX-4821')

    await request(app).post('/api/progress/reset').send({ confirm: 'RESET' })
    const again = await request(app).post('/api/progress/reset').send({ confirm: 'RESET' })
    expect(again.status).toBe(200)
    expect(again.body.deleted).toEqual({ progressRows: 0, activityRows: 0 })
    expect(db.prepare('SELECT user_id AS userId FROM challenge_progress').all()).toEqual([{ userId: 2 }])
    expect(db.prepare('SELECT user_id AS userId FROM activity_log').all()).toEqual([{ userId: 2 }])
  })
})
