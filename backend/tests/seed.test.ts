import { afterEach, describe, expect, it } from 'vitest'
import { challenges, modules } from '../src/content/index.js'
import type { ChallengeContent } from '../src/content/types.js'
import { seedContent } from '../src/db/seed.js'
import { insertProgress, trackedDatabases } from './helpers.js'

const databases = trackedDatabases()
afterEach(() => databases.closeAll())

const count = (db: ReturnType<typeof databases.open>, table: string) =>
  (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n

describe('seedContent', () => {
  it('loads all modules, challenges and hints', () => {
    const db = databases.open()
    seedContent(db, modules, challenges)
    expect(count(db, 'modules')).toBe(7)
    expect(count(db, 'challenges')).toBe(14)
    expect(count(db, 'challenge_hints')).toBe(42)
  })

  it('is idempotent and keeps learner progress when run again', () => {
    const db = databases.open()
    seedContent(db, modules, challenges)
    insertProgress(db, 'linux-find-note', { status: 'completed', points: 100 })
    seedContent(db, modules, challenges)
    expect(count(db, 'challenges')).toBe(14)
    expect(count(db, 'challenge_hints')).toBe(42)
    expect(db.prepare('SELECT points_awarded FROM challenge_progress WHERE challenge_id = ?').get('linux-find-note')).toEqual({ points_awarded: 100 })
  })

  it('applies edits and reordering without violating unique sort orders', () => {
    const db = databases.open()
    seedContent(db, modules, challenges)
    const swapped: ChallengeContent[] = challenges.map((challenge) =>
      challenge.moduleId === 'linux-basics' ? { ...challenge, order: challenge.order === 1 ? 2 : 1, title: `${challenge.title}!` } : challenge,
    )
    seedContent(db, [...modules].reverse().map((module, index) => ({ ...module, order: index + 1 })), swapped)
    expect(db.prepare('SELECT sort_order, title FROM challenges WHERE id = ?').get('linux-find-note')).toEqual({
      sort_order: 2,
      title: 'Find the Onboarding Note!',
    })
    expect(db.prepare('SELECT sort_order FROM modules WHERE id = ?').get('forensics')).toEqual({ sort_order: 1 })
  })

  it('removes content that no longer exists, together with its hints and progress', () => {
    const db = databases.open()
    seedContent(db, modules, challenges)
    insertProgress(db, 'crypto-caesar', { status: 'in_progress' })
    seedContent(db, modules, challenges.filter((challenge) => challenge.id !== 'crypto-caesar'))
    expect(count(db, 'challenges')).toBe(13)
    expect(db.prepare('SELECT COUNT(*) AS n FROM challenge_hints WHERE challenge_id = ?').get('crypto-caesar')).toEqual({ n: 0 })
    expect(db.prepare('SELECT COUNT(*) AS n FROM challenge_progress WHERE challenge_id = ?').get('crypto-caesar')).toEqual({ n: 0 })
  })

  it('leaves the previous content untouched if seeding fails', () => {
    const db = databases.open()
    seedContent(db, modules, challenges)
    const broken = [...challenges, { ...challenges[0]!, id: 'orphan', moduleId: 'missing-module', order: 9 }]
    expect(() => seedContent(db, modules, broken)).toThrow(/FOREIGN KEY/)
    expect(count(db, 'challenges')).toBe(14)
  })
})
