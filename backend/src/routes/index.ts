import { Router } from 'express'
import { contentController } from '../controllers/contentController.js'
import { dashboardController } from '../controllers/dashboardController.js'
import type { Services } from '../services/index.js'

/** URL -> controller wiring for everything except /api/health. */
export function apiRouter(services: Services): Router {
  const router = Router()
  const dashboard = dashboardController(services)
  const content = contentController(services)

  router.get('/dashboard', dashboard.show)
  router.get('/modules', content.listModules)
  router.get('/modules/:moduleId', content.showModule)
  router.get('/challenges', content.listChallenges)
  router.get('/challenges/:challengeId', content.showChallenge)

  return router
}
