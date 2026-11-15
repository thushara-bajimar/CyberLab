import { apiRequest } from './client'
import type { ChallengeDetail, ChallengeSummary, DashboardResponse, HealthResponse, ModuleDetail, ModuleSummary } from './types'

export const getHealth = () => apiRequest<HealthResponse>('/api/health')
export const getDashboard = () => apiRequest<DashboardResponse>('/api/dashboard')
export const getModules = () => apiRequest<{ modules: ModuleSummary[] }>('/api/modules')
export const getModule = (moduleId: string) => apiRequest<ModuleDetail>(`/api/modules/${encodeURIComponent(moduleId)}`)
export const getChallenges = () => apiRequest<{ challenges: ChallengeSummary[] }>('/api/challenges')
export const getChallenge = (challengeId: string) => apiRequest<ChallengeDetail>(`/api/challenges/${encodeURIComponent(challengeId)}`)
