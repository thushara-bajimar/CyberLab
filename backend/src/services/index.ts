import type { DB } from '../db/connection.js'
import { createContentRepository } from '../repositories/contentRepository.js'
import { createProgressRepository } from '../repositories/progressRepository.js'
import { createChallengeActionService } from './challengeActionService.js'
import { createChallengeService } from './challengeService.js'
import { createDashboardService } from './dashboardService.js'
import { createModuleService } from './moduleService.js'
import { createTerminalService } from './terminalService.js'

/** Wires repositories into services once per app instance (simple manual dependency injection). */
export function createServices(db: DB, clock?: () => Date) {
  const content = createContentRepository(db)
  const progress = createProgressRepository(db)
  const challenges = createChallengeService(content, progress)
  return {
    dashboard: createDashboardService(content, progress),
    modules: createModuleService(content, progress),
    challenges,
    actions: createChallengeActionService(content, progress, challenges, clock),
    terminal: createTerminalService(content),
  }
}

export type Services = ReturnType<typeof createServices>
