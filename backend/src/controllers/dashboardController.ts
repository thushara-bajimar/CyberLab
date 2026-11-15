import type { RequestHandler } from 'express'
import { GUEST_USER_ID } from '../db/schema.js'
import type { Services } from '../services/index.js'

export function dashboardController(services: Services): { show: RequestHandler } {
  return {
    show: (_req, res) => {
      res.json(services.dashboard.getDashboard(GUEST_USER_ID))
    },
  }
}
