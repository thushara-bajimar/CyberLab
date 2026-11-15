import type { FsDirectory, FsNode, TerminalEnvironment } from '../content/environments.js'
import { isHidden, lookup, resolvePath } from './filesystem.js'

/**
 * Step 3 of the terminal: the command handlers. Each handler is a pure function: it reads the frozen,
 * in-memory environment and returns text. None of them reads the real disk, opens a network connection or
 * starts a process.
 */
export interface CommandContext {
  env: TerminalEnvironment
  cwd: string
  /** Earlier commands sent by the browser (used only by "history"). */
  history: string[]
  /** The full command line, including the current command. */
  line: string
  /** Names of the commands available in this environment (used by "help"). */
  available: string[]
}

export interface CommandOutput {
  output?: string
  cwd?: string
  clear?: boolean
  isError?: boolean
}

export interface CommandDefinition {
  name: string
  usage: string
  summary: string
  run(args: string[], context: CommandContext): CommandOutput
}

const fail = (message: string): CommandOutput => ({ output: message, isError: true })

/** Splits "-la" style options from operands. Only the listed option letters are accepted. */
function parseOptions(command: string, args: string[], allowed: string): { flags: Set<string>; operands: string[] } | CommandOutput {
  const flags = new Set<string>()
  const operands: string[] = []
  for (const arg of args) {
    if (arg.length > 1 && arg.startsWith('-') && operands.length === 0) {
      for (const letter of arg.slice(1)) {
        if (!allowed.includes(letter)) return fail(`${command}: unknown option -${letter}. Supported options: ${allowed.split('').map((l) => `-${l}`).join(' ') || 'none'}.`)
        flags.add(letter)
      }
    } else {
      operands.push(arg)
    }
  }
  return { flags, operands }
}

const isError = (value: unknown): value is CommandOutput => typeof value === 'object' && value !== null && 'isError' in value

function readFile(command: string, context: CommandContext, path: string): { content: string } | CommandOutput {
  const node = lookup(context.env.root, resolvePath(context.cwd, path, context.env.home))
  if (!node) return fail(`${command}: ${path}: No such file or directory`)
  if (node.type === 'dir') return fail(`${command}: ${path}: Is a directory`)
  return { content: node.content }
}

function sizeOf(node: FsNode): number {
  return node.type === 'file' ? Buffer.byteLength(node.content) : 4096
}

function listEntries(dir: FsDirectory, showHidden: boolean): [string, FsNode][] {
  const entries = Object.entries(dir.children).filter(([name]) => showHidden || !isHidden(name))
  entries.sort(([a], [b]) => a.localeCompare(b))
  return entries
}

const ls: CommandDefinition = {
  name: 'ls',
  usage: 'ls [-a] [-l] [PATH...]',
  summary: 'List files and folders (folders end with "/"; -a shows hidden files, -l shows details).',
  run(args, context) {
    const parsed = parseOptions('ls', args, 'al')
    if (isError(parsed)) return parsed
    const { flags, operands } = parsed
    const targets = operands.length ? operands : ['.']
    const sections: string[] = []
    let failed = false
    for (const target of targets) {
      const node = lookup(context.env.root, resolvePath(context.cwd, target, context.env.home))
      if (!node) {
        sections.push(`ls: cannot access '${target}': No such file or directory`)
        failed = true
        continue
      }
      const entries: [string, FsNode][] =
        node.type === 'file' ? [[target, node]] : [...(flags.has('a') ? ([['.', node], ['..', node]] as [string, FsNode][]) : []), ...listEntries(node, flags.has('a'))]
      const lines = entries.map(([name, entry]) => {
        const label = entry.type === 'dir' && name !== '.' && name !== '..' ? `${name}/` : name
        if (!flags.has('l')) return label
        const mode = entry.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--'
        return `${mode}  ${context.env.user.padEnd(8)} ${String(sizeOf(entry)).padStart(5)}  ${label}`
      })
      const body = flags.has('l') ? lines.join('\n') : lines.join('  ')
      sections.push(targets.length > 1 && node.type === 'dir' ? `${target}:\n${body}` : body)
    }
    return { output: sections.filter((section) => section !== '').join('\n\n'), isError: failed }
  },
}

