import { z } from 'zod'
import { slug } from './params.js'

export const MAX_COMMAND_LENGTH = 200
export const MAX_HISTORY = 50

/** Printable text only: newlines, tabs and other control characters could fake extra prompt lines. */
const printable = (max: number) =>
  z.string().max(max, `Must be at most ${max} characters.`).regex(/^[^\u0000-\u0008\u000a-\u001f\u007f]*$/, 'Control characters are not allowed.')

export const terminalRequest = z
  .object({
    challengeId: slug,
    command: printable(MAX_COMMAND_LENGTH),
    cwd: printable(256).optional(),
    history: z.array(printable(MAX_COMMAND_LENGTH)).max(MAX_HISTORY, `At most ${MAX_HISTORY} history entries are accepted.`).optional(),
  })
  .strict()

export type TerminalRequest = z.infer<typeof terminalRequest>
