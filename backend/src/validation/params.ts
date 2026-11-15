import { z } from 'zod'

/** Content ids are lower-case slugs such as "linux-hidden-files". Anything else is rejected before any query. */
export const slug = z.string().regex(/^[a-z0-9-]{1,64}$/, 'Must be a lower-case id of letters, digits and hyphens.')

export const moduleParams = z.object({ moduleId: slug })
export const challengeParams = z.object({ challengeId: slug })
