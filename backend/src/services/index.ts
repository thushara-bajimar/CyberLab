import type { DB } from '../db/connection.js'
import { createContentRepository } from '../repositories/contentRepository.js'
import { createProgressRepository } from '../repositories/progressRepository.js'
import { createChallengeService } from './challengeService.js'
import { createDashboardService } from './dashboardService.js'
import { createModuleService } from './moduleService.js'

/** Wires repositories into services once per app instance (simple manual dependency injection). */
export function createServices(db: DB) {
  const content = createContentRepository(db)
  const progress = createProgressRepository(db)
  return {
    dashboard: createDashboardService(content, progress),
    modules: createModuleService(content, progress),
    challenges: createChallengeService(content, progress),
  }
}

export type Services = ReturnType<typeof createServices>
