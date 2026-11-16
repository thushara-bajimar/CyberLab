import express, { type Express } from 'express'
import type { DB } from './db/connection.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { DEFAULT_ALLOWED_HOSTS, hostGuard, requireJson, securityHeaders } from './middleware/security.js'
import { healthRouter } from './routes/health.js'
import { apiRouter } from './routes/index.js'
import { createServices } from './services/index.js'

export interface AppDependencies {
  db: DB
  /** Source of the current time; tests pass a fixed clock. */
  clock?: () => Date
  /** Host names the API answers to (DNS-rebinding protection). */
  allowedHosts?: string[]
}

/**
 * Builds the Express application. The database is passed in (dependency injection) so tests can use an
 * in-memory database while the real server uses the file on disk.
 *
 * Request pipeline: security headers -> host check -> JSON-only POSTs -> body parser (10 KB) -> routes
 * -> 404 -> error handler.
 */
export function createApp({ db, clock, allowedHosts = DEFAULT_ALLOWED_HOSTS }: AppDependencies): Express {
  const app = express()
  app.disable('x-powered-by')
  app.use(securityHeaders)
  app.use(hostGuard(allowedHosts))
  app.use(requireJson)
  app.use(express.json({ limit: '10kb' }))

  app.use('/api/health', healthRouter(db))
  app.use('/api', apiRouter(createServices(db, clock)))

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
