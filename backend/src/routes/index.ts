import { Router } from 'express'
import { contentController } from '../controllers/contentController.js'
import { dashboardController } from '../controllers/dashboardController.js'
import { terminalController } from '../controllers/terminalController.js'
import type { Services } from '../services/index.js'

/** URL -> controller wiring for everything except /api/health. */
export function apiRouter(services: Services): Router {
  const router = Router()
  const dashboard = dashboardController(services)
  const content = contentController(services)
  const terminal = terminalController(services)

  router.get('/dashboard', dashboard.show)
  router.get('/modules', content.listModules)
  router.get('/modules/:moduleId', content.showModule)
  router.get('/challenges', content.listChallenges)
  router.get('/challenges/:challengeId', content.showChallenge)
  router.post('/challenges/:challengeId/hints', content.revealHint)
  router.post('/challenges/:challengeId/submit', content.submitAnswer)
  router.post('/terminal/execute', terminal.execute)

  return router
}
