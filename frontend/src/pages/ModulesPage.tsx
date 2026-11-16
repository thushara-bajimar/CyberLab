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
        title="Choose what to learn"
        description="Each module explains one area of cybersecurity in plain language and then lets you practise it with hands-on challenges. Follow the order or jump to whatever interests you."
      />
      {modules.status === 'loading' && <LoadingState label="Loading modules…" />}
      {modules.status === 'error' && <ErrorState message={modules.error} onRetry={modules.reload} />}
      {modules.status === 'success' &&
        (modules.data.modules.length === 0 ? (
          <EmptyState title="No modules available">The course content has not been loaded on the server.</EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.data.modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        ))}
    </>
  )
}
