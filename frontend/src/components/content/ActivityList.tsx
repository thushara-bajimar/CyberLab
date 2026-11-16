import { CheckCircle2, Lightbulb, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ActivityItem, ActivityType } from '../../api/types'
import { activityLabel, formatDateTime, timeAgo } from '../../utils/format'

const icon: Record<ActivityType, { Icon: typeof CheckCircle2; chip: string }> = {
  completed: { Icon: CheckCircle2, chip: 'bg-success-tile text-success-ink' },
  hint_revealed: { Icon: Lightbulb, chip: 'bg-warning-tile text-warning-ink' },
  incorrect_attempt: { Icon: RotateCcw, chip: 'bg-surface-3 text-muted' },
}

/** Activity feed shared by the dashboard and the progress page. */
export function ActivityList({ items, showModule = false }: { items: ActivityItem[]; showModule?: boolean }) {
  return (
    <ol className="flex flex-col gap-4">
      {items.map((item) => {
        const { Icon, chip } = icon[item.eventType]
        return (
          <li key={item.id} className="flex gap-3 text-sm">
            <span className={`grid size-8 shrink-0 place-items-center rounded-full ${chip}`} aria-hidden="true">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-ink">
                {activityLabel[item.eventType]}:{' '}
                {/* Underlined so the link is recognisable without relying on colour (WCAG link-in-text-block). */}
                <Link
                  to={`/challenges/${item.challengeId}`}
                  className="font-semibold text-accent-ink underline decoration-accent-line underline-offset-2 hover:decoration-accent-ink"
                >
                  {item.challengeTitle}
                </Link>
                {showModule && <span className="text-muted"> · {item.moduleTitle}</span>}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {item.detail} ·{' '}
                <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>
                  {timeAgo(item.createdAt)}
                </time>
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
