import { z } from 'zod'

/** Printable text only: newlines, tabs and other control characters are rejected. */
export const printable = (max: number) =>
  z.string().max(max, `Must be at most ${max} characters.`).regex(/^[^\u0000-\u0008\u000a-\u001f\u007f]*$/, 'Control characters are not allowed.')