const cd: CommandDefinition = {
  name: 'cd',
  usage: 'cd [PATH]',
  summary: 'Change the current folder ("cd .." goes up, "cd" alone goes home).',
  run(args, context) {
    if (args.length > 1) return fail('cd: too many arguments')
    const target = args[0] ?? '~'
    const path = resolvePath(context.cwd, target, context.env.home)
    const node = lookup(context.env.root, path)
    if (!node) return fail(`cd: ${target}: No such file or directory`)
    if (node.type !== 'dir') return fail(`cd: ${target}: Not a directory`)
    return { cwd: path }
  },
}

const cat: CommandDefinition = {
  name: 'cat',
  usage: 'cat FILE...',
  summary: 'Print the contents of one or more files.',
  run(args, context) {
    if (args.length === 0) return fail('cat: missing file name. Usage: cat FILE')
    const parts: string[] = []
    let failed = false
    for (const path of args) {
      const result = readFile('cat', context, path)
      if (isError(result)) {
        parts.push(result.output ?? '')
        failed = true
      } else {
        parts.push(result.content.replace(/\n$/, ''))
      }
    }
    return { output: parts.join('\n'), isError: failed }
  },
}

const grep: CommandDefinition = {
  name: 'grep',
  usage: 'grep [-i] [-c] [-n] [-v] PATTERN FILE...',
  summary: 'Show lines that contain PATTERN (plain text; -i ignore case, -c count, -n line numbers, -v non-matching).',
  run(args, context) {
    const parsed = parseOptions('grep', args, 'icnv')
    if (isError(parsed)) return parsed
    const { flags, operands } = parsed
    const [pattern, ...files] = operands
    if (pattern === undefined || files.length === 0) {
      return fail('grep: usage: grep PATTERN FILE. This simulation needs a file name (it cannot read from a pipe).')
    }
    const needle = flags.has('i') ? pattern.toLowerCase() : pattern
    const parts: string[] = []
    let failed = false
    for (const file of files) {
      const result = readFile('grep', context, file)
      if (isError(result)) {
        parts.push(result.output ?? '')
        failed = true
        continue
      }
      const prefix = files.length > 1 ? `${file}:` : ''
      const matches = result.content
        .replace(/\n$/, '')
        .split('\n')
        .map((text, index) => ({ text, number: index + 1 }))
        .filter(({ text }) => (flags.has('i') ? text.toLowerCase() : text).includes(needle) !== flags.has('v'))
      if (flags.has('c')) parts.push(`${prefix}${matches.length}`)
      else parts.push(...matches.map(({ text, number }) => `${prefix}${flags.has('n') ? `${number}:` : ''}${text}`))
    }
    return { output: parts.join('\n'), isError: failed }
  },
}

/**
 * Wildcard matching for find -name: "*" matches any run of characters, "?" exactly one.
 * Deliberately not a regular expression: a pattern such as "*****...b" would make a regex backtrack
 * exponentially (ReDoS). This greedy two-pointer algorithm runs in at most O(pattern x name) steps.
 */
export function globMatch(pattern: string, name: string): boolean {
  let p = 0
  let n = 0
  let starP = -1
  let starN = 0
  while (n < name.length) {
    if (p < pattern.length && (pattern[p] === '?' || pattern[p] === name[n])) {
      p += 1
      n += 1
    } else if (p < pattern.length && pattern[p] === '*') {
      starP = p
      starN = n
      p += 1
    } else if (starP !== -1) {
      p = starP + 1
      starN += 1
      n = starN
    } else {
      return false
    }
  }
  while (p < pattern.length && pattern[p] === '*') p += 1
  return p === pattern.length
}

