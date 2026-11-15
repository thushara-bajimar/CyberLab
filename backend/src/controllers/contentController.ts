import type { RequestHandler } from 'express'
import { GUEST_USER_ID } from '../db/schema.js'
import type { Services } from '../services/index.js'
import { challengeParams, moduleParams } from '../validation/params.js'

/** HTTP layer for modules and challenges: validate the request, call a service, send JSON. */
export function contentController(services: Services) {
  const listModules: RequestHandler = (_req, res) => {
    res.json({ modules: services.modules.listModules(GUEST_USER_ID) })
  }

  const showModule: RequestHandler = (req, res) => {
    const { moduleId } = moduleParams.parse(req.params)
    res.json(services.modules.getModule(GUEST_USER_ID, moduleId))
  }

  const listChallenges: RequestHandler = (_req, res) => {
    res.json({ challenges: services.challenges.listChallenges(GUEST_USER_ID) })
  }

  const showChallenge: RequestHandler = (req, res) => {
    const { challengeId } = challengeParams.parse(req.params)
    res.json(services.challenges.getChallenge(GUEST_USER_ID, challengeId))
  }

  return { listModules, showModule, listChallenges, showChallenge }
}
