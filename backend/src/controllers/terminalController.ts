import type { RequestHandler } from 'express'
import type { Services } from '../services/index.js'
import { terminalRequest } from '../validation/terminal.js'

export function terminalController(services: Services): { execute: RequestHandler } {
  return {
    execute: (req, res) => {
      const body = terminalRequest.parse(req.body ?? {})
      res.json(services.terminal.execute(body))
    },
  }
}
