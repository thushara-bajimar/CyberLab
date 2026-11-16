import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/** Shown for unknown URLs (and as the router's error boundary). */
export function NotFoundPage() {
  // As the "*" route there is no route error (useRouteError returns null); as the error boundary there is one.
  const error = useRouteError()
  const unexpected = error != null && !(isRouteErrorResponse(error) && error.status === 404)
  useDocumentTitle(unexpected ? 'Something went wrong' : 'Page not found')
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-mono text-emerald-400">{unexpected ? 'error' : '404'}</p>
      <h1 className="mt-2 text-2xl font-semibold">{unexpected ? 'Something went wrong' : 'Page not found'}</h1>
      <p className="mt-2 text-slate-400">
        {unexpected ? 'An unexpected error occurred while showing this page.' : 'The address you opened does not match any CyberLab page.'}
      </p>
      <Link to="/" className="mt-6 inline-block rounded-md bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400">
        Back to the dashboard
      </Link>
    </div>
  )
}
