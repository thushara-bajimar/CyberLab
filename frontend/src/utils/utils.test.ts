import { describe, expect, it } from 'vitest'
import { ApiError, apiRequest } from '../api/client'
import { mockFetch } from '../test/helpers'
import { timeAgo } from './format'
import { displayPath } from './terminal'

describe('displayPath', () => {
  it('abbreviates the home folder with ~', () => {
    expect(displayPath('/home/student', '/home/student')).toBe('~')
    expect(displayPath('/home/student/documents', '/home/student')).toBe('~/documents')
    expect(displayPath('/home/studentx', '/home/student')).toBe('/home/studentx')
    expect(displayPath('/var/log', '/home/student')).toBe('/var/log')
  })
})

describe('timeAgo', () => {
  const now = new Date('2026-11-16T12:00:00Z')
  it('describes past times in words', () => {
    expect(timeAgo('2026-11-16T11:59:30Z', now)).toMatch(/30 seconds ago/)
    expect(timeAgo('2026-11-16T09:00:00Z', now)).toMatch(/3 hours ago/)
    expect(timeAgo('2026-11-15T12:00:00Z', now)).toMatch(/yesterday|1 day ago/)
  })
  it('returns unparseable input unchanged', () => {
    expect(timeAgo('not a date', now)).toBe('not a date')
  })
})

describe('apiRequest', () => {
  it('turns server errors into ApiError with status and code', async () => {
    mockFetch(() => [404, { error: { code: 'NOT_FOUND', message: 'Challenge was not found.' } }])
    const error = await apiRequest('/api/challenges/x').catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message: 'Challenge was not found.', status: 404, code: 'NOT_FOUND' })
  })

  it('explains when the server cannot be reached', async () => {
    const original = globalThis.fetch
    globalThis.fetch = () => Promise.reject(new TypeError('Failed to fetch'))
    try {
      await expect(apiRequest('/api/health')).rejects.toThrow('Cannot reach the CyberLab server')
    } finally {
      globalThis.fetch = original
    }
  })
})
