import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ActivityItem, ActivityType } from '../../api/types'
import { activityLabel, formatDateTime, timeAgo } from '../../utils/format'

const icon: Record<ActivityType, { Icon: typeof CheckCircle2; color: string }> = {
  completed: { Icon: CheckCircle2, color: 'text-emerald-400' },
  hint_revealed: { Icon: Lightbulb, color: 'text-amber-300' },
  incorrect_attempt: { Icon: XCircle, color: 'text-slate-400' },
}

/** Activity feed shared by the dashboard and the progress page. */
export function ActivityList({ items, showModule = false }: { items: ActivityItem[]; showModule?: boolean }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item) => {
        const { Icon, color } = icon[item.eventType]
        return (
          <li key={item.id} className="flex gap-3 text-sm">
            <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} aria-hidden="true" />
            <div>
              <p className="text-slate-200">
                {activityLabel[item.eventType]}:{' '}
                {/* Underlined so the link is recognisable without relying on colour (WCAG link-in-text-block). */}
                <Link to={`/challenges/${item.challengeId}`} className="text-emerald-300 underline decoration-emerald-300/50 underline-offset-2 hover:decoration-emerald-300">
                  {item.challengeTitle}
                </Link>
                {showModule && <span className="text-slate-400"> · {item.moduleTitle}</span>}
              </p>
              <p className="text-xs text-slate-400">
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
