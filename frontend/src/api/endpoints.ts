import { apiRequest } from './client'
import type { DashboardResponse, HealthResponse } from './types'

export const getHealth = () => apiRequest<HealthResponse>('/api/health')
export const getDashboard = () => apiRequest<DashboardResponse>('/api/dashboard')
