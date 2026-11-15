import { describe, expect, it } from 'vitest'
import { challenges } from '../src/content/index.js'
import { findEnvironment, type TerminalEnvironment } from '../src/content/environments.js'
import { globMatch } from '../src/terminal/commands.js'
import { executeCommand, type ExecuteResult } from '../src/terminal/engine.js'
import { displayPath, lookup, resolvePath } from '../src/terminal/filesystem.js'
import { tokenize } from '../src/terminal/tokenizer.js'

const env = (id: string): TerminalEnvironment => findEnvironment(id)!
const run = (id: string, command: string, cwd?: string, history?: string[]): ExecuteResult => executeCommand(env(id), { command, cwd, history })

describe('tokenizer', () => {
  it('splits on spaces and keeps quoted text together', () => {
    expect(tokenize('  grep   "Failed password"  /var/log/auth.log ')).toEqual({ ok: true, tokens: ['grep', 'Failed password', '/var/log/auth.log'] })
    expect(tokenize("echo 'single quotes' \"\"")).toEqual({ ok: true, tokens: ['echo', 'single quotes', ''] })
    expect(tokenize('find / -name "*.sh"')).toEqual({ ok: true, tokens: ['find', '/', '-name', '*.sh'] })
  })

  it('treats operators inside quotes as plain text and keeps backslashes', () => {
    expect(tokenize('echo "a|b; c > d"')).toEqual({ ok: true, tokens: ['echo', 'a|b; c > d'] })
    expect(tokenize(String.raw`cat C:\Windows\win.ini`)).toEqual({ ok: true, tokens: ['cat', String.raw`C:\Windows\win.ini`] })
  })

  it('rejects shell operators, substitution and variables with an explanation', () => {
    const cases: [string, RegExp][] = [
      ['ls; whoami', /chaining/],
      ['ls && whoami', /chaining/],
      ['cat a | grep b', /Pipes/],
      ['echo hi > out.txt', /read-only/],
      ['cat < file', /redirection/],
      ['echo `id`', /backticks/],
      ['echo $(id)', /\$\( \)/],
      ['echo $HOME', /variables/i],
      ['echo ${PATH}', /variables/i],
      ['echo "unclosed', /closing quote/],
    ]
    for (const [input, message] of cases) {
      const result = tokenize(input)
      expect(result.ok, input).toBe(false)
      if (!result.ok) expect(result.error, input).toMatch(message)
    }
    expect(tokenize('echo price: $5')).toEqual({ ok: true, tokens: ['echo', 'price:', '$5'] })
  })

  it('limits the number of arguments', () => {
    expect(tokenize(Array.from({ length: 21 }, () => 'a').join(' ')).ok).toBe(false)
    expect(tokenize(Array.from({ length: 20 }, () => 'a').join(' ')).ok).toBe(true)
  })
})

describe('virtual filesystem paths', () => {
  it('resolves relative, absolute, home and parent paths', () => {
    expect(resolvePath('/home/student', 'documents/onboarding', '/home/student')).toBe('/home/student/documents/onboarding')
    expect(resolvePath('/home/student/documents', '..', '/home/student')).toBe('/home/student')
    expect(resolvePath('/var/log', '~', '/home/student')).toBe('/home/student')
    expect(resolvePath('/var/log', '~/documents', '/home/student')).toBe('/home/student/documents')
    expect(resolvePath('/home/student', '/etc//./hostname', '/home/student')).toBe('/etc/hostname')
  })

  it('never goes above the simulated root', () => {
    expect(resolvePath('/home/student', '../../../../../../etc', '/home/student')).toBe('/etc')
    expect(resolvePath('/', '..', '/home/student')).toBe('/')
  })

  it('does not resolve JavaScript object properties as files', () => {
    const root = env('linux-onboarding').root
    for (const name of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'prototype']) {
      expect(lookup(root, `/${name}`), name).toBeNull()
      expect(lookup(root, `/home/${name}`), name).toBeNull()
    }
  })

  it('shows home-relative paths with ~', () => {
    expect(displayPath('/home/student', '/home/student')).toBe('~')
    expect(displayPath('/home/student/docs', '/home/student')).toBe('~/docs')
    expect(displayPath('/home/studentx', '/home/student')).toBe('/home/studentx')
    expect(displayPath('/var/log', '/home/student')).toBe('/var/log')
  })
})

