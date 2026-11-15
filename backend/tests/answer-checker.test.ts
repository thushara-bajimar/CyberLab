import { describe, expect, it } from 'vitest'
import { challenges } from '../src/content/index.js'
import { isCorrect, normalizeAnswer } from '../src/services/answerChecker.js'

const textRule = { type: 'text' as const, accepted: ['TUX-4821'] }
const choiceRule = {
  type: 'choice' as const,
  options: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
  ],
  correct: 'b',
}

describe('answer normalisation', () => {
  it('ignores case, surrounding and repeated spaces, and wrapping quotes', () => {
    expect(normalizeAnswer('  TUX-4821 ')).toBe('tux-4821')
    expect(normalizeAnswer('"tux-4821"')).toBe('tux-4821')
    expect(normalizeAnswer("'  Tux-4821 '")).toBe('tux-4821')
    expect(normalizeAnswer('backup   .LAB')).toBe('backup .lab')
    expect(normalizeAnswer('ＴＵＸ－４８２１')).toBe('tux-4821') // full-width characters (NFKC)
  })

  it('keeps meaningful characters', () => {
    expect(normalizeAnswer('Pa55-Lab-Only')).not.toBe(normalizeAnswer('Pa55LabOnly'))
    expect(normalizeAnswer('"half quoted')).toBe('"half quoted')
  })
})

describe('isCorrect', () => {
  it('accepts equivalent typed answers and rejects others', () => {
    expect(isCorrect(textRule, 'tux-4821')).toBe(true)
    expect(isCorrect(textRule, ' "TUX-4821" ')).toBe(true)
    expect(isCorrect(textRule, 'TUX-4822')).toBe(false)
    expect(isCorrect(textRule, 'Your lab access code is: TUX-4821')).toBe(false)
  })

  it('compares multiple-choice ids and rejects unknown ids', () => {
    expect(isCorrect(choiceRule, 'b')).toBe(true)
    expect(isCorrect(choiceRule, ' B ')).toBe(true)
    expect(isCorrect(choiceRule, 'a')).toBe(false)
    expect(() => isCorrect(choiceRule, 'z')).toThrow(/listed options/)
    expect(() => isCorrect(choiceRule, 'B is the answer')).toThrow(/listed options/)
  })

  it('accepts every documented answer of the real course content', () => {
    for (const challenge of challenges) {
      const answers = challenge.answer.type === 'choice' ? [challenge.answer.correct] : challenge.answer.accepted
      for (const answer of answers) expect(isCorrect(challenge.answer, answer), challenge.id).toBe(true)
    }
  })
})
