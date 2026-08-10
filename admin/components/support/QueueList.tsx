'use client'

import { Search } from 'lucide-react'
import { Badge, EmptyState, Skel } from '@/components/ui'
import { S } from '@/lib/theme'
import { timeAgo } from '@/lib/format'
import { SUPPORT_TEAMS, type Ticket, type TicketStatus } from '@/lib/types'

const TABS: { k: TicketStatus | 'all'; l: string }[] = [
  { k: 'open', l: 'Open' },
  { k: 'pending_confirmation', l: 'Pending' },
  { k: 'closed', l: 'Closed' },
  { k: 'all', l: 'All' },
]

// A ticket waiting more than a day with nobody having looked at it is the failure this
// console exists to prevent — with one person on support there is no colleague to
// notice. It is marked red rather than merely sorted first.
const STALE_MS = 24 * 60 * 60 * 1000
function isStale(t: Ticket) {
  if (t.status === 'closed') return false
  return !t.staffReadAt && Date.now() - new Date(t.createdAt).getTime() > STALE_MS
}
const isUnread = (t: Ticket) =>
  !t.staffReadAt || new Date(t.staffReadAt) < new Date(t.updatedAt)

export function QueueList({
  tickets, loading, status, onStatus, team, onTeam, search, onSearch, selectedId, onSelect,
}: {
  tickets: Ticket[]
  loading: boolean
  status: TicketStatus | 'all'
  onStatus: (s: TicketStatus | 'all') => void
  team: string
  onTeam: (t: string) => void
  search: string
  onSearch: (s: string) => void
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: `1px solid ${S.border}` }}>
      <div style={{ padding: 12, borderBottom: `1px solid ${S.hair}` }}>
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: S.faint }} />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Ref, name or phone"
            style={{
              width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8,
              border: `1px solid ${S.border}`, fontSize: 13, color: S.ink, background: S.card,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => onStatus(t.k)}
              style={{
                padding: '5px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${status === t.k ? S.indigo : S.border}`,
                background: status === t.k ? S.indigoSoft : S.card,
                color: status === t.k ? S.indigo : S.muted,
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', ...SUPPORT_TEAMS].map((tm) => (
            <button
              key={tm || 'all'}
              onClick={() => onTeam(tm)}
              style={{
                padding: '4px 9px', borderRadius: 999, fontSize: 11, cursor: 'pointer',
                border: `1px solid ${team === tm ? S.purple : S.border}`,
                background: team === tm ? S.purpleSoft : 'transparent',
                color: team === tm ? S.purple : S.muted,
              }}
            >
              {tm || 'All teams'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: 12 }}>
            {[0, 1, 2, 3].map((i) => <Skel key={i} h={54} style={{ marginBottom: 8 }} />)}
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <EmptyState title="Kuch nahi hai" message="Is filter mein koi ticket nahi." />
        )}

        {!loading && tickets.map((t) => {
          const active = t.id === selectedId
          const stale = isStale(t)
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                padding: '10px 12px', border: 'none',
                borderLeft: `3px solid ${active ? S.indigo : 'transparent'}`,
                borderBottom: `1px solid ${S.hair}`,
                background: active ? S.indigoSoft : S.card,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  {isUnread(t) && (
                    <span style={{ width: 7, height: 7, borderRadius: 4, background: S.indigo, flexShrink: 0 }} />
                  )}
                  <strong style={{ fontSize: 12.5, color: S.ink }}>{t.ref}</strong>
                  <Badge tone="purple" dot={false}>{t.team}</Badge>
                </span>
                <span style={{ fontSize: 11, color: stale ? S.red : S.faint, fontWeight: stale ? 700 : 400, flexShrink: 0 }}>
                  {timeAgo(t.createdAt)}
                </span>
              </div>
              <div style={{ fontSize: 12, color: S.sub, marginTop: 3 }}>
                {t.raisedBy?.name || 'Unknown'}
                {t.childName ? ` · ${t.childName} ke liye` : ''}
              </div>
              {t.status === 'pending_confirmation' && (
                <div style={{ fontSize: 11, color: S.gold, marginTop: 3 }}>
                  User ki confirmation ka intezaar
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
