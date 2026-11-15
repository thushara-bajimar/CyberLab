import { Router } from 'express'
import { checkDatabase, type DB } from '../db/connection.js'

export function healthRouter(db: DB): Router {
  const router = Router()

  router.get('/', (_req, res) => {
    try {
      const database = checkDatabase(db)
      res.json({ status: 'ok', service: 'cyberlab-api', database: { status: 'ok', schemaVersion: database.schemaVersion } })
    } catch {
      res.status(503).json({ status: 'degraded', service: 'cyberlab-api', database: { status: 'unavailable' } })
    }
  })

  return router
}
