/** Response types mirroring the backend. Kept in one file so a mismatch is easy to spot. */

export interface HealthResponse {
  status: 'ok' | 'degraded'
  service: string
  database: { status: 'ok' | 'unavailable'; schemaVersion?: number }
}
