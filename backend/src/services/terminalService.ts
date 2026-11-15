import { findEnvironment } from '../content/environments.js'
import { AppError, notFound } from '../errors.js'
import type { ContentRepository } from '../repositories/contentRepository.js'
import { executeCommand, type ExecuteResult } from '../terminal/engine.js'
import type { TerminalRequest } from '../validation/terminal.js'

/** Finds the simulated environment that belongs to a challenge and runs one command in it. */
export function createTerminalService(content: ContentRepository) {
  return {
    execute(request: TerminalRequest): ExecuteResult {
      const challenge = content.getChallenge(request.challengeId)
      if (!challenge) throw notFound('Challenge')
      if (!challenge.terminalEnv) throw new AppError(400, 'NO_TERMINAL', 'This challenge does not use the terminal.')
      const environment = findEnvironment(challenge.terminalEnv)
      if (!environment) throw new AppError(500, 'ENVIRONMENT_MISSING', 'The terminal environment for this challenge is not available.')
      return executeCommand(environment, { command: request.command, cwd: request.cwd, history: request.history })
    },
  }
}
