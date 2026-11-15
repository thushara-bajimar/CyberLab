import type { ContentRepository } from '../repositories/contentRepository.js'
import type { ActivityRecord, ProgressRepository } from '../repositories/progressRepository.js'
import type { DashboardData, createDashboardService } from './dashboardService.js'
import type { createModuleService, ModuleSummary } from './moduleService.js'
import { progressByChallenge, statusOf, type ChallengeStatus } from './progressStatus.js'
import { basePoints } from './scoring.js'

export const PROGRESS_ACTIVITY_LIMIT = 20

export interface ChallengeProgressRow {
  id: string
  title: string
  moduleId: string
  moduleTitle: string
  difficulty: string
  status: ChallengeStatus
  attempts: number
  hintsUsed: number
  pointsAwarded: number
  basePoints: number
  startedAt: string | null
  completedAt: string | null
}

export interface ProgressData {
  totals: DashboardData['totals'] & { attempts: number; hintsUsed: number; started: number }
  modules: (ModuleSummary & { completedAt: string | null })[]
  challenges: ChallengeProgressRow[]
  recentActivity: ActivityRecord[]
  activityTotal: number
}

export interface ActivityPage {
  items: ActivityRecord[]
  total: number
  limit: number
  offset: number
}

/** The learner's full progress record, the paged activity history, and resetting both. */
export function createProgressService(
  content: ContentRepository,
  progress: ProgressRepository,
  dashboard: ReturnType<typeof createDashboardService>,
  moduleService: ReturnType<typeof createModuleService>,
) {
  function getProgress(userId: number): ProgressData {
      const progressMap = progressByChallenge(progress.listProgress(userId))
      const challenges: ChallengeProgressRow[] = content.listChallenges().map((challenge) => {
        const row = progressMap.get(challenge.id)
        return {
          id: challenge.id,
          title: challenge.title,
          moduleId: challenge.moduleId,
          moduleTitle: challenge.moduleTitle,
          difficulty: challenge.difficulty,
          status: statusOf(row),
          attempts: row?.attempts ?? 0,
          hintsUsed: row?.hintsUsed ?? 0,
          pointsAwarded: row?.pointsAwarded ?? 0,
          basePoints: basePoints(challenge.difficulty),
          startedAt: row?.startedAt ?? null,
          completedAt: row?.completedAt ?? null,
        }
      })

      // A module's completion time is when its last challenge was completed.
      const modules = moduleService.listModules(userId).map((module) => {
        const own = challenges.filter((challenge) => challenge.moduleId === module.id)
        const times = own.map((challenge) => challenge.completedAt).filter((time): time is string => time !== null)
        return { ...module, completedAt: module.status === 'completed' && times.length > 0 ? times.sort().at(-1)! : null }
      })

      return {
        totals: {
          ...dashboard.getDashboard(userId).totals,
          attempts: challenges.reduce((sum, challenge) => sum + challenge.attempts, 0),
          hintsUsed: challenges.reduce((sum, challenge) => sum + challenge.hintsUsed, 0),
          started: challenges.filter((challenge) => challenge.status !== 'not_started').length,
        },
        modules,
        challenges,
        recentActivity: progress.recentActivity(userId, PROGRESS_ACTIVITY_LIMIT),
        activityTotal: progress.countActivity(userId),
      }
  }

  return {
    getProgress,

    listActivity(userId: number, limit: number, offset: number): ActivityPage {
      return { items: progress.recentActivity(userId, limit, offset), total: progress.countActivity(userId), limit, offset }
    },

    /** Removes progress and activity for this learner only; course content and other users are not affected. */
    reset(userId: number): { deleted: { progressRows: number; activityRows: number }; progress: ProgressData } {
      const deleted = progress.resetProgress(userId)
      return { deleted, progress: getProgress(userId) }
    },
  }
}
