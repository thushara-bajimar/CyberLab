import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { insertActivity, insertChallenge, insertModule, insertProgress, trackedDatabases } from './helpers.js'

const databases = trackedDatabases()
afterEach(() => databases.closeAll())

describe('GET /api/dashboard', () => {
  it('returns zeros and no recommendation when there is no content', async () => {
    const response = await request(createApp({ db: databases.open() })).get('/api/dashboard')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      learner: { displayName: 'Learner' },
      totals: { challenges: 0, completed: 0, pending: 0, points: 0, possiblePoints: 0, completionPercent: 0 },
      modules: [],
      recentActivity: [],
      recommended: null,
    })
  })

  it('computes totals, module progress, activity and the recommendation from stored rows', async () => {
    const db = databases.open()
    insertModule(db, 'm1', 1)
    insertModule(db, 'm2', 2)
    insertChallenge(db, 'c1', 'm1', 1)
    insertChallenge(db, 'c2', 'm1', 2, 'intermediate')
    insertChallenge(db, 'c3', 'm2', 1)
    insertProgress(db, 'c1', { status: 'completed', hintsUsed: 1, points: 90 })
    insertProgress(db, 'c3', { status: 'in_progress', hintsUsed: 2 })
    insertActivity(db, 'c1', 'completed', '2026-11-15T10:00:00.000Z')
    insertActivity(db, 'c3', 'hint_revealed', '2026-11-15T11:00:00.000Z')

    const { body } = await request(createApp({ db })).get('/api/dashboard')
    expect(body.totals).toEqual({ challenges: 3, completed: 1, pending: 2, points: 90, possiblePoints: 400, completionPercent: 33 })
    expect(body.modules).toEqual([
      { id: 'm1', title: 'Module m1', difficulty: 'beginner', totalChallenges: 2, completedChallenges: 1 },
      { id: 'm2', title: 'Module m2', difficulty: 'beginner', totalChallenges: 1, completedChallenges: 0 },
    ])
    // Newest first, joined with challenge and module titles.
    expect(body.recentActivity.map((item: { challengeId: string }) => item.challengeId)).toEqual(['c3', 'c1'])
    expect(body.recentActivity[0]).toMatchObject({ challengeTitle: 'Challenge c3', moduleTitle: 'Module m2', eventType: 'hint_revealed' })
    // An in-progress challenge is recommended before an untouched one; 2 hints used -> 80 of 100 points left.
    expect(body.recommended).toEqual({
      challengeId: 'c3',
      title: 'Challenge c3',
      moduleId: 'm2',
      moduleTitle: 'Module m2',
      difficulty: 'beginner',
      points: 80,
      reason: 'continue',
    })
  })

  it('recommends the next untouched challenge in learning order, and nothing when all are done', async () => {
    const db = databases.open()
    insertModule(db, 'm1', 1)
    insertChallenge(db, 'c1', 'm1', 1)
    insertChallenge(db, 'c2', 'm1', 2)
    insertProgress(db, 'c1', { status: 'completed', points: 100 })
    const app = createApp({ db })

    expect((await request(app).get('/api/dashboard')).body.recommended).toMatchObject({ challengeId: 'c2', reason: 'next' })

    insertProgress(db, 'c2', { status: 'completed', points: 100 })
    const { body } = await request(app).get('/api/dashboard')
    expect(body.recommended).toBeNull()
    expect(body.totals.completionPercent).toBe(100)
  })
})
