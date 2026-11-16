import { Router } from 'express'
import { contentController } from '../controllers/contentController.js'
import { dashboardController } from '../controllers/dashboardController.js'
import { progressController } from '../controllers/progressController.js'
import { terminalController } from '../controllers/terminalController.js'
import { methodNotAllowed } from '../middleware/security.js'
import type { Services } from '../services/index.js'

/**
 * URL -> controller wiring for everything except /api/health. Each path lists its methods explicitly; any
 * other method on a known path gets 405 Method Not Allowed instead of a misleading 404.
 */
export function apiRouter(services: Services): Router {
  const router = Router()
  const dashboard = dashboardController(services)
  const content = contentController(services)
  const terminal = terminalController(services)
  const progress = progressController(services)
  const getOnly = methodNotAllowed('GET')
  const postOnly = methodNotAllowed('POST')

  router.route('/dashboard').get(dashboard.show).all(getOnly)
  router.route('/modules').get(content.listModules).all(getOnly)
  router.route('/modules/:moduleId').get(content.showModule).all(getOnly)
  router.route('/challenges').get(content.listChallenges).all(getOnly)
  router.route('/challenges/:challengeId').get(content.showChallenge).all(getOnly)
  router.route('/challenges/:challengeId/hints').post(content.revealHint).all(postOnly)
  router.route('/challenges/:challengeId/submit').post(content.submitAnswer).all(postOnly)
  router.route('/terminal/execute').post(terminal.execute).all(postOnly)
  router.route('/progress').get(progress.show).all(getOnly)
  router.route('/progress/reset').post(progress.reset).all(postOnly)
  router.route('/activity').get(progress.activity).all(getOnly)

  return router
}
