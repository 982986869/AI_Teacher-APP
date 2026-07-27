'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, GraduationCap } from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { PageHero, Badge, Skel, ErrorState, EmptyState } from '@/components/ui'
import { PersonRow, Segmented, Pager } from '@/components/people/parts'
import { timeAgo } from '@/lib/format'
import type { Paged, UserRow } from '@/lib/types'

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [klass, setKlass] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounced(search, 350)

  // Seed the search box from the product-bar global search (?q=…) once on mount.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')
    if (q) setSearch(q)
  }, [])

  useEffect(() => { setPage(1) }, [debounced, status, klass])

  const meta = useApi<{ classes: string[] }>('/users/meta')
  const params = useMemo(() => ({ search: debounced, role: 'student', status, class: klass, page, pageSize: 20 }), [debounced, status, klass, page])
  const { data, loading, error, reload } = useApi<Paged<UserRow>>('/users', params)
  const rows = data?.rows || []

  return (
    <>
      <PageHero eyebrow="People" title="Students" subtitle="Every learner on Ailernova. Search, filter by class or status, and open a full profile." />

      <div className="list-toolbar">
        <div className="search">
          <Search size={16} />
          <input className="input" placeholder="Search by name, email or phone…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search students" />
        </div>
        <select className="select" style={{ width: 'auto' }} value={klass} onChange={(e) => setKlass(e.target.value)} aria-label="Filter by class">
          <option value="">All classes</option>
          {(meta.data?.classes || []).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <Segmented value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'deactivated', label: 'Deactivated' }]} />
      </div>

      <div className="people-list">
        {loading && !data ? (
          <div style={{ padding: 10 }}>{Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={52} r={12} style={{ marginBottom: 8 }} />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !rows.length ? (
          <EmptyState icon={GraduationCap} title="No students found" message="Try a different search or clear the filters." />
        ) : rows.map((u) => (
          <PersonRow
            key={u.id}
            href={`/people/students/${u.id}`}
            seed={u.id}
            name={u.name}
            sub={u.email || u.phone || '—'}
            when={timeAgo(u.createdAt)}
            right={
              <span className="row gap-8">
                {u.grade ? <Badge tone="indigo" dot={false}>{u.grade}</Badge> : null}
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
