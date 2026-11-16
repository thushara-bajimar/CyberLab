import { getModules } from '../api/endpoints'
import { ModuleCard } from '../components/content/ModuleCard'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States'
import { useApi } from '../hooks/useApi'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function ModulesPage() {
  const modules = useApi(getModules)
  useDocumentTitle('Modules')
  return (
    <>
      <PageHeader
        eyebrow="Learning modules"
        title="Choose a topic"
        description="Each module introduces one area of cybersecurity and ends with hands-on challenges. Work through them in order or jump to what interests you."
      />
      {modules.status === 'loading' && <LoadingState label="Loading modules…" />}
      {modules.status === 'error' && <ErrorState message={modules.error} onRetry={modules.reload} />}
      {modules.status === 'success' &&
        (modules.data.modules.length === 0 ? (
          <EmptyState title="No modules available">The course content has not been loaded on the server.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.data.modules.map((module) => (
              <div key={module.id} className="relative">
                <ModuleCard module={module} />
              </div>
            ))}
          </div>
        ))}
    </>
  )
}
