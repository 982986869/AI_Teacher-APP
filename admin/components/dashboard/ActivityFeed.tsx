'use client'

import { UserPlus, GraduationCap, ClipboardCheck, Dumbbell, ShieldCheck, type LucideIcon } from 'lucide-react'
import { EmptyState } from '@/components/ui'
import { accent, type AccentKey } from '@/lib/theme'
import { timeAgo } from '@/lib/format'
import type { ActivityItem } from '@/lib/types'

const KIND: Record<ActivityItem['type'], { icon: LucideIcon; tone: AccentKey; verb: string }> = {
  signup: { icon: UserPlus, tone: 'indigo', verb: 'New registration' },
  lesson_completed: { icon: GraduationCap, tone: 'purple', verb: 'Completed a lesson' },
  mock_submitted: { icon: ClipboardCheck, tone: 'blue', verb: 'Submitted a mock' },
  braingym_completed: { icon: Dumbbell, tone: 'orange', verb: 'Brain Gym session' },
  admin_action: { icon: ShieldCheck, tone: 'emerald', verb: 'Admin action' },
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (!items.length) {
    return <EmptyState icon={UserPlus} title="No recent activity" message="Signups, lessons, mocks, Brain Gym sessions and admin actions will stream in here." />
  }
  return (
    <div className="col" style={{ gap: 1 }}>
      {items.map((it) => {
        const k = KIND[it.type]
        const a = accent(k.tone)
        return (
          <div key={it.id} className="feed-row">
            <span className="feed-icon" style={{ background: a.soft }}><k.icon size={16} color={a.color} strokeWidth={2.3} /></span>
            <div className="feed-body">
              <div className="feed-title truncate">{it.title || k.verb}</div>
              <div className="feed-sub truncate">{k.verb}{it.subtitle ? ` · ${it.subtitle}` : ''}</div>
            </div>
            <div className="col" style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
              {it.meta && <span className="badge" style={{ background: a.soft, color: a.color, padding: '2px 8px' }}>{it.meta}</span>}
              <span className="faint" style={{ fontSize: 11, fontWeight: 700 }}>{timeAgo(it.at)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
