import type { ContentRepository } from '../repositories/contentRepository.js'
import type { ActivityRecord, ProgressRepository } from '../repositories/progressRepository.js'
import { progressByChallenge, statusOf } from './progressStatus.js'
import { basePoints, pointsAfterHints } from './scoring.js'

export const RECENT_ACTIVITY_LIMIT = 8

export interface DashboardData {
  learner: { displayName: string }
  totals: {
    challenges: number
    completed: number
    pending: number
    points: number
    possiblePoints: number
    completionPercent: number
  }
  modules: { id: string; title: string; difficulty: string; totalChallenges: number; completedChallenges: number }[]
  recentActivity: ActivityRecord[]
  recommended: {
    challengeId: string
    title: string
    moduleId: string
    moduleTitle: string
    difficulty: string
    points: number
    reason: 'continue' | 'next'
  } | null
}

/** Every number on the dashboard is computed here from the database; nothing is hard-coded. */
export function createDashboardService(content: ContentRepository, progress: ProgressRepository) {
  return {
    getDashboard(userId: number): DashboardData {
      const challenges = content.listChallenges()
      const progressMap = progressByChallenge(progress.listProgress(userId))

      let completed = 0
      let points = 0
      let possiblePoints = 0
      const completedByModule = new Map<string, number>()
      const totalByModule = new Map<string, number>()
      for (const challenge of challenges) {
        possiblePoints += basePoints(challenge.difficulty)
        totalByModule.set(challenge.moduleId, (totalByModule.get(challenge.moduleId) ?? 0) + 1)
        const row = progressMap.get(challenge.id)
        if (statusOf(row) === 'completed') {
          completed += 1
          points += row?.pointsAwarded ?? 0
          completedByModule.set(challenge.moduleId, (completedByModule.get(challenge.moduleId) ?? 0) + 1)
        }
      }

      // Recommend an unfinished challenge the learner already started; otherwise the next one in learning order.
      const started = challenges.find((challenge) => statusOf(progressMap.get(challenge.id)) === 'in_progress')
      const next = started ?? challenges.find((challenge) => statusOf(progressMap.get(challenge.id)) === 'not_started')

      return {
        learner: { displayName: progress.getDisplayName(userId) },
        totals: {
          challenges: challenges.length,
          completed,
          pending: challenges.length - completed,
          points,
          possiblePoints,
          completionPercent: challenges.length === 0 ? 0 : Math.round((completed / challenges.length) * 100),
        },
        modules: content.listModules().map((module) => ({
          id: module.id,
          title: module.title,
          difficulty: module.difficulty,
          totalChallenges: totalByModule.get(module.id) ?? 0,
          completedChallenges: completedByModule.get(module.id) ?? 0,
        })),
        recentActivity: progress.recentActivity(userId, RECENT_ACTIVITY_LIMIT),
        recommended: next
          ? {
              challengeId: next.id,
              title: next.title,
              moduleId: next.moduleId,
              moduleTitle: next.moduleTitle,
              difficulty: next.difficulty,
              points: pointsAfterHints(next.difficulty, progressMap.get(next.id)?.hintsUsed ?? 0),
              reason: started ? 'continue' : 'next',
            }
          : null,
      }
    },
  }
}
