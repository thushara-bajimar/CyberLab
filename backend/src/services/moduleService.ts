import { notFound } from '../errors.js'
import type { ContentRepository, ModuleRecord } from '../repositories/contentRepository.js'
import type { ProgressRepository } from '../repositories/progressRepository.js'
import { summarizeChallenges, type ChallengeSummary } from './challengeService.js'
import { progressByChallenge, type ChallengeStatus } from './progressStatus.js'

export interface ModuleSummary {
  id: string
  title: string
  summary: string
  difficulty: ModuleRecord['difficulty']
  order: number
  totalChallenges: number
  completedChallenges: number
  pointsEarned: number
  pointsPossible: number
  status: ChallengeStatus
}

export interface ModuleDetail extends ModuleSummary {
  introduction: string
  concept: string
  objectives: string[]
  challenges: ChallengeSummary[]
}

/** A module is completed when all its challenges are, in progress when any has been started. */
function moduleStatus(challenges: ChallengeSummary[]): ChallengeStatus {
  if (challenges.length > 0 && challenges.every((challenge) => challenge.status === 'completed')) return 'completed'
  if (challenges.some((challenge) => challenge.status !== 'not_started')) return 'in_progress'
  return 'not_started'
}

function summarize(module: ModuleRecord, challenges: ChallengeSummary[]): ModuleSummary {
  return {
    id: module.id,
    title: module.title,
    summary: module.summary,
    difficulty: module.difficulty,
    order: module.sortOrder,
    totalChallenges: challenges.length,
    completedChallenges: challenges.filter((challenge) => challenge.status === 'completed').length,
    pointsEarned: challenges.reduce((sum, challenge) => sum + challenge.pointsAwarded, 0),
    pointsPossible: challenges.reduce((sum, challenge) => sum + challenge.basePoints, 0),
    status: moduleStatus(challenges),
  }
}

export function createModuleService(content: ContentRepository, progress: ProgressRepository) {
  return {
    listModules(userId: number): ModuleSummary[] {
      const all = summarizeChallenges(content.listChallenges(), progressByChallenge(progress.listProgress(userId)))
      return content.listModules().map((module) => summarize(module, all.filter((challenge) => challenge.moduleId === module.id)))
    },

    getModule(userId: number, moduleId: string): ModuleDetail {
      const module = content.getModule(moduleId)
      if (!module) throw notFound('Module')
      const challenges = summarizeChallenges(content.listChallenges(moduleId), progressByChallenge(progress.listProgress(userId)))
      return {
        ...summarize(module, challenges),
        introduction: module.introduction,
        concept: module.concept,
        objectives: module.objectives,
        challenges,
      }
    },
  }
}
