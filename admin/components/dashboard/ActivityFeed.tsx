'use client'

import { useEffect, useRef, useState } from 'react'
import {
  UserPlus, GraduationCap, ClipboardCheck, Dumbbell, ShieldCheck,
  ChevronLeft, ChevronRight, type LucideIcon,
} from 'lucide-react'
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

/**
 * The feed, a page at a time.
 *
 * Paged rather than scrolled because the card sits beside a fixed-height column:
 * letting it grow to thirty rows stretched the whole row and pushed everything
 * below it off the screen. A fixed four keeps the dashboard's shape stable
 * however much activity there happens to be.
 */
export function ActivityFeed({ items, pageSize = 4 }: { items: ActivityItem[]; pageSize?: number }) {
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState<1 | -1>(1)
  const firstRender = useRef(true)

  const pages = Math.max(1, Math.ceil(items.length / pageSize))
  // A refresh can return fewer items than before; without this the view could sit
  // on a page that no longer exists and render blank.
  useEffect(() => { if (page > pages - 1) setPage(0) }, [pages, page])
  useEffect(() => { firstRender.current = false }, [])

  if (!items.length) {
    return <EmptyState icon={UserPlus} title="No recent activity" message="Signups, lessons, mocks, Brain Gym sessions and admin actions will stream in here." />
  }

  const start = page * pageSize
  const shown = items.slice(start, start + pageSize)
  const go = (next: number) => { setDir(next > page ? 1 : -1); setPage(next) }

  return (
    <div className="col" style={{ gap: 10 }}>
      {/* Keyed on the page so the rows remount and replay their entrance; the
          direction decides which side they come in from, so paging forward and
          back feel like moving along a list rather than a reshuffle. */}
      <div className="col feed-page" key={page} data-dir={dir} style={{ gap: 1 }}>
        {shown.map((it, i) => {
          const k = KIND[it.type]
          const a = accent(k.tone)
          return (
            <div
              key={it.id}
              className="feed-row"
              style={{ animationDelay: (firstRender.current ? 0 : i * 45) + 'ms' }}
            >
              <span className="feed-icon" style={{ background: a.soft }}>
                <k.icon size={16} color={a.color} strokeWidth={2.3} />
              </span>
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

      {pages > 1 && (
        <div className="feed-pager">
          <span className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>
            {start + 1}–{Math.min(start + pageSize, items.length)} of {items.length}
          </span>

          <div className="row gap-8" style={{ alignItems: 'center', marginLeft: 'auto' }}>
            {/* Dots, but only while they stay countable. Past that the range
                above already says where you are and a row of 20 dots is noise. */}
            {pages <= 8 && (
              <div className="feed-dots">
                {Array.from({ length: pages }).map((_, i) => (
                  <button
                    key={i}
                    className={'feed-dot' + (i === page ? ' on' : '')}
                    onClick={() => go(i)}
                    aria-label={'Page ' + (i + 1) + ' of ' + pages}
                    aria-current={i === page ? 'true' : undefined}
                  />
                ))}
              </div>
            )}
            <button className="btn btn-ghost sm" onClick={() => go(page - 1)} disabled={page === 0} aria-label="Previous activity">
              <ChevronLeft size={15} />
            </button>
            <button className="btn btn-ghost sm" onClick={() => go(page + 1)} disabled={page >= pages - 1} aria-label="More activity">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes feed-in-fwd  { from { opacity: 0; transform: translateX(14px); } }
        @keyframes feed-in-back { from { opacity: 0; transform: translateX(-14px); } }

        .feed-page[data-dir="1"]  .feed-row { animation: feed-in-fwd  .34s cubic-bezier(.22,1,.36,1) both; }
        .feed-page[data-dir="-1"] .feed-row { animation: feed-in-back .34s cubic-bezier(.22,1,.36,1) both; }

        .feed-pager {
          display: flex; align-items: center; gap: 10px;
          padding-top: 10px; border-top: 1px solid var(--hair);
        }
        .feed-dots { display: flex; align-items: center; gap: 5px; }
        .feed-dot {
          width: 6px; height: 6px; padding: 0; border: 0; border-radius: 99px;
          background: var(--line); cursor: pointer;
          transition: width .26s cubic-bezier(.22,1,.36,1), background .26s;
        }
        .feed-dot:hover { background: var(--muted); }
        .feed-dot.on { width: 18px; background: var(--accent); }
        .feed-dot:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

        @media (prefers-reduced-motion: reduce) {
          .feed-page .feed-row { animation: none !important; }
          .feed-dot { transition: none; }
        }
      `}</style>
    </div>
  )
}
