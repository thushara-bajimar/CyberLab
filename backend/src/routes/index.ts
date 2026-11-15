import { Router } from 'express'
import { dashboardController } from '../controllers/dashboardController.js'
import type { Services } from '../services/index.js'

/** URL -> controller wiring for everything except /api/health. */
export function apiRouter(services: Services): Router {
  const router = Router()
  const dashboard = dashboardController(services)

  router.get('/dashboard', dashboard.show)

  return router
}
