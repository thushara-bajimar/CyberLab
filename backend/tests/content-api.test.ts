import request from 'supertest'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { challenges, modules } from '../src/content/index.js'
import { seedContent } from '../src/db/seed.js'
import { insertProgress, trackedDatabases } from './helpers.js'

const databases = trackedDatabases()
afterEach(() => databases.closeAll())

function seededApp() {
  const db = databases.open()
  seedContent(db, modules, challenges)
  return { db, app: createApp({ db }) }
}

describe('GET /api/modules', () => {
  it('lists the modules in learning order with progress counts', async () => {
    const { db, app } = seededApp()
    insertProgress(db, 'linux-find-note', { status: 'completed', points: 90, hintsUsed: 1 })
    insertProgress(db, 'linux-hidden-files', { status: 'in_progress' })

    const response = await request(app).get('/api/modules')
    expect(response.status).toBe(200)
    expect(response.body.modules.map((module: { id: string }) => module.id)).toEqual(modules.map((module) => module.id))
    const linux = response.body.modules.find((module: { id: string }) => module.id === 'linux-basics')
    expect(linux).toMatchObject({ totalChallenges: 2, completedChallenges: 1, pointsEarned: 90, pointsPossible: 200, status: 'in_progress' })
    expect(response.body.modules[0]).toMatchObject({ id: 'fundamentals', status: 'not_started', completedChallenges: 0 })
  })
})

describe('GET /api/modules/:moduleId', () => {
  it('returns the module introduction, objectives and its challenges', async () => {
    const { app } = seededApp()
    const response = await request(app).get('/api/modules/forensics')
    expect(response.status).toBe(200)
    expect(response.body).toMatchObject({ id: 'forensics', title: 'Digital Forensics Basics', difficulty: 'intermediate', pointsPossible: 400 })
    expect(response.body.objectives.length).toBeGreaterThan(0)
    expect(response.body.challenges.map((challenge: { id: string }) => challenge.id)).toEqual(['forensics-brute-force', 'forensics-find-script'])
    expect(response.body.challenges[0]).toMatchObject({ usesTerminal: true, basePoints: 200, status: 'not_started' })
  })

  it('returns 404 for an unknown module and 400 for a malformed id', async () => {
    const { app } = seededApp()
    const missing = await request(app).get('/api/modules/no-such-module')
    expect(missing.status).toBe(404)
    expect(missing.body.error.code).toBe('NOT_FOUND')
    const malformed = await request(app).get('/api/modules/Bad_Id')
    expect(malformed.status).toBe(400)
    expect(malformed.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/challenges', () => {
  it('lists all 14 challenges in learning order', async () => {
    const { app } = seededApp()
    const response = await request(app).get('/api/challenges')
    expect(response.status).toBe(200)
    expect(response.body.challenges.map((challenge: { id: string }) => challenge.id)).toEqual(challenges.map((challenge) => challenge.id))
  })
})

describe('GET /api/challenges/:challengeId', () => {
  it('never exposes answers, unrevealed hints or the explanation of an unfinished challenge', async () => {
    const { app } = seededApp()
    for (const challenge of challenges) {
      const response = await request(app).get(`/api/challenges/${challenge.id}`)
      expect(response.status).toBe(200)
      const json = JSON.stringify(response.body)
      expect(response.body).not.toHaveProperty('answer')
      expect(json).not.toContain('"correct"')
      expect(json).not.toContain('"accepted"')
      expect(response.body.explanation).toBeNull()
      expect(response.body.hints).toEqual({ total: 3, used: 0, revealed: [] })
      // An answer may only appear if the challenge deliberately shows it (e.g. the URL to analyse in the scenario).
      if (challenge.answer.type === 'text') {
        const visible = [challenge.scenario, ...challenge.instructions, ...challenge.resources.map((resource) => resource.body)].join(' ')
        for (const answer of challenge.answer.accepted) {
          if (!visible.includes(answer)) expect(json, `${challenge.id} leaks its answer`).not.toContain(answer)
        }
      }
    }
  })

  it('describes a terminal challenge with its environment and scoring', async () => {
    const { app } = seededApp()
    const { body } = await request(app).get('/api/challenges/networking-ping')
    expect(body.terminal).toEqual({ environmentId: 'network-office', title: 'Office workstation', user: 'student', hostname: 'office-pc12', home: '/home/student' })
    expect(body.scoring).toEqual({ basePoints: 100, hintPenaltyPercent: 10, pointsAvailable: 100 })
    expect(body.options).toBeNull()
    expect(body.navigation).toEqual({ previousId: 'networking-gateway', nextId: 'passwords-strongest' })
  })

  it('sends choice options without marking the correct one', async () => {
    const { app } = seededApp()
    const { body } = await request(app).get('/api/challenges/fundamentals-cia-triad')
    expect(body.options).toHaveLength(4)
    expect(Object.keys(body.options[0]).sort()).toEqual(['id', 'text'])
    expect(body.terminal).toBeNull()
    expect(body.navigation.previousId).toBeNull()
  })

  it('shows only the hints already revealed and the points still available', async () => {
    const { db, app } = seededApp()
    insertProgress(db, 'forensics-find-script', { status: 'in_progress', hintsUsed: 2 })
    const { body } = await request(app).get('/api/challenges/forensics-find-script')
    expect(body.hints.used).toBe(2)
    expect(body.hints.revealed.map((hint: { number: number }) => hint.number)).toEqual([1, 2])
    expect(body.scoring.pointsAvailable).toBe(160)
    expect(body.progress).toMatchObject({ status: 'in_progress', hintsUsed: 2 })
    expect(body.navigation.nextId).toBeNull()
  })

  it('reveals the explanation and every hint once the challenge is completed', async () => {
    const { db, app } = seededApp()
    insertProgress(db, 'crypto-caesar', { status: 'completed', hintsUsed: 1, points: 180 })
    const { body } = await request(app).get('/api/challenges/crypto-caesar')
    expect(body.status).toBe('completed')
    expect(body.pointsAwarded).toBe(180)
    expect(body.explanation.solution).toContain('FIREFLY')
    expect(body.hints.revealed).toHaveLength(3)
    expect(body.scoring.pointsAvailable).toBeNull()
  })

  it('returns 404 for an unknown challenge', async () => {
    const { app } = seededApp()
    const response = await request(app).get('/api/challenges/does-not-exist')
    expect(response.status).toBe(404)
  })
})

describe('GET /api/dashboard with the real course content', () => {
  it('counts all challenges and recommends the first one', async () => {
    const { app } = seededApp()
    const { body } = await request(app).get('/api/dashboard')
    expect(body.totals).toEqual({ challenges: 14, completed: 0, pending: 14, points: 0, possiblePoints: 1900, completionPercent: 0 })
    expect(body.recommended).toMatchObject({ challengeId: 'fundamentals-cia-triad', reason: 'next', points: 100 })
    expect(body.modules).toHaveLength(7)
  })
})
