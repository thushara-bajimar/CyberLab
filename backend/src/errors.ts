/** An error that is safe to show to the client, with an HTTP status and a stable machine-readable code. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const notFound = (what: string) => new AppError(404, 'NOT_FOUND', `${what} was not found.`)
