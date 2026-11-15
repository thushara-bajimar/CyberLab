import { z } from 'zod'
import { printable } from './common.js'

export const MAX_ANSWER_LENGTH = 200

/**
 * The client may only say which hint it wants and what its answer is. Points, status and hint counts are
 * never accepted from the client: .strict() rejects any extra field such as { "points": 9999 }.
 */
export const hintRequest = z.object({ hintNumber: z.number().int().min(1).max(3) }).strict()

export const submitRequest = z
  .object({ answer: printable(MAX_ANSWER_LENGTH).refine((value) => value.trim().length > 0, 'The answer must not be empty.') })
  .strict()
