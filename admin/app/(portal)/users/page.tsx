'use client'

import { useState } from 'react'
import { Search, Users as UsersIcon, KeyRound, ShieldCheck, Ban, Trash2, CircleCheck } from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { DataTable, type Column } from '@/components/DataTable'
import { Badge, Card } from '@/components/ui'
import { Drawer, ConfirmDialog, Modal } from '@/components/Modal'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api } from '@/lib/api'
import type { UserRow, Paged, AdminRole } from '@/lib/types'
import { S } from '@/lib/theme'
import { fmtDate, timeAgo, initials, colorFor } from '@/lib/format'
import { UserDetail } from './UserDetail'

const ROLE_TABS = [
  { key: '', label: 'All' },
  { key: 'student', label: 'Students' },
  { key: 'parent', label: 'Parents' },
  { key: 'teacher', label: 'Teachers' },
  { key: 'admin', label: 'Admins' },
]

export default function UsersPage() {
  const { can } = useAuth()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 350)
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [klass, setKlass] = useState('')
  const [sort, setSort] = useState('createdAt')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openId, setOpenId] = useState<string | null>(null)
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  const meta = useApi<{ classes: string[]; adminRoles: { value: string; label: string }[] }>('/users/meta')
  const params = { search: debounced, role, status, class: klass, sort, dir, page, pageSize: 20 }
  const { data, loading, error, reload } = useApi<Paged<UserRow>>('/users', params)

  function onSort(key: string) {
    if (sort === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSort(key); setDir('asc') }
    setPage(1)
  }
  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1); setSelected(new Set()) }
  }

  async function bulkDeactivate() {
    setBulkBusy(true)
    let ok = 0
    for (const id of Array.from(selected)) {
      try { await api(`/users/${id}/status`, { method: 'PATCH', body: { isActive: false } }); ok++ } catch { /* skip */ }
    }
    setBulkBusy(false); setBulkConfirm(false); setSelected(new Set())
    toast(`${ok} user${ok !== 1 ? 's' : ''} deactivated`, 'ok')
    reload()
  }

  const columns: Column<UserRow>[] = [
    {
      key: 'name', header: 'User', sortable: true, render: (u) => (
        <div className="row gap-10">
          <span className="avatar" style={{ background: colorFor(u.id) }}>{initials(u.name)}</span>
          <div className="col" style={{ gap: 0 }}>
            <span className="strong">{u.name}</span>
            <span className="faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{u.email || u.phone || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type', header: 'Role', render: (u) => (
        u.adminRole
          ? <Badge tone="purple">{u.adminRole.replace('_', ' ')}</Badge>
          : <Badge tone={u.accountType === 'parent' ? 'blue' : u.accountType === 'teacher' ? 'cyan' : 'indigo'}>{u.accountType}</Badge>
      ),
    },
    { key: 'grade', header: 'Class', sortable: true, render: (u) => <span className="tnum">{u.grade || '—'}</span> },
    { key: 'stream', header: 'Stream', render: (u) => u.stream || '—' },
    { key: 'status', header: 'Status', render: (u) => <Badge tone={u.isActive ? 'emerald' : 'red'}>{u.isActive ? 'active' : 'deactivated'}</Badge> },
    { key: 'createdAt', header: 'Joined', sortable: true, render: (u) => <span className="nowrap" title={fmtDate(u.createdAt)}>{timeAgo(u.createdAt)}</span> },
  ]

  return (
    <div className="col gap-16">
      <div className="page-head">
        <div>
          <h1 className="h1">Users</h1>
          <div className="sub">Search, inspect and manage every account on the platform.</div>
        </div>
      </div>

      {/* Filters */}
      <Card style={{ padding: 14 }}>
        <div className="row gap-12 wrap">
          <div className="search grow" style={{ minWidth: 220 }}>
            <Search size={16} />
            <input className="input" placeholder="Search by name, email or phone…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <div className="tabs">
            {ROLE_TABS.map((t) => (
              <button key={t.key} className={`tab ${role === t.key ? 'active' : ''}`} onClick={() => resetPage(setRole)(t.key)}>{t.label}</button>
            ))}
          </div>
          <select className="select" style={{ width: 'auto' }} value={klass} onChange={(e) => resetPage(setKlass)(e.target.value)}>
            <option value="">All classes</option>
            {meta.data?.classes?.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => resetPage(setStatus)(e.target.value)}>
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={data?.rows || []}
        rowId={(u) => u.id}
        loading={loading}
        error={error}
        onRetry={reload}
        sort={sort} dir={dir} onSort={onSort}
        page={data?.page} totalPages={data?.totalPages} total={data?.total} onPage={setPage}
        selectable={can('users.edit')}
        selected={selected}
        onSelect={setSelected}
        bulkActions={can('users.edit') ? <button className="btn btn-danger sm" onClick={() => setBulkConfirm(true)}><Ban size={14} /> Deactivate</button> : undefined}
        onRowClick={(u) => setOpenId(u.id)}
        emptyIcon={UsersIcon}
        emptyTitle="No users match these filters"
        emptyMessage="Try clearing the search or filters to see more accounts."
      />

      <Drawer open={!!openId} onClose={() => setOpenId(null)} title="User details">
        {openId && <UserDetail id={openId} onChanged={reload} onClose={() => setOpenId(null)} />}
      </Drawer>

      <ConfirmDialog
        open={bulkConfirm} onClose={() => setBulkConfirm(false)} onConfirm={bulkDeactivate}
        title="Deactivate users" danger busy={bulkBusy} confirmLabel="Deactivate"
        message={<>Deactivate <b>{selected.size}</b> selected account{selected.size !== 1 ? 's' : ''}? They will be blocked from signing in until reactivated.</>}
      />
    </div>
  )
}
