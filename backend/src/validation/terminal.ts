import { z } from 'zod'
import { printable } from './common.js'
import { slug } from './params.js'

export const MAX_COMMAND_LENGTH = 200
export const MAX_HISTORY = 50
// Control characters are rejected because newlines could fake extra prompt lines in the terminal.

export const terminalRequest = z
  .object({
    challengeId: slug,
    command: printable(MAX_COMMAND_LENGTH),
    cwd: printable(256).optional(),
    history: z.array(printable(MAX_COMMAND_LENGTH)).max(MAX_HISTORY, `At most ${MAX_HISTORY} history entries are accepted.`).optional(),
  })
  .strict()

export type TerminalRequest = z.infer<typeof terminalRequest>
