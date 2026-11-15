import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../errors.js'

/** Every error response uses one shape: { "error": { "code": "...", "message": "..." } }. */
function body(code: string, message: string, details?: unknown) {
  return { error: details === undefined ? { code, message } : { code, message, details } }
}

export const apiNotFound: RequestHandler = (_req, res) => {
  res.status(404).json(body('NOT_FOUND', 'This API endpoint does not exist.'))
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json(body(error.code, error.message))
    return
  }
  if (error instanceof ZodError) {
    // Report which field failed and why, but never echo the submitted values back.
    const details = error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
    res.status(400).json(body('VALIDATION_ERROR', 'The request is not valid.', details))
    return
  }
  // Errors raised by express.json(): malformed JSON or an oversized body.
  const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500
  if (status === 400 && (error as { type?: string }).type === 'entity.parse.failed') {
    res.status(400).json(body('INVALID_JSON', 'The request body is not valid JSON.'))
    return
  }
  if (status === 413) {
    res.status(413).json(body('PAYLOAD_TOO_LARGE', 'The request body is too large.'))
    return
  }
  console.error('Unexpected error:', error instanceof Error ? error.message : error)
  res.status(500).json(body('INTERNAL_ERROR', 'An unexpected server error occurred.'))
}
