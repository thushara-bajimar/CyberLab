import { describe, expect, it } from 'vitest'
import { basePoints, pointsAfterHints } from '../src/services/scoring.js'

describe('scoring formula', () => {
  it('gives base points by difficulty', () => {
    expect(basePoints('beginner')).toBe(100)
    expect(basePoints('intermediate')).toBe(200)
    expect(basePoints('advanced')).toBe(300)
  })

  it('subtracts 10% of the base for each hint', () => {
    expect([0, 1, 2, 3].map((hints) => pointsAfterHints('beginner', hints))).toEqual([100, 90, 80, 70])
    expect([0, 1, 2, 3].map((hints) => pointsAfterHints('intermediate', hints))).toEqual([200, 180, 160, 140])
    expect(pointsAfterHints('advanced', 3)).toBe(210)
  })

  it('rejects impossible hint counts', () => {
    expect(() => pointsAfterHints('beginner', -1)).toThrow(RangeError)
    expect(() => pointsAfterHints('beginner', 4)).toThrow(RangeError)
    expect(() => pointsAfterHints('beginner', 1.5)).toThrow(RangeError)
  })
})
