import type { RequestHandler } from 'express'
import { GUEST_USER_ID } from '../db/schema.js'
import type { Services } from '../services/index.js'
import { activityQuery, resetRequest } from '../validation/progress.js'

export function progressController(services: Services) {
  const show: RequestHandler = (_req, res) => {
    res.json(services.progress.getProgress(GUEST_USER_ID))
  }

  const activity: RequestHandler = (req, res) => {
    const { limit, offset } = activityQuery.parse(req.query)
    res.json(services.progress.listActivity(GUEST_USER_ID, limit, offset))
  }

  const reset: RequestHandler = (req, res) => {
    resetRequest.parse(req.body ?? {})
    res.json(services.progress.reset(GUEST_USER_ID))
  }

  return { show, activity, reset }
}