const find: CommandDefinition = {
  name: 'find',
  usage: 'find [PATH] [-name PATTERN] [-type f|d]',
  summary: 'Search a folder and all sub-folders (including hidden ones) by name; "*" matches anything.',
  run(args, context) {
    let start = '.'
    let index = 0
    if (args[0] !== undefined && !args[0].startsWith('-')) {
      start = args[0]
      index = 1
    }
    let name: string | null = null
    let type: 'f' | 'd' | null = null
    while (index < args.length) {
      const option = args[index]
      const value = args[index + 1]
      if (option === '-name' && value !== undefined) name = value
      else if (option === '-type' && (value === 'f' || value === 'd')) type = value
      else return fail(`find: unsupported expression "${option}". Supported: -name PATTERN, -type f, -type d`)
      index += 2
    }
    const root = lookup(context.env.root, resolvePath(context.cwd, start, context.env.home))
    if (!root) return fail(`find: '${start}': No such file or directory`)

    const results: string[] = []
    const visit = (node: FsNode, shown: string, nodeName: string) => {
      const typeMatches = type === null || (type === 'f' ? node.type === 'file' : node.type === 'dir')
      if (typeMatches && (name === null || globMatch(name, nodeName))) results.push(shown)
      if (node.type === 'dir') {
        for (const [childName, child] of listEntries(node, true)) {
          visit(child, shown.endsWith('/') ? `${shown}${childName}` : `${shown}/${childName}`, childName)
        }
      }
    }
    const startName = start.split('/').filter(Boolean).pop() ?? start
    visit(root, start, startName)
    return { output: results.join('\n') }
  },
}

const ipconfig: CommandDefinition = {
  name: 'ipconfig',
  usage: 'ipconfig',
  summary: 'Show this computer\'s network settings (simulated).',
  run(args, context) {
    if (args.length > 0) return fail('ipconfig: this simulation does not support options. Type "ipconfig" on its own.')
    const interfaces = context.env.network?.interfaces ?? []
    if (interfaces.length === 0) return { output: 'No network adapters are configured in this environment.' }
    const row = (label: string, value: string) => `   ${label.padEnd(20, '.')} : ${value}`
    return {
      output: interfaces
        .map((item) =>
          [
            `Ethernet adapter ${item.name}:`,
            '',
            row('IPv4 Address', item.ipv4),
            row('Subnet Mask', item.subnetMask),
            row('Default Gateway', item.gateway),
            row('DNS Servers', item.dns.join(', ')),
            row('Physical Address', item.mac),
          ].join('\n'),
        )
        .join('\n\n'),
    }
  },
}

const ping: CommandDefinition = {
  name: 'ping',
  usage: 'ping [-c COUNT] HOST',
  summary: 'Check whether a host answers (simulated: no real packets are sent).',
  run(args, context) {
    let count = 4
    const operands: string[] = []
    for (let index = 0; index < args.length; index += 1) {
      if (args[index] === '-c') {
        const value = Number(args[index + 1])
        if (!Number.isInteger(value) || value < 1 || value > 10) return fail('ping: -c must be a whole number from 1 to 10.')
        count = value
        index += 1
      } else {
        operands.push(args[index]!)
      }
    }
    if (operands.length !== 1) return fail('ping: usage: ping [-c COUNT] HOST')
    const target = operands[0]!.toLowerCase()
    const hosts = context.env.network?.hosts ?? {}
    const known = Object.entries(hosts).find(([hostname, host]) => hostname === target || host.ip === target)
    const entry = known ?? (target === 'localhost' || target === '127.0.0.1' ? ['localhost', { ip: '127.0.0.1', reachable: true, latencyMs: 0 }] as const : null)
    if (!entry) return fail(`ping: ${operands[0]}: Name or service not known`)
    const [hostname, host] = entry
    const lines = [`PING ${hostname} (${host.ip}) 56(84) bytes of data.`]
    for (let seq = 1; seq <= count; seq += 1) {
      // Deterministic, slightly varying round-trip times so output looks natural but is repeatable.
      lines.push(host.reachable ? `64 bytes from ${host.ip}: icmp_seq=${seq} ttl=64 time=${(host.latencyMs + ((seq * 37) % 10) / 10).toFixed(1)} ms` : `Request timed out (icmp_seq=${seq})`)
    }
    const received = host.reachable ? count : 0
    lines.push('', `--- ${hostname} ping statistics ---`, `${count} packets transmitted, ${received} received, ${host.reachable ? 0 : 100}% packet loss`)
    return { output: lines.join('\n') }
  },
}

