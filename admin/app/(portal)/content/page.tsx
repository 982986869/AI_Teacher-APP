'use client'

import { useState } from 'react'
import {
  BookOpen, Layers, FileText, ListChecks, FileQuestion, ClipboardList, GraduationCap,
  Dumbbell, Search, Archive, CircleCheck, PenLine, Ban,
} from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { DataTable, type Column } from '@/components/DataTable'
import { Card, SectionHead, StatCard, Badge, Skel, PendingBanner } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api } from '@/lib/api'
import type { Paged } from '@/lib/types'
import { S } from '@/lib/theme'
import { fmtNum, timeAgo } from '@/lib/format'

type Tab = 'catalog' | 'braingym' | 'mock'

export default function ContentPage() {
  const [tab, setTab] = useState<Tab>('catalog')
  const overview = useApi<any>('/content/overview')
  const c = overview.data?.counts

  return (
    <div className="col gap-16">
      <div className="page-head">
        <div>
          <h1 className="h1">Content</h1>
          <div className="sub">The curriculum catalog, question banks and assessments powering the app.</div>
        </div>
      </div>

      <div className="grid cols-4">
        <StatCard icon={GraduationCap} tone="indigo" label="Subjects" value={overview.loading ? null : c?.subjects ?? 0} />
        <StatCard icon={Layers} tone="blue" label="Chapters" value={overview.loading ? null : c?.chapters ?? 0} />
        <StatCard icon={FileText} tone="emerald" label="Revision notes" value={overview.loading ? null : c?.notes ?? 0} />
        <StatCard icon={ListChecks} tone="purple" label="MCQs" value={overview.loading ? null : c?.mcqs ?? 0} />
        <StatCard icon={FileQuestion} tone="cyan" label="Bank questions" value={overview.loading ? null : c?.questions ?? 0} />
        <StatCard icon={ClipboardList} tone="orange" label="Mock tests" value={overview.loading ? null : c?.mockTests ?? 0} />
        <StatCard icon={ClipboardList} tone="gold" label="Online tests" value={overview.loading ? null : c?.onlineTests ?? 0} />
        <StatCard icon={Dumbbell} tone="red" label="Brain Gym qs" value={overview.loading ? null : c?.brainGym?.total ?? 0} />
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'catalog' ? 'active' : ''}`} onClick={() => setTab('catalog')}>Catalog</button>
        <button className={`tab ${tab === 'braingym' ? 'active' : ''}`} onClick={() => setTab('braingym')}>Brain Gym bank<span className="n">{fmtNum(c?.brainGym?.total)}</span></button>
        <button className={`tab ${tab === 'mock' ? 'active' : ''}`} onClick={() => setTab('mock')}>Mock tests<span className="n">{fmtNum(c?.mockTests)}</span></button>
      </div>

      {tab === 'catalog' && <Catalog classes={overview.data?.classes || []} />}
      {tab === 'braingym' && <BrainGymBank />}
      {tab === 'mock' && <MockTests />}
    </div>
  )
}

// ─── Catalog: class → subjects → chapters ──────────────────────────────────────
function Catalog({ classes }: { classes: number[] }) {
  const [klass, setKlass] = useState<string>('')
  const subjects = useApi<{ rows: any[] }>('/content/subjects', { class: klass })
  const [subject, setSubject] = useState<string>('')
  const chapters = useApi<{ rows: any[] }>(subject ? '/content/chapters' : null, { subject, class: klass })

  const chapterCols: Column<any>[] = [
    { key: 'name', header: 'Chapter', render: (r) => <span className="strong">{r.name}</span> },
    { key: 'subject', header: 'Subject', render: (r) => r.subject },
    { key: 'classLevel', header: 'Class', render: (r) => <Badge tone="indigo" dot={false}>Class {r.classLevel}</Badge> },
    { key: 'sections', header: 'Sections', align: 'right', render: (r) => <span className="tnum">{r.sections}</span> },
    { key: 'subtopics', header: 'Subtopics', align: 'right', render: (r) => <span className="tnum">{r.subtopics}</span> },
  ]

  return (
    <div className="grid" style={{ gridTemplateColumns: '320px 1fr', gap: 16 }}>
      <Card>
        <SectionHead title="Subjects" tone="indigo" right={
          <select className="select" style={{ width: 'auto', padding: '5px 8px', fontSize: 12 }} value={klass} onChange={(e) => { setKlass(e.target.value); setSubject('') }}>
            <option value="">All classes</option>
            {classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
          </select>
        } />
        {subjects.loading ? <div className="col gap-8">{[0, 1, 2, 3].map((i) => <Skel key={i} h={44} />)}</div> : (
          <div className="col gap-6">
            {(subjects.data?.rows || []).map((s) => (
              <button key={s.id} onClick={() => setSubject(s.slug)}
                className="row between" style={{ padding: '11px 12px', borderRadius: 12, border: '1px solid var(--hair)', background: subject === s.slug ? S.indigoSoft : '#fff', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                <span className="row gap-8"><BookOpen size={15} color={subject === s.slug ? S.indigo : S.faint} /><span style={{ fontWeight: 800, color: subject === s.slug ? S.indigo : S.ink }}>{s.name}</span></span>
                <span className="tnum faint" style={{ fontWeight: 800, fontSize: 12 }}>{s.chapters}</span>
              </button>
            ))}
            {!subjects.data?.rows?.length && <div className="faint" style={{ padding: 12, fontSize: 13 }}>No subjects found.</div>}
          </div>
        )}
      </Card>

      <div>
        {!subject ? (
          <Card><div className="state"><span className="state-icon"><Layers size={28} color={S.faint} /></span><div className="state-title">Select a subject</div><div className="state-msg">Pick a subject on the left to browse its chapters and content coverage.</div></div></Card>
        ) : (
          <DataTable columns={chapterCols} rows={chapters.data?.rows || []} rowId={(r) => r.id}
            loading={chapters.loading} error={chapters.error} onRetry={chapters.reload}
            emptyIcon={Layers} emptyTitle="No chapters" emptyMessage="This subject has no chapters for the selected class." />
        )}
      </div>
    </div>
  )
}

// ─── Brain Gym bank: real draft/active/archived workflow ───────────────────────
const BG_TABS = [
  { key: '', label: 'All' }, { key: 'ACTIVE', label: 'Active' }, { key: 'DRAFT', label: 'Draft' },
  { key: 'ARCHIVED', label: 'Archived' }, { key: 'REJECTED', label: 'Rejected' },
]
function BrainGymBank() {
  const { can } = useAuth()
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 350)
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useApi<Paged<any>>('/content/braingym-questions', { status, search: debounced, page, pageSize: 15 })

  async function setQStatus(id: string, s: string) {
    try { await api(`/content/braingym-questions/${id}/status`, { method: 'PATCH', body: { status: s } }); toast(`Marked ${s.toLowerCase()}`, 'ok'); reload() }
    catch (e: any) { toast(e?.message || 'Failed', 'err') }
  }

  const cols: Column<any>[] = [
    { key: 'q', header: 'Question', render: (r) => <div style={{ maxWidth: 420 }}><div className="strong truncate">{r.questionText}</div><div className="faint" style={{ fontSize: 11.5 }}>{r.grade} · {r.category} · {r.difficulty}</div></div> },
    { key: 'answer', header: 'Answer', render: (r) => <span className="tnum">{r.answer}</span> },
    { key: 'quality', header: 'Quality', align: 'right', render: (r) => <span className="tnum">{Math.round((r.qualityScore || 0) * 100) / 100}</span> },
    { key: 'served', header: 'Served', align: 'right', render: (r) => <span className="tnum">{r.timesServed}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status.toLowerCase()}</Badge> },
    {
      key: 'actions', header: '', align: 'right', render: (r) => can('content.edit') ? (
        <div className="row gap-6" style={{ justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          {r.status !== 'ACTIVE' && <button className="btn btn-soft sm" title="Publish" onClick={() => setQStatus(r.id, 'ACTIVE')}><CircleCheck size={13} /></button>}
          {r.status !== 'DRAFT' && <button className="btn btn-ghost sm" title="Move to draft" onClick={() => setQStatus(r.id, 'DRAFT')}><PenLine size={13} /></button>}
          {r.status !== 'ARCHIVED' && <button className="btn btn-ghost sm" title="Archive" onClick={() => setQStatus(r.id, 'ARCHIVED')}><Archive size={13} /></button>}
        </div>
      ) : null,
    },
  ]

  return (
    <div className="col gap-12">
      <div className="row gap-12 wrap">
        <div className="tabs">
          {BG_TABS.map((t) => <button key={t.key} className={`tab ${status === t.key ? 'active' : ''}`} onClick={() => { setStatus(t.key); setPage(1) }}>{t.label}</button>)}
        </div>
        <div className="search grow" style={{ minWidth: 220, maxWidth: 340 }}>
          <Search size={16} />
          <input className="input" placeholder="Search questions…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>
      <DataTable columns={cols} rows={data?.rows || []} rowId={(r) => r.id} loading={loading} error={error} onRetry={reload}
        page={data?.page} totalPages={data?.totalPages} total={data?.total} onPage={setPage}
        emptyIcon={Dumbbell} emptyTitle="No questions" emptyMessage="No generated Brain Gym questions match this filter." />
    </div>
  )
}

// ─── Mock tests (read-only list) ───────────────────────────────────────────────
function MockTests() {
  const { data, loading, error, reload } = useApi<{ rows: any[] }>('/content/mock-tests')
  const cols: Column<any>[] = [
    { key: 'name', header: 'Mock test', render: (r) => <span className="strong">{r.name}</span> },
    { key: 'subject', header: 'Subject', render: (r) => <Badge tone="blue" dot={false}>{r.subject}</Badge> },
    { key: 'q', header: 'Questions', align: 'right', render: (r) => <span className="tnum">{r.questionCount}</span> },
    { key: 'dur', header: 'Duration', align: 'right', render: (r) => <span className="tnum">{r.durationMin ? `${r.durationMin} min` : '—'}</span> },
    { key: 'created', header: 'Added', render: (r) => timeAgo(r.createdAt) },
  ]
  return (
    <DataTable columns={cols} rows={data?.rows || []} rowId={(r) => String(r.id)} loading={loading} error={error} onRetry={reload}
      emptyIcon={ClipboardList} emptyTitle="No mock tests" emptyMessage="Mock tests are seeded via the backend import scripts." />
  )
}
