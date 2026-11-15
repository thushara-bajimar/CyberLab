import type { AnswerRule } from '../content/types.js'
import { AppError } from '../errors.js'

/**
 * Makes harmless differences irrelevant: Unicode compatibility forms, surrounding spaces, repeated spaces,
 * letter case, and quotes wrapped around the whole answer. "  'tux-4821' " and "TUX-4821" are equal.
 */
export function normalizeAnswer(value: string): string {
  let text = value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
  const quoted = /^(["'`])(.*)\1$/.exec(text)
  if (quoted) text = quoted[2]!.trim()
  return text
}

/** Compares a submission with the server-side rule. Throws for a multiple-choice id that does not exist. */
export function isCorrect(rule: AnswerRule, submission: string): boolean {
  if (rule.type === 'choice') {
    const chosen = submission.trim().toLowerCase()
    if (!rule.options.some((option) => option.id === chosen)) {
      throw new AppError(400, 'INVALID_CHOICE', 'Choose one of the listed options.')
    }
    return chosen === rule.correct
  }
  const normalized = normalizeAnswer(submission)
  return rule.accepted.some((accepted) => normalizeAnswer(accepted) === normalized)
}
