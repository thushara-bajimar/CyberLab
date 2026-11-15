import express, { type Express } from 'express'
import type { DB } from './db/connection.js'
import { apiNotFound, errorHandler } from './middleware/errorHandler.js'
import { healthRouter } from './routes/health.js'
import { apiRouter } from './routes/index.js'
import { createServices } from './services/index.js'

export interface AppDependencies {
  db: DB
}

/**
 * Builds the Express application. The database is passed in (dependency injection) so tests can use an
 * in-memory database while the real server uses the file on disk.
 */
export function createApp({ db }: AppDependencies): Express {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '10kb' }))

  app.use('/api/health', healthRouter(db))
  app.use('/api', apiRouter(createServices(db)))

  app.use('/api', apiNotFound)
  app.use(errorHandler)
  return app
}
