'use client'

import { useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { DataTable, type Column } from '@/components/DataTable'
import { Badge, Card } from '@/components/ui'
import { Drawer } from '@/components/Modal'
import type { AuditEntry, Paged } from '@/lib/types'
import { S } from '@/lib/theme'
import { fmtDateTime, timeAgo, initials, colorFor } from '@/lib/format'

const MODULE_TONE: Record<string, any> = {
  auth: 'cyan', users: 'indigo', content: 'blue', announcements: 'purple',
  settings: 'orange', aiteacher: 'emerald',
}

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 350)
  const [mod, setMod] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<AuditEntry | null>(null)

  const facets = useApi<{ modules: string[]; actions: string[] }>('/audit/facets')
  const { data, loading, error, reload } = useApi<Paged<AuditEntry>>('/audit', { search: debounced, module: mod, page, pageSize: 25 })

  const cols: Column<AuditEntry>[] = [
    {
      key: 'actor', header: 'Actor', render: (e) => (
        <div className="row gap-10">
          <span className="avatar" style={{ background: colorFor(e.actorId || e.actorName || '?') }}>{initials(e.actorName)}</span>
          <div className="col" style={{ gap: 0 }}>
            <span className="strong">{e.actorName || 'System'}</span>
            <span className="faint" style={{ fontSize: 11.5 }}>{e.actorRole?.replace('_', ' ') || '—'}</span>
          </div>
        </div>
      ),
    },
    { key: 'module', header: 'Module', render: (e) => <Badge tone={MODULE_TONE[e.module] || 'indigo'} dot={false}>{e.module}</Badge> },
    { key: 'action', header: 'Action', render: (e) => <span className="strong" style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{e.action}</span> },
    { key: 'target', header: 'Target', render: (e) => <span className="truncate" style={{ maxWidth: 220, display: 'inline-block' }}>{e.targetLabel || e.targetType || '—'}</span> },
    { key: 'when', header: 'When', render: (e) => <span className="nowrap" title={fmtDateTime(e.createdAt)}>{timeAgo(e.createdAt)}</span> },
  ]

  return (
    <div className="col gap-16">
      <div className="page-head">
        <div>
          <h1 className="h1">Audit Logs</h1>
          <div className="sub">An immutable trail of every administrative change — who did what, when, and the before/after values.</div>
        </div>
      </div>

      <div className="row gap-12 wrap">
        <div className="search grow" style={{ minWidth: 220, maxWidth: 360 }}>
          <Search size={16} />
          <input className="input" placeholder="Search actor, action or target…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="select" style={{ width: 'auto' }} value={mod} onChange={(e) => { setMod(e.target.value); setPage(1) }}>
          <option value="">All modules</option>
          {facets.data?.modules?.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <DataTable columns={cols} rows={data?.rows || []} rowId={(e) => e.id} loading={loading} error={error} onRetry={reload}
        page={data?.page} totalPages={data?.totalPages} total={data?.total} onPage={setPage}
        onRowClick={(e) => setOpen(e)}
        emptyIcon={ScrollText} emptyTitle="No audit entries" emptyMessage="Administrative actions are recorded here as they happen." />

      <Drawer open={!!open} onClose={() => setOpen(null)} title="Audit entry">
        {open && (
          <div className="col gap-14">
            <div className="row gap-10">
              <span className="avatar" style={{ background: colorFor(open.actorId || '?'), width: 44, height: 44, borderRadius: 13 }}>{initials(open.actorName)}</span>
              <div><div style={{ fontWeight: 900, fontSize: 15 }}>{open.actorName || 'System'}</div><div className="faint" style={{ fontSize: 12 }}>{open.actorEmail}</div></div>
            </div>
            <div className="grid cols-2" style={{ gap: 10 }}>
              <Kv label="Module" value={open.module} />
              <Kv label="Action" value={open.action} />
              <Kv label="Target" value={open.targetLabel || open.targetType || '—'} />
              <Kv label="When" value={fmtDateTime(open.createdAt)} />
              <Kv label="IP" value={open.ip || '—'} />
              <Kv label="Role" value={open.actorRole?.replace('_', ' ') || '—'} />
            </div>
            {(open.before || open.after) && (
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Change</div>
                <div className="grid cols-2" style={{ gap: 10 }}>
                  <DiffBox label="Before" value={open.before} tone={S.red} />
                  <DiffBox label="After" value={open.after} tone={S.emerald} />
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: S.canvas, borderRadius: 12, padding: '9px 12px' }}>
      <div className="faint" style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 13, marginTop: 2, wordBreak: 'break-word' }}>{value}</div>
    </div>
  )
}

function DiffBox({ label, value, tone }: { label: string; value: any; tone: string }) {
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${tone}33`, background: `${tone}0d`, padding: 12 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: tone }}>{label}</div>
      <pre style={{ margin: '6px 0 0', fontSize: 11.5, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: S.sub }}>
        {value === null || value === undefined ? '—' : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}
