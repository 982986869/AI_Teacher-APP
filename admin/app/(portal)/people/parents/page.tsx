'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, HeartHandshake, Link2 } from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { PageHero, Badge, Skel, ErrorState, EmptyState } from '@/components/ui'
import { PersonRow, Segmented, Pager } from '@/components/people/parts'
import { timeAgo } from '@/lib/format'
import { S } from '@/lib/theme'
import type { Paged, ParentRow } from '@/lib/types'

export default function ParentsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const debounced = useDebounced(search, 350)

  useEffect(() => { setPage(1) }, [debounced, status])

  const params = useMemo(() => ({ search: debounced, status, page, pageSize: 20 }), [debounced, status, page])
  const { data, loading, error, reload } = useApi<Paged<ParentRow>>('/parents', params)
  const rows = data?.rows || []

  return (
    <>
      <PageHero eyebrow="People" title="Parents" subtitle="Guardians and their linked children. Search, filter by link status, and open a full profile." />

      <div className="list-toolbar">
        <div className="search">
          <Search size={16} />
          <input className="input" placeholder="Search parent or child…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search parents" />
        </div>
        <Segmented value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, { value: 'linked', label: 'Linked' }, { value: 'unlinked', label: 'Unlinked' }]} />
      </div>

      <div className="people-list">
        {loading && !data ? (
          <div style={{ padding: 10 }}>{Array.from({ length: 8 }).map((_, i) => <Skel key={i} h={52} r={12} style={{ marginBottom: 8 }} />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !rows.length ? (
          <EmptyState icon={HeartHandshake} title="No parents found" message="Try a different search or clear the filters." />
        ) : rows.map((p) => (
          <PersonRow
            key={p.id}
            href={`/people/parents/${p.id}`}
            seed={p.id}
            name={p.name}
            sub={p.email || p.phone || '—'}
            when={timeAgo(p.createdAt)}
            right={
              <span className="row gap-8">
                {p.childId
                  ? <span className="row gap-4" style={{ fontSize: 12, fontWeight: 700, color: S.sub }}><Link2 size={13} color={S.emerald} /> {p.childName}{p.childGrade ? <span style={{ color: S.faint }}>· {p.childGrade}</span> : null}</span>
                  : <Badge tone="gold" dot={false}>Not linked</Badge>}
              </span>
            }
          />
        ))}
      </div>

      {data && <Pager page={data.page} totalPages={data.totalPages} total={data.total} onPage={setPage} />}
    </>
  )
}
