'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { PageHero, Badge, Skel, ErrorState, EmptyState } from '@/components/ui'
import { PersonRow, Pager } from '@/components/people/parts'
import { timeAgo } from '@/lib/format'
import type { Paged, UserRow } from '@/lib/types'

// The admin team — accounts with portal access (an admin_role). Reuses GET /users with
// the admin role filter; each row opens the same reusable profile the students use.
export default function TeamPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounced(search, 350)

  useEffect(() => { setPage(1) }, [debounced])

  const params = useMemo(() => ({ search: debounced, role: 'admin', page, pageSize: 20 }), [debounced, page])
  const { data, loading, error, reload } = useApi<Paged<UserRow>>('/users', params)
  const rows = data?.rows || []

  const roleLabel = (r: string | null) => (r ? r.replace(/_/g, ' ') : 'admin')

  return (
    <>
      <PageHero eyebrow="People" title="Team" subtitle="Admins and staff with access to this portal. Roles and access are managed from each profile." />

      <div className="list-toolbar">
        <div className="search">
          <Search size={16} />
          <input className="input" placeholder="Search team by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search team" />
        </div>
      </div>

      <div className="people-list">
        {loading && !data ? (
          <div style={{ padding: 10 }}>{Array.from({ length: 5 }).map((_, i) => <Skel key={i} h={52} r={12} style={{ marginBottom: 8 }} />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !rows.length ? (
          <EmptyState icon={ShieldCheck} title="No team members found" message="Admin accounts with portal access will appear here." />
        ) : rows.map((u) => (
          <PersonRow
            key={u.id}
            href={`/people/team/${u.id}`}
            seed={u.id}
            name={u.name}
            sub={u.email || u.phone || '—'}
            when={timeAgo(u.createdAt)}
            right={
              <span className="row gap-8">
                <Badge tone="purple" dot={false}>{roleLabel(u.adminRole)}</Badge>
                <Badge tone={u.isActive ? 'emerald' : 'red'}>{u.isActive ? 'active' : 'deactivated'}</Badge>
              </span>
            }
          />
        ))}
      </div>

      {data && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}
    </>
  )
}
