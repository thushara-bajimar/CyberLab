import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { challenges, modules } from '../src/content/index.js'
import { openDatabase, type DB } from '../src/db/connection.js'
import { seedContent } from '../src/db/seed.js'
import { trackedDatabases } from './helpers.js'

const databases = trackedDatabases()
afterEach(() => databases.closeAll())

function setup() {
  const db = databases.open()
  seedContent(db, modules, challenges)
  let tick = Date.parse('2026-11-15T10:00:00.000Z')
  const clock = () => new Date((tick += 1000))
  return { db, app: createApp({ db, clock }) }
}

const hint = (app: ReturnType<typeof setup>['app'], id: string, hintNumber: unknown) =>
  request(app).post(`/api/challenges/${id}/hints`).send({ hintNumber } as object)
const submit = (app: ReturnType<typeof setup>['app'], id: string, body: unknown) => request(app).post(`/api/challenges/${id}/submit`).send(body as object)
const activity = (db: DB) =>
  db.prepare('SELECT challenge_id AS challengeId, event_type AS type, detail FROM activity_log ORDER BY id').all() as {
    challengeId: string
    type: string
    detail: string
  }[]

describe('POST /api/challenges/:challengeId/hints', () => {
  it('reveals hints one at a time, lowers the available points and logs each reveal', async () => {
    const { db, app } = setup()
    const first = await hint(app, 'linux-hidden-files', 1)
    expect(first.status).toBe(200)
    expect(first.body.revealed).toBe(true)
    expect(first.body.challenge.hints.revealed.map((item: { number: number }) => item.number)).toEqual([1])
    expect(first.body.challenge.scoring.pointsAvailable).toBe(90)
    expect(first.body.challenge.status).toBe('in_progress')

    await hint(app, 'linux-hidden-files', 2)
    const third = await hint(app, 'linux-hidden-files', 3)
    expect(third.body.challenge.hints.used).toBe(3)
    expect(third.body.challenge.scoring.pointsAvailable).toBe(70)
    expect(activity(db).map((event) => event.detail)).toEqual([
      'Hint 1 of 3 revealed (-10 points)',
      'Hint 2 of 3 revealed (-10 points)',
      'Hint 3 of 3 revealed (-10 points)',
    ])
  })

  it('is idempotent: repeating a request (e.g. a double click) does not charge again', async () => {
    const { db, app } = setup()
    await hint(app, 'crypto-caesar', 1)
    const repeat = await hint(app, 'crypto-caesar', 1)
    expect(repeat.status).toBe(200)
    expect(repeat.body.revealed).toBe(false)
    expect(repeat.body.challenge.hints.used).toBe(1)
    expect(repeat.body.challenge.scoring.pointsAvailable).toBe(180)
    expect(activity(db)).toHaveLength(1)
  })

  it('refuses to skip hints and rejects invalid hint numbers', async () => {
    const { app } = setup()
    const skip = await hint(app, 'crypto-caesar', 3)
    expect(skip.status).toBe(409)
    expect(skip.body.error.code).toBe('HINT_ORDER')
    for (const invalid of [0, 4, 1.5, '1', null]) {
      expect((await hint(app, 'crypto-caesar', invalid)).status, String(invalid)).toBe(400)
    }
    expect((await hint(app, 'no-such-challenge', 1)).status).toBe(404)
  })

  it('does not charge for hints after the challenge is completed', async () => {
    const { app } = setup()
    await submit(app, 'phishing-real-domain', { answer: 'account-verify.co' })
    const response = await hint(app, 'phishing-real-domain', 1)
    expect(response.body.revealed).toBe(false)
    expect(response.body.challenge.pointsAwarded).toBe(100)
    expect(response.body.challenge.hints.revealed).toHaveLength(3)
  })
})

