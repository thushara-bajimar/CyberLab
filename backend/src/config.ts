import path from 'node:path'

/** Folder that contains package.json (works from both src/ under tsx and dist/ after a build). */
export const BACKEND_ROOT = path.resolve(import.meta.dirname, '..')

export interface AppConfig {
  port: number
  host: string
  databasePath: string
  /** Host names accepted in the Host header (DNS-rebinding protection). */
  allowedHosts: string[]
}

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]']

export function isLoopback(host: string): boolean {
  return ['127.0.0.1', 'localhost', '::1', '[::1]'].includes(host.toLowerCase())
}

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return 4000
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535, received "${value}".`)
  }
  return port
}

/** Reads configuration from environment variables, falling back to safe local defaults. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const databasePath = env.DATABASE_PATH?.trim() || 'data/cyberlab.sqlite'
  const host = env.HOST?.trim() || '127.0.0.1'
  const extraHosts = (env.ALLOWED_HOSTS ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
  return {
    port: parsePort(env.PORT),
    host,
    databasePath: databasePath === ':memory:' ? databasePath : path.resolve(BACKEND_ROOT, databasePath),
    allowedHosts: [...new Set([...LOOPBACK_HOSTS, ...extraHosts])],
  }
}
