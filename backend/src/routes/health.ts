import { Router } from 'express'
import { checkDatabase, type DB } from '../db/connection.js'
import { methodNotAllowed } from '../middleware/security.js'

export function healthRouter(db: DB): Router {
  const router = Router()

  router
    .route('/')
    .get((_req, res) => {
      try {
        const database = checkDatabase(db)
        res.json({ status: 'ok', service: 'cyberlab-api', database: { status: 'ok', schemaVersion: database.schemaVersion } })
      } catch {
        res.status(503).json({ status: 'degraded', service: 'cyberlab-api', database: { status: 'unavailable' } })
      }
    })
    .all(methodNotAllowed('GET'))

  return router
}