describe('POST /api/challenges/:challengeId/submit', () => {
  it('rejects a wrong answer without cost and counts the attempt', async () => {
    const { db, app } = setup()
    const response = await submit(app, 'linux-find-note', { answer: 'TUX-0000' })
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ outcome: 'incorrect', correct: false, pointsAwarded: 0, attempts: 1 })
    expect(response.body.challenge.explanation).toBeNull()
    expect(response.body.challenge.scoring.pointsAvailable).toBe(100)
    expect(activity(db)).toEqual([{ challengeId: 'linux-find-note', type: 'incorrect_attempt', detail: 'Attempt 1 was not correct' }])
  })

  it('awards full points for a correct answer and unlocks the explanation', async () => {
    const { app } = setup()
    const response = await submit(app, 'linux-find-note', { answer: '  tux-4821 ' })
    expect(response.body).toMatchObject({ outcome: 'correct', correct: true, pointsAwarded: 100, attempts: 1, message: 'Correct! You earned all 100 points.' })
    expect(response.body.challenge.status).toBe('completed')
    expect(response.body.challenge.explanation.solution).toContain('TUX-4821')
    expect(response.body.challenge.progress.completedAt).toBe('2026-11-15T10:00:01.000Z')
  })

  it('applies the hint penalty: 2 hints on an intermediate challenge give 160 of 200', async () => {
    const { db, app } = setup()
    await hint(app, 'forensics-brute-force', 1)
    await hint(app, 'forensics-brute-force', 2)
    await submit(app, 'forensics-brute-force', { answer: '192.0.2.15' })
    const response = await submit(app, 'forensics-brute-force', { answer: '203.0.113.45' })
    expect(response.body).toMatchObject({ outcome: 'correct', pointsAwarded: 160, attempts: 2 })
    expect(response.body.message).toBe('Correct! You earned 160 of 200 points (2 hints used).')
    expect(activity(db).at(-1)).toEqual({ challengeId: 'forensics-brute-force', type: 'completed', detail: 'Solved in 2 attempts with 2 hints: +160 points' })
  })

  it('never scores a completed challenge twice', async () => {
    const { db, app } = setup()
    await submit(app, 'networking-ping', { answer: 'backup.lab' })
    const before = db.prepare('SELECT * FROM challenge_progress').all()
    const eventsBefore = activity(db).length

    const again = await submit(app, 'networking-ping', { answer: '10.0.5.30' })
    expect(again.body).toMatchObject({ outcome: 'already_completed', correct: true, pointsAwarded: 100, attempts: 1 })
    const wrongAfter = await submit(app, 'networking-ping', { answer: 'mail.lab' })
    expect(wrongAfter.body).toMatchObject({ outcome: 'already_completed', correct: false, pointsAwarded: 100 })

    expect(db.prepare('SELECT * FROM challenge_progress').all()).toEqual(before)
    expect(activity(db)).toHaveLength(eventsBefore)
  })

  it('handles multiple-choice answers by option id', async () => {
    const { app } = setup()
    expect((await submit(app, 'fundamentals-cia-triad', { answer: 'a' })).body.outcome).toBe('incorrect')
    const invalid = await submit(app, 'fundamentals-cia-triad', { answer: 'Availability' })
    expect(invalid.status).toBe(400)
    expect(invalid.body.error.code).toBe('INVALID_CHOICE')
    const correct = await submit(app, 'fundamentals-cia-triad', { answer: 'c' })
    expect(correct.body).toMatchObject({ outcome: 'correct', pointsAwarded: 100, attempts: 2 })
  })

  it('ignores any score the client tries to send and validates the body', async () => {
    const { db, app } = setup()
    const forged = await submit(app, 'linux-find-note', { answer: 'TUX-4821', points: 9999, status: 'completed' })
    expect(forged.status).toBe(400)
    expect(db.prepare('SELECT COUNT(*) AS n FROM challenge_progress').get()).toEqual({ n: 0 })
    for (const body of [{}, { answer: '' }, { answer: '   ' }, { answer: 42 }, { answer: 'x'.repeat(201) }, { answer: 'a\nb' }]) {
      const response = await submit(app, 'linux-find-note', body)
      expect(response.status, JSON.stringify(body).slice(0, 40)).toBe(400)
    }
    expect((await submit(app, 'no-such-challenge', { answer: 'x' })).status).toBe(404)
  })

  it('updates the dashboard totals and activity', async () => {
    const { app } = setup()
    await hint(app, 'crypto-caesar', 1)
    await submit(app, 'crypto-caesar', { answer: 'firefly' })
    await submit(app, 'linux-find-note', { answer: 'wrong' })
    const { body } = await request(app).get('/api/dashboard')
    expect(body.totals).toMatchObject({ completed: 1, pending: 13, points: 180, possiblePoints: 1900, completionPercent: 7 })
    expect(body.recentActivity.map((item: { eventType: string }) => item.eventType)).toEqual(['incorrect_attempt', 'completed', 'hint_revealed'])
    expect(body.recommended).toMatchObject({ challengeId: 'linux-find-note', reason: 'continue' })
  })
})

describe('progress persistence', () => {
  it('keeps points, hints and completion after the server restarts', async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberlab-'))
    const file = path.join(directory, 'progress.sqlite')
    try {
      const first = openDatabase(file)
      seedContent(first, modules, challenges)
      const app = createApp({ db: first })
      await hint(app, 'passwords-policy-audit', 1)
      await submit(app, 'passwords-policy-audit', { answer: 'rkhan' })
      first.close()

      // "Restart": open the same file again and seed content again, as the real server does on start-up.
      const second = openDatabase(file)
      seedContent(second, modules, challenges)
      const restarted = createApp({ db: second })
      const { body } = await request(restarted).get('/api/challenges/passwords-policy-audit')
      expect(body).toMatchObject({ status: 'completed', pointsAwarded: 180 })
      expect(body.progress.hintsUsed).toBe(1)
      expect((await request(restarted).get('/api/dashboard')).body.totals.points).toBe(180)
      second.close()
    } finally {
      fs.rmSync(directory, { recursive: true, force: true })
    }
  })
})
