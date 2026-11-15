import type { TerminalEnvironment } from '../content/environments.js'
import { ALL_COMMANDS, BASIC_COMMANDS } from './commands.js'
import { lookup, resolvePath } from './filesystem.js'
import { tokenize } from './tokenizer.js'

/**
 * Step 4 of the terminal: the engine.
 *
 *   command line --tokenize--> words --allowlist--> handler --> text output
 *
 * The engine is a pure function of (environment, request). It keeps no state between calls: the browser
 * sends the current folder and recent history with every command, and the engine validates them.
 */
export interface ExecuteRequest {
  command: string
  cwd?: string
  history?: string[]
}

export interface ExecuteResult {
  output: string
  cwd: string
  clear: boolean
  isError: boolean
}

export const MAX_OUTPUT_LINES = 400

/** Why common real-world commands are missing, explained instead of a bare "command not found". */
const UNAVAILABLE: [string[], string][] = [
  [['rm', 'rmdir', 'mv', 'cp', 'touch', 'mkdir', 'chmod', 'chown', 'ln', 'dd', 'truncate', 'tee'],
    'The simulated filesystem is read-only, so commands that create, change or delete files are not available.'],
  [['sudo', 'su', 'passwd', 'useradd', 'usermod'], 'There is no administrator access in this simulation. Nothing here needs elevated privileges.'],
  [['curl', 'wget', 'nc', 'netcat', 'nmap', 'ssh', 'scp', 'ftp', 'telnet', 'traceroute', 'nslookup', 'dig'],
    'Real network tools are not available: this simulated terminal never sends network traffic.'],
  [['bash', 'sh', 'zsh', 'powershell', 'pwsh', 'cmd', 'python', 'python3', 'node', 'perl', 'ruby', 'php', 'exec', 'eval', 'source'],
    'Running programs, shells or scripts is not supported. This terminal only simulates a small set of commands and never executes code.'],
  [['nano', 'vi', 'vim', 'emacs', 'less', 'more', 'head', 'tail'], 'That command is not part of this simulation. Use "cat FILE" to read a file.'],
  [['env', 'printenv', 'export', 'set', 'unset'], 'Environment variables are not available in this simulated terminal.'],
  [['kill', 'ps', 'top', 'shutdown', 'reboot', 'systemctl', 'service', 'crontab', 'apt', 'apt-get', 'yum'],
    'This simulation has no running processes or system services to manage.'],
]
const UNAVAILABLE_MESSAGES = new Map(UNAVAILABLE.flatMap(([names, message]) => names.map((name) => [name, message] as const)))

export function availableCommands(env: TerminalEnvironment): string[] {
  return [...BASIC_COMMANDS, ...env.extraCommands.filter((name) => ALL_COMMANDS.has(name))]
}

function safeCwd(env: TerminalEnvironment, requested: string | undefined): string {
  if (!requested || !requested.startsWith('/')) return env.home
  const normalised = resolvePath('/', requested, env.home)
  return lookup(env.root, normalised)?.type === 'dir' ? normalised : env.home
}

function truncate(output: string): string {
  const lines = output.split('\n')
  if (lines.length <= MAX_OUTPUT_LINES) return output
  return [...lines.slice(0, MAX_OUTPUT_LINES), `... output truncated after ${MAX_OUTPUT_LINES} lines`].join('\n')
}

export function executeCommand(env: TerminalEnvironment, request: ExecuteRequest): ExecuteResult {
  const cwd = safeCwd(env, request.cwd)
  const line = request.command.trim()
  const result = (output: string, isError = false, extra: Partial<ExecuteResult> = {}): ExecuteResult => ({ output, cwd, clear: false, isError, ...extra })

  if (line === '') return result('')

  const tokens = tokenize(line)
  if (!tokens.ok) return result(tokens.error, true)
  const [name, ...args] = tokens.tokens
  if (name === undefined) return result('')

  const available = availableCommands(env)
  if (!available.includes(name)) {
    if (ALL_COMMANDS.has(name)) return result(`${name}: not available in this challenge. Type "help" to see the commands you can use here.`, true)
    if ((name === 'ifconfig' || name === 'ip') && available.includes('ipconfig')) {
      return result(`${name}: this simulation uses "ipconfig" to show network settings. (On a real Linux system you would use "ip addr".)`, true)
    }
    const reason = UNAVAILABLE_MESSAGES.get(name)
    return result(reason ? `${name}: ${reason}` : `${name}: command not found. Type "help" to see the commands available in this challenge.`, true)
  }

  const command = ALL_COMMANDS.get(name)!
  const output = command.run(args, { env, cwd, history: request.history ?? [], line, available })
  return {
    output: truncate(output.output ?? ''),
    cwd: output.cwd ?? cwd,
    clear: output.clear ?? false,
    isError: output.isError ?? false,
  }
}
