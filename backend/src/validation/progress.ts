import { z } from 'zod'

/** Query parameters arrive as strings, so they are converted to integers and range-checked. */
export const activityQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).max(100_000).default(0),
  })
  .strict()

/** Resetting is destructive, so the client must send the exact confirmation word. */
export const resetRequest = z.object({ confirm: z.literal('RESET', { message: 'Send { "confirm": "RESET" } to reset all progress.' }) }).strict()