describe('commands', () => {
  it('pwd, whoami, echo, clear and history', () => {
    expect(run('linux-onboarding', 'pwd').output).toBe('/home/student')
    expect(run('forensics-server', 'whoami').output).toBe('analyst')
    expect(run('linux-onboarding', 'echo hello   "big world"').output).toBe('hello big world')
    expect(run('linux-onboarding', 'clear')).toMatchObject({ clear: true, output: '' })
    expect(run('linux-onboarding', 'history', undefined, ['pwd', 'ls']).output).toBe('   1  pwd\n   2  ls\n   3  history')
  })

  it('ls hides dotfiles unless -a is given, marks folders and supports -l', () => {
    expect(run('linux-hidden', 'ls webapp').output).toBe('app.js  index.html  README.md')
    expect(run('linux-hidden', 'ls -a webapp').output).toBe('.  ..  .env.backup  .gitignore  app.js  index.html  README.md')
    expect(run('linux-onboarding', 'ls').output).toBe('documents/  downloads/  README.txt')
    expect(run('linux-hidden', 'ls -l webapp').output).toMatch(/^-rw-r--r-- {2}student +\d+ {2}app\.js$/m)
    expect(run('linux-onboarding', 'ls downloads').output).toBe('')
    expect(run('linux-onboarding', 'ls missing')).toMatchObject({ isError: true, output: "ls: cannot access 'missing': No such file or directory" })
    expect(run('linux-onboarding', 'ls -x').isError).toBe(true)
  })

  it('cd changes folder, validates targets and returns home without arguments', () => {
    expect(run('linux-onboarding', 'cd documents/onboarding').cwd).toBe('/home/student/documents/onboarding')
    expect(run('linux-onboarding', 'cd', '/etc').cwd).toBe('/home/student')
    expect(run('linux-onboarding', 'cd ..', '/home/student/documents').cwd).toBe('/home/student')
    expect(run('linux-onboarding', 'cd README.txt')).toMatchObject({ isError: true, cwd: '/home/student' })
    expect(run('linux-onboarding', 'cd nowhere').output).toBe('cd: nowhere: No such file or directory')
  })

  it('cat reads files, reports folders and missing files', () => {
    expect(run('linux-onboarding', 'cat documents/onboarding/note.txt').output).toContain('Your lab access code is: TUX-4821')
    expect(run('linux-onboarding', 'cat documents')).toMatchObject({ isError: true, output: 'cat: documents: Is a directory' })
    expect(run('linux-onboarding', 'cat')).toMatchObject({ isError: true })
    expect(run('linux-onboarding', 'cat README.txt nope').output).toMatch(/Welcome[\s\S]*cat: nope: No such file or directory$/)
  })

  it('grep supports -i, -c, -n and -v and needs a file', () => {
    expect(run('password-audit', 'grep admin audit/accounts.txt').output.split('\n')).toHaveLength(3)
    expect(run('password-audit', 'grep -c admin audit/accounts.txt').output).toBe('3')
    expect(run('password-audit', 'grep -ic ADMIN audit/accounts.txt').output).toBe('3')
    expect(run('password-audit', 'grep -n rkhan audit/accounts.txt').output).toMatch(/^7:rkhan/)
    expect(run('forensics-server', 'grep -v Failed /var/log/auth.log').output).not.toContain('Failed')
    expect(run('password-audit', 'grep admin').isError).toBe(true)
    expect(run('password-audit', 'grep admin audit').output).toBe('grep: audit: Is a directory')
  })

  it('grep treats the pattern as plain text, not a regular expression', () => {
    expect(run('forensics-server', 'grep "203.0.113.4." /var/log/auth.log').output).toBe('')
    expect(run('forensics-server', 'grep "(a+)+$" /var/log/auth.log').output).toBe('')
  })

  it('find searches hidden folders and supports -name and -type', () => {
    expect(run('forensics-server', 'find / -name "*.sh"').output.split('\n')).toEqual(['/home/admin/backup.sh', '/opt/app/start.sh', '/tmp/.cache/sync.sh'])
    expect(run('forensics-server', 'find /tmp -type d').output.split('\n')).toEqual(['/tmp', '/tmp/.cache'])
    expect(run('forensics-server', 'find . -name case-notes.txt').output).toBe('./case-notes.txt')
    expect(run('forensics-server', 'find /var -name "*.zip"').output).toBe('')
    expect(run('forensics-server', 'find /nope').isError).toBe(true)
    expect(run('forensics-server', 'find / -exec rm').isError).toBe(true)
  })

  it('matches wildcards in linear time, even for hostile patterns', () => {
    expect(globMatch('*.sh', 'sync.sh')).toBe(true)
    expect(globMatch('s?nc.*', 'sync.sh')).toBe(true)
    expect(globMatch('*.sh', 'sync.shx')).toBe(false)
    expect(globMatch('', '')).toBe(true)
    const started = performance.now()
    expect(globMatch(`${'*'.repeat(150)}b`, 'a'.repeat(40))).toBe(false)
    expect(performance.now() - started).toBeLessThan(50)
  })

  it('ipconfig and ping use simulated network data only', () => {
    expect(run('network-office', 'ipconfig').output).toMatch(/Default Gateway\.+ : 192\.168\.10\.1/)
    const down = run('network-office', 'ping backup.lab').output
    expect(down).toContain('Request timed out (icmp_seq=4)')
    expect(down).toContain('4 packets transmitted, 0 received, 100% packet loss')
    expect(run('network-office', 'ping -c 2 10.0.5.10').output).toContain('2 packets transmitted, 2 received, 0% packet loss')
    expect(run('network-office', 'ping example.com')).toMatchObject({ isError: true, output: 'ping: example.com: Name or service not known' })
    expect(run('network-office', 'ping -c 1000 mail.lab').isError).toBe(true)
  })

  it('base64 encodes and decodes files', () => {
    expect(run('crypto-workbench', 'base64 -d app/db_password.txt').output).toBe('Orchid-77')
    expect(run('crypto-workbench', 'base64 app/db_password.txt').output).toBe(Buffer.from('T3JjaGlkLTc3\n').toString('base64'))
    expect(run('crypto-workbench', 'base64 -d app/config.ini')).toMatchObject({ isError: true })
  })

  it('only offers each environment its own commands', () => {
    const help = run('linux-onboarding', 'help').output
    expect(help).toContain('cat FILE...')
    expect(help).not.toContain('ping')
    expect(run('linux-onboarding', 'ping mail.lab').output).toBe('ping: not available in this challenge. Type "help" to see the commands you can use here.')
    expect(run('network-office', 'help').output).toContain('ping [-c COUNT] HOST')
  })

  it('ignores empty input', () => {
    expect(run('linux-onboarding', '   ')).toEqual({ output: '', cwd: '/home/student', clear: false, isError: false })
  })
})

describe('every terminal challenge is solvable with the commands in its explanation', () => {
  for (const challenge of challenges.filter((item) => item.terminalEnv)) {
    it(challenge.id, () => {
      let cwd: string | undefined
      const outputs: string[] = []
      for (const { command } of challenge.explanation.commands) {
        const result = executeCommand(env(challenge.terminalEnv!), { command, cwd })
        expect(result.isError, `${challenge.id}: "${command}" failed: ${result.output}`).toBe(false)
        cwd = result.cwd
        outputs.push(result.output)
      }
      if (challenge.answer.type !== 'text') throw new Error('terminal challenges use typed answers')
      const all = outputs.join('\n').toLowerCase()
      expect(challenge.answer.accepted.some((answer) => all.includes(answer.toLowerCase())), `${challenge.id}: answer not shown by its commands`).toBe(true)
    })
  }
})
