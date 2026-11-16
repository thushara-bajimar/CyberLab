import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = path.resolve(import.meta.dirname, '..')

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    if (entry.isDirectory()) return entry.name === 'test' ? [] : sourceFiles(full)
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [full] : []
  })
}

describe('frontend source security scan', () => {
  it('never injects HTML or evaluates code', () => {
    // React escapes text automatically; these APIs bypass that protection or run strings as code.
    const forbidden = [/dangerouslySetInnerHTML/, /\.innerHTML\s*=/, /\.outerHTML\s*=/, /insertAdjacentHTML/, /\beval\s*\(/, /new\s+Function\s*\(/, /document\.write/]
    const files = sourceFiles(SRC)
    expect(files.length).toBeGreaterThan(15)
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      for (const pattern of forbidden) expect(source, `${path.relative(SRC, file)} uses ${pattern}`).not.toMatch(pattern)
    }
  })

  it('keeps scores and answers on the server: the client never sends points or a status', () => {
    const endpoints = fs.readFileSync(path.join(SRC, 'api', 'endpoints.ts'), 'utf8')
    expect(endpoints).not.toMatch(/points|pointsAwarded|status:/)
    expect(endpoints).toContain("JSON.stringify({ answer })")
    expect(endpoints).toContain("JSON.stringify({ hintNumber })")
  })
})