const base64: CommandDefinition = {
  name: 'base64',
  usage: 'base64 [-d] FILE',
  summary: 'Encode a file as Base64, or decode it with -d.',
  run(args, context) {
    const operands = args.filter((arg) => arg !== '-d' && arg !== '--decode')
    const decode = operands.length !== args.length
    if (operands.length !== 1) return fail('base64: usage: base64 [-d] FILE (this simulation reads from a file, not a pipe)')
    if (operands[0]!.startsWith('-')) return fail(`base64: unknown option ${operands[0]}`)
    const result = readFile('base64', context, operands[0]!)
    if (isError(result)) return result
    if (!decode) return { output: (Buffer.from(result.content, 'utf8').toString('base64').match(/.{1,76}/g) ?? ['']).join('\n') }
    const compact = result.content.replace(/\s+/g, '')
    if (compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) return fail('base64: invalid input (the file does not contain Base64 text)')
    return { output: Buffer.from(compact, 'base64').toString('utf8') }
  },
}

const basic: CommandDefinition[] = [
  {
    name: 'help',
    usage: 'help',
    summary: 'List the commands available in this challenge.',
    run(_args, context) {
      const commands = context.available.map((commandName) => ALL_COMMANDS.get(commandName)!)
      const width = Math.max(...commands.map((command) => command.usage.length)) + 2
      const lines = commands.map((command) => `  ${command.usage.padEnd(width)}${command.summary}`)
      return {
        output: [
          'Commands available in this simulated environment:',
          ...lines,
          '',
          'Tips: use quotes for text with spaces, e.g. grep "Failed password" FILE. Use the Up/Down arrow keys to reuse commands.',
          'Everything here is simulated: no command runs on a real computer.',
        ].join('\n'),
      }
    },
  },
  { name: 'clear', usage: 'clear', summary: 'Clear the screen.', run: () => ({ clear: true }) },
  {
    name: 'history',
    usage: 'history',
    summary: 'Show the commands you have typed.',
    run(_args, context) {
      const entries = [...context.history, context.line]
      return { output: entries.map((entry, index) => `${String(index + 1).padStart(4)}  ${entry}`).join('\n') }
    },
  },
  { name: 'pwd', usage: 'pwd', summary: 'Print the current folder.', run: (_args, context) => ({ output: context.cwd }) },
  { name: 'whoami', usage: 'whoami', summary: 'Print your user name.', run: (_args, context) => ({ output: context.env.user }) },
  { name: 'echo', usage: 'echo TEXT', summary: 'Print text back.', run: (args) => ({ output: args.join(' ') }) },
  ls,
  cd,
  cat,
]

/** The complete allowlist. Lookups use a Map, so names such as "constructor" can never match by accident. */
export const ALL_COMMANDS: ReadonlyMap<string, CommandDefinition> = new Map(
  [...basic, grep, find, ipconfig, ping, base64].map((command) => [command.name, command]),
)

/** Available in every environment; environments add extras from ALL_COMMANDS (see content/environments.ts). */
export const BASIC_COMMANDS: readonly string[] = basic.map((command) => command.name)
