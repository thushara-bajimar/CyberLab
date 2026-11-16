import { Compass, TriangleAlert } from 'lucide-react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { primaryButton } from '../utils/styles'

/** Shown for unknown URLs (and as the router's error boundary). */
export function NotFoundPage() {
  // As the "*" route there is no route error (useRouteError returns null); as the error boundary there is one.
  const error = useRouteError()
  const unexpected = error != null && !(isRouteErrorResponse(error) && error.status === 404)
  useDocumentTitle(unexpected ? 'Something went wrong' : 'Page not found')
  const Icon = unexpected ? TriangleAlert : Compass
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className={`mx-auto grid size-16 place-items-center rounded-2xl ${unexpected ? 'bg-danger-tile text-danger-ink' : 'bg-accent-tile text-accent-ink'}`} aria-hidden="true">
        <Icon className="size-8" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-ink">{unexpected ? 'Something went wrong' : 'Page not found'}</h1>
      <p className="mt-2 text-muted">
        {unexpected ? 'An unexpected error occurred while showing this page.' : 'The address you opened does not match any CyberLab page.'}
      </p>
      <Link to="/" className={`${primaryButton} mt-6`}>
        Back to the dashboard
      </Link>
    </div>
  )
}
