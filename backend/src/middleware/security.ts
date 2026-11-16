import type { RequestHandler } from 'express'
import { AppError } from '../errors.js'

/**
 * HTTP-level protections for a JSON-only API that runs on the learner's own computer.
 * Each one is small enough to explain; no extra dependency is needed.
 */

/** Headers sent with every response. */
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff') // browsers must not guess a different content type
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-Frame-Options', 'DENY') // the API must never be framed (clickjacking)
  // The API only returns JSON: nothing in a response may load scripts, styles or frames.
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin')
  res.setHeader('Cache-Control', 'no-store') // progress data is personal and changes constantly
  next()
}

export const DEFAULT_ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]']

/** "127.0.0.1:4000" -> "127.0.0.1", "[::1]:4000" -> "[::1]", "LocalHost" -> "localhost". */
export function hostnameOf(hostHeader: string): string {
  const value = hostHeader.trim().toLowerCase()
  if (value.startsWith('[')) return value.slice(0, value.indexOf(']') + 1)
  return value.split(':')[0] ?? ''
}

/**
 * DNS-rebinding protection. A malicious website can make its own domain name resolve to 127.0.0.1 and then
 * call this API "same-origin" from the victim's browser. Such requests still carry the attacker's domain in
 * the Host header, so only the expected local host names are accepted.
 */
export function hostGuard(allowedHosts: string[]): RequestHandler {
  const allowed = new Set(allowedHosts.map((host) => host.toLowerCase()))
  return (req, _res, next) => {
    const host = req.headers.host
    if (!host || !allowed.has(hostnameOf(host))) {
      next(new AppError(403, 'HOST_NOT_ALLOWED', 'Requests must be addressed to the local CyberLab server.'))
      return
    }
    next()
  }
}

/**
 * Every POST must carry Content-Type: application/json. HTML forms and simple cross-site requests can only
 * send text/plain, form-urlencoded or multipart bodies, so this also blocks cross-site request forgery: a JSON
 * request from another website needs a CORS preflight, which this API never approves.
 */
export const requireJson: RequestHandler = (req, _res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    next(new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send the request body as JSON with Content-Type: application/json.'))
    return
  }
  next()
}

/** For a known URL used with the wrong method: 405 plus an Allow header listing the right ones. */
export function methodNotAllowed(...methods: string[]): RequestHandler {
  return (_req, res, next) => {
    res.setHeader('Allow', methods.join(', '))
    next(new AppError(405, 'METHOD_NOT_ALLOWED', `This endpoint only supports ${methods.join(', ')}.`))
  }
}
