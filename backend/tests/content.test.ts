import { describe, expect, it } from 'vitest'
import { challenges, environments, modules } from '../src/content/index.js'
import type { FsNode, TerminalEnvironment } from '../src/content/environments.js'

const KNOWN_EXTRA_COMMANDS = ['grep', 'find', 'ipconfig', 'ping', 'base64']
const SLUG = /^[a-z0-9-]{1,64}$/

function fileContents(node: FsNode): string[] {
  return node.type === 'file' ? [node.content] : Object.values(node.children).flatMap(fileContents)
}

/** Everything a learner can observe in an environment: files, Base64-decoded files (if base64 exists), network data. */
function observableText(environment: TerminalEnvironment): string {
  const files = fileContents(environment.root)
  const decoded = environment.extraCommands.includes('base64')
    ? files.filter((text) => /^[A-Za-z0-9+/=\s]+$/.test(text)).map((text) => Buffer.from(text.trim(), 'base64').toString('utf8'))
    : []
  const network = environment.network
    ? [JSON.stringify(environment.network.interfaces), ...Object.entries(environment.network.hosts).flatMap(([name, host]) => [name, host.ip])]
    : []
  return [...files, ...decoded, ...network].join('\n').toLowerCase()
}

function caesar(text: string, shift: number): string {
  return text.replace(/[A-Z]/g, (letter) => String.fromCharCode(((letter.charCodeAt(0) - 65 - shift + 26) % 26) + 65))
}

describe('course content', () => {
  it('has 7 modules with 2 challenges each, in a consistent order', () => {
    expect(modules).toHaveLength(7)
    expect(challenges).toHaveLength(14)
    expect(modules.map((module) => module.order)).toEqual([1, 2, 3, 4, 5, 6, 7])
    for (const module of modules) {
      const own = challenges.filter((challenge) => challenge.moduleId === module.id)
      expect(own.map((challenge) => challenge.order), module.id).toEqual([1, 2])
    }
  })

  it('uses unique slug ids and only references existing modules and environments', () => {
    const moduleIds = modules.map((module) => module.id)
    const challengeIds = challenges.map((challenge) => challenge.id)
    expect(new Set(moduleIds).size).toBe(moduleIds.length)
    expect(new Set(challengeIds).size).toBe(challengeIds.length)
    for (const id of [...moduleIds, ...challengeIds]) expect(id).toMatch(SLUG)
    for (const challenge of challenges) {
      expect(moduleIds, challenge.id).toContain(challenge.moduleId)
      if (challenge.terminalEnv) expect(environments.map((environment) => environment.id), challenge.id).toContain(challenge.terminalEnv)
    }
  })

  it('gives every challenge complete teaching material', () => {
    for (const challenge of challenges) {
      expect(challenge.hints, challenge.id).toHaveLength(3)
      expect(challenge.hints.every((hint) => hint.trim().length > 10), challenge.id).toBe(true)
      expect(challenge.instructions.length, challenge.id).toBeGreaterThanOrEqual(2)
      expect(challenge.resources.length, challenge.id).toBeGreaterThanOrEqual(1)
      const { explanation } = challenge
      for (const field of [explanation.solution, explanation.why, explanation.concept, explanation.realWorld]) {
        expect(field.trim().length, challenge.id).toBeGreaterThan(5)
      }
      expect(explanation.commonMistakes.length, challenge.id).toBeGreaterThanOrEqual(2)
      if (challenge.terminalEnv) expect(explanation.commands.length, `${challenge.id} should explain its commands`).toBeGreaterThan(0)
    }
  })

  it('defines valid answer rules', () => {
    for (const challenge of challenges) {
      if (challenge.answer.type === 'choice') {
        const ids = challenge.answer.options.map((option) => option.id)
        expect(new Set(ids).size, challenge.id).toBe(ids.length)
        expect(ids.length, challenge.id).toBeGreaterThanOrEqual(3)
        expect(ids, challenge.id).toContain(challenge.answer.correct)
      } else {
        expect(challenge.answer.accepted.length, challenge.id).toBeGreaterThan(0)
        expect(challenge.answer.accepted.every((answer) => answer.trim() === answer && answer.length > 0), challenge.id).toBe(true)
      }
    }
  })

  it('only uses terminal commands the engine is designed to support', () => {
    for (const environment of environments) {
      for (const command of environment.extraCommands) expect(KNOWN_EXTRA_COMMANDS, environment.id).toContain(command)
      expect(environment.home.startsWith('/'), environment.id).toBe(true)
    }
  })

  it('makes every terminal answer discoverable inside its environment', () => {
    for (const challenge of challenges.filter((item) => item.terminalEnv)) {
      const environment = environments.find((item) => item.id === challenge.terminalEnv)!
      if (challenge.answer.type !== 'text') throw new Error(`${challenge.id}: terminal challenges use typed answers`)
      const text = observableText(environment)
      expect(
        challenge.answer.accepted.some((answer) => text.includes(answer.toLowerCase())),
        `${challenge.id}: answer not found in environment ${environment.id}`,
      ).toBe(true)
    }
  })

  it('has solvable non-terminal text challenges', () => {
    const caesarChallenge = challenges.find((challenge) => challenge.id === 'crypto-caesar')!
    expect(caesar('WKH YDXOW FRGH LV ILUHIOB', 3)).toBe('THE VAULT CODE IS FIREFLY')
    expect(caesarChallenge.scenario).toContain('WKH YDXOW FRGH LV ILUHIOB')
    const phishing = challenges.find((challenge) => challenge.id === 'phishing-real-domain')!
    expect(phishing.scenario).toContain('https://paypal.com.account-verify.co/login')
  })
})
