import { apiRequest } from './client'
import type {
  ActivityPage,
  ChallengeDetail,
  ChallengeSummary,
  DashboardResponse,
  HealthResponse,
  HintResponse,
  ModuleDetail,
  ModuleSummary,
  ProgressResponse,
  ResetResponse,
  SubmitResponse,
  TerminalRequest,
  TerminalResponse,
} from './types'

const challengePath = (challengeId: string) => `/api/challenges/${encodeURIComponent(challengeId)}`

export const getHealth = () => apiRequest<HealthResponse>('/api/health')
export const getDashboard = () => apiRequest<DashboardResponse>('/api/dashboard')
export const getModules = () => apiRequest<{ modules: ModuleSummary[] }>('/api/modules')
export const getModule = (moduleId: string) => apiRequest<ModuleDetail>(`/api/modules/${encodeURIComponent(moduleId)}`)
export const getChallenges = () => apiRequest<{ challenges: ChallengeSummary[] }>('/api/challenges')
export const getChallenge = (challengeId: string) => apiRequest<ChallengeDetail>(challengePath(challengeId))

export const executeTerminalCommand = (body: TerminalRequest) =>
  apiRequest<TerminalResponse>('/api/terminal/execute', { method: 'POST', body: JSON.stringify(body) })

/** The client only says which hint it wants; the server decides the cost. */
export const revealHint = (challengeId: string, hintNumber: number) =>
  apiRequest<HintResponse>(`${challengePath(challengeId)}/hints`, { method: 'POST', body: JSON.stringify({ hintNumber }) })

/** The client only sends the answer text; checking and scoring happen on the server. */
export const submitAnswer = (challengeId: string, answer: string) =>
  apiRequest<SubmitResponse>(`${challengePath(challengeId)}/submit`, { method: 'POST', body: JSON.stringify({ answer }) })

export const getProgress = () => apiRequest<ProgressResponse>('/api/progress')
export const getActivity = (limit: number, offset: number) => apiRequest<ActivityPage>(`/api/activity?limit=${limit}&offset=${offset}`)

/** Deletes all progress for this learner. The server requires the exact confirmation word. */
export const resetProgress = () => apiRequest<ResetResponse>('/api/progress/reset', { method: 'POST', body: JSON.stringify({ confirm: 'RESET' }) })
