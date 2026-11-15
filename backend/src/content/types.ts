/**
 * Shapes of the learning content. Content is written in TypeScript (version-controlled, type-checked) and
 * copied into SQLite at startup by db/seed.ts.
 */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface ModuleContent {
  id: string
  order: number
  title: string
  difficulty: Difficulty
  /** One sentence shown on module cards. */
  summary: string
  /** Why the topic matters, shown at the top of the module page. */
  introduction: string
  /** Short conceptual explanation; paragraphs separated by a blank line. */
  concept: string
  objectives: string[]
}

export interface Resource {
  title: string
  body: string
}

export interface ChoiceOption {
  id: string
  text: string
}

/** Server-only answer rules. Never sent to the browser. */
export type AnswerRule =
  | { type: 'text'; accepted: string[] }
  | { type: 'choice'; options: ChoiceOption[]; correct: string }

export interface CommandNote {
  command: string
  purpose: string
}

/** Revealed only after the challenge is completed. */
export interface Explanation {
  solution: string
  why: string
  concept: string
  commands: CommandNote[]
  commonMistakes: string[]
  realWorld: string
}

export interface ChallengeContent {
  id: string
  moduleId: string
  order: number
  title: string
  difficulty: Difficulty
  scenario: string
  objective: string
  instructions: string[]
  resources: Resource[]
  answer: AnswerRule
  /** Id of a simulated terminal environment (content/environments.ts), if the challenge uses the terminal. */
  terminalEnv?: string
  /** Exactly three progressive hints: a nudge, a direction, a strong clue. */
  hints: [string, string, string]
  explanation: Explanation
}
