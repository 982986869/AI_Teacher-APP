'use client'

import { useState } from 'react'
import { Search, UsersRound, Link2, Unlink } from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { DataTable, type Column } from '@/components/DataTable'
import { Badge, Card } from '@/components/ui'
import { Drawer } from '@/components/Modal'
import type { ParentRow, Paged } from '@/lib/types'
import { fmtDate, timeAgo, initials, colorFor } from '@/lib/format'
import { ParentDetail } from './ParentDetail'

const TABS = [
  { k: '', l: 'All' },
  { k: 'linked', l: 'Linked' },
  { k: 'unlinked', l: 'Unlinked' },
]

export default function ParentsPage() {
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 350)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)

  const { data, loading, error, reload } = useApi<Paged<ParentRow>>('/parents', { search: debounced, status, page, pageSize: 20 })

  const columns: Column<ParentRow>[] = [
    {
      key: 'name', header: 'Parent', render: (p) => (
        <div className="row gap-10">
          <span className="avatar" style={{ background: colorFor(p.id) }}>{initials(p.name)}</span>
          <div className="col" style={{ gap: 0 }}>
            <span className="strong">{p.name}</span>
            <span className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{p.email || p.phone || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'child', header: 'Linked child', render: (p) => p.childId ? (
        <div className="row gap-8">
          <Link2 size={14} color="var(--emerald)" />
          <span className="strong">{p.childName}</span>
          {p.childGrade && <Badge tone="indigo" dot={false}>{p.childGrade}</Badge>}
        </div>
      ) : <span className="row gap-6 faint" style={{ fontWeight: 700 }}><Unlink size={13} /> Not linked</span>,
    },
    { key: 'status', header: 'Status', render: (p) => <Badge tone={p.isActive ? 'emerald' : 'red'}>{p.isActive ? 'active' : 'deactivated'}</Badge> },
    { key: 'createdAt', header: 'Joined', render: (p) => <span className="nowrap" title={fmtDate(p.createdAt)}>{timeAgo(p.createdAt)}</span> },
  ]

  return (
    <div className="col gap-16">
      <div className="page-head">
        <div>
          <h1 className="h1">Parents</h1>
          <div className="sub">Parent accounts, their linked child and the child's learning progress.</div>
        </div>
      </div>

      <Card style={{ padding: 14 }}>
        <div className="row gap-12 wrap">
          <div className="search grow" style={{ minWidth: 220 }}>
            <Search size={16} />
            <input className="input" placeholder="Search parent or child…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <div className="tabs">
            {TABS.map((t) => <button key={t.k} className={`tab ${status === t.k ? 'active' : ''}`} onClick={() => { setStatus(t.k); setPage(1) }}>{t.l}</button>)}
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={data?.rows || []}
        rowId={(p) => p.id}
        loading={loading}
        error={error}
        onRetry={reload}
        page={data?.page} totalPages={data?.totalPages} total={data?.total} onPage={setPage}
        onRowClick={(p) => setOpenId(p.id)}
        emptyIcon={UsersRound}
        emptyTitle="No parents match"
        emptyMessage="Parent accounts appear here once someone signs up as a parent."
      />

      <Drawer open={!!openId} onClose={() => setOpenId(null)} title="Parent details">
        {openId && <ParentDetail id={openId} onChanged={reload} />}
      </Drawer>
    </div>
  )
}
