/**
 * Step 1 of the terminal: split one command line into words ("tokens").
 *
 * Supported: spaces between words, and single or double quotes to keep spaces inside one word
 * (grep "Failed password" auth.log). Everything inside quotes is literal.
 *
 * Rejected (outside quotes), with a beginner-friendly explanation: command chaining (; &), pipes (|),
 * redirection (< >), command substitution (` and $( )) and variables ($HOME). These are what turn a single
 * command into a program in a real shell, and the simulation deliberately runs exactly one command.
 */
export const MAX_TOKENS = 20

export type TokenizeResult = { ok: true; tokens: string[] } | { ok: false; error: string }

const OPERATOR_MESSAGES: Record<string, string> = {
  ';': 'Command chaining with ";" is not supported. This simulated terminal runs one command at a time.',
  '&': 'Command chaining and background jobs with "&" are not supported. This simulated terminal runs one command at a time.',
  '|': 'Pipes ("|") are not supported. Run one command at a time; for example, grep can read a file directly: grep PATTERN FILE.',
  '<': 'Input redirection ("<") is not supported. Give the file name as an argument instead, e.g. cat FILE.',
  '>': 'Output redirection (">") is not supported. The simulated filesystem is read-only, so nothing can be written.',
  '`': 'Command substitution with backticks is not supported. This simulated terminal never runs nested commands.',
}

export function tokenize(line: string): TokenizeResult {
  const tokens: string[] = []
  let current = ''
  let inToken = false
  let quote: '"' | "'" | null = null

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!
    if (quote) {
      if (char === quote) quote = null
      else current += char
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      inToken = true
      continue
    }
    if (char === ' ' || char === '\t') {
      if (inToken) tokens.push(current)
      current = ''
      inToken = false
      continue
    }
    const operatorMessage = OPERATOR_MESSAGES[char]
    if (operatorMessage) return { ok: false, error: operatorMessage }
    if (char === '$') {
      const next = line[index + 1]
      if (next === '(') return { ok: false, error: 'Command substitution with "$( )" is not supported. This simulated terminal never runs nested commands.' }
      if (next !== undefined && /[A-Za-z_{]/.test(next)) {
        return { ok: false, error: 'Environment variables (such as $HOME) are not available in this simulated terminal.' }
      }
    }
    current += char
    inToken = true
  }

  if (quote) return { ok: false, error: `Missing closing quote (${quote}). Quotes must come in pairs, e.g. grep "Failed password" FILE.` }
  if (inToken) tokens.push(current)
  if (tokens.length > MAX_TOKENS) return { ok: false, error: `Too many arguments (maximum ${MAX_TOKENS}).` }
  return { ok: true, tokens }
}
