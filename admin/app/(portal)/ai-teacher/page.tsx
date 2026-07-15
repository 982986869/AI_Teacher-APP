'use client'

import { useState, useEffect } from 'react'
import { Bot, FileText, CircleCheck, Loader2, TriangleAlert, Cpu, Search, Save } from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { DataTable, type Column } from '@/components/DataTable'
import { Card, SectionHead, StatCard, Badge, PendingBanner, Skel, IconChip } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api } from '@/lib/api'
import type { Paged } from '@/lib/types'
import { S } from '@/lib/theme'
import { fmtDate, timeAgo } from '@/lib/format'

export default function AiTeacherPage() {
  const { can } = useAuth()
  const toast = useToast()
  const ov = useApi<any>('/ai-teacher/overview')
  const d = ov.data
  const [tab, setTab] = useState<'lessons' | 'flagged'>('lessons')
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 350)
  const [page, setPage] = useState(1)
  const status = tab === 'flagged' ? 'FAILED' : ''
  const lessons = useApi<Paged<any>>('/ai-teacher/lessons', { status, search: debounced, page, pageSize: 12 })

  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  useEffect(() => { if (d?.config?.reviewNotes !== undefined) setNotes(d.config.reviewNotes || '') }, [d?.config?.reviewNotes])

  async function saveNotes() {
    setSavingNotes(true)
    try { await api('/ai-teacher/config', { method: 'PATCH', body: { value: { ...(d?.config || {}), reviewNotes: notes } } }); toast('Configuration saved', 'ok') }
    catch (e: any) { toast(e?.message || 'Failed', 'err') }
    finally { setSavingNotes(false) }
  }

  const cols: Column<any>[] = [
    { key: 'title', header: 'Lesson', render: (r) => <div style={{ maxWidth: 360 }}><div className="strong truncate">{r.title}</div><div className="faint" style={{ fontSize: 11.5 }} >{r.subject} · {r.grade}</div></div> },
    { key: 'slides', header: 'Slides', align: 'right', render: (r) => <span className="tnum">{r.slides}</span> },
    { key: 'model', header: 'Model', render: (r) => <span className="faint" style={{ fontSize: 12 }}>{r.model || '—'}</span> },
    { key: 'gen', header: 'Gen time', align: 'right', render: (r) => <span className="tnum">{r.genMs ? `${(r.genMs / 1000).toFixed(1)}s` : '—'}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status.toLowerCase()}</Badge> },
    { key: 'created', header: 'Created', render: (r) => <span className="nowrap" title={fmtDate(r.createdAt)}>{timeAgo(r.createdAt)}</span> },
  ]

  return (
    <div className="col gap-16">
      <div className="page-head">
        <div>
          <h1 className="h1">AI Teacher</h1>
          <div className="sub">Monitor lesson generation and configure the AI Teacher — this console never alters the live runtime flow.</div>
        </div>
      </div>

      <div className="grid cols-4">
        <StatCard icon={FileText} tone="indigo" label="Lessons generated" value={ov.loading ? null : d?.lessons?.total ?? 0} />
        <StatCard icon={CircleCheck} tone="emerald" label="Ready" value={ov.loading ? null : d?.lessons?.ready ?? 0} />
        <StatCard icon={Loader2} tone="gold" label="Generating" value={ov.loading ? null : d?.lessons?.generating ?? 0} />
        <StatCard icon={TriangleAlert} tone="red" label="Failed / flagged" value={ov.loading ? null : d?.lessons?.failed ?? 0} />
      </div>

      <div className="grid cols-2">
        {/* Runtime config (read-only) */}
        <Card>
          <SectionHead title="Runtime configuration" tone="cyan" right={<Badge tone="cyan" dot={false}>read-only</Badge>} />
          {ov.loading ? <Skel h={120} /> : (
            <div className="col gap-8">
              <ConfigRow label="Provider" value={d?.runtime?.provider} />
              <ConfigRow label="Lesson model" value={d?.runtime?.lessonModel || 'not set'} />
              <ConfigRow label="Doubt model" value={d?.runtime?.doubtModel || 'not set'} />
              <ConfigRow label="Knowledge model" value={d?.runtime?.knowledgeModel || 'not set'} />
              <ConfigRow label="Mock mode" value={d?.runtime?.mockMode ? 'on' : 'off'} />
              <ConfigRow label="Teacher voice (TTS)" value={d?.runtime?.ttsEnabled ? `${d?.runtime?.ttsModel}` : 'disabled'} />
              <div className="faint" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>Runtime models are set via server environment variables — change them there, not here, to keep generation safe.</div>
            </div>
          )}
        </Card>

        {/* Prompt inventory */}
        <Card>
          <SectionHead title="Prompt inventory" tone="purple" />
          {ov.loading ? <Skel h={120} /> : (
            <div className="col gap-8">
              {(d?.prompts || []).map((p: any) => (
                <div key={p.name} className="row between" style={{ padding: '9px 12px', background: S.canvas, borderRadius: 10 }}>
                  <span className="row gap-8"><FileText size={14} color={S.purple} /><span style={{ fontWeight: 800, fontSize: 13 }}>{p.name}</span></span>
                  <span className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>{(p.bytes / 1024).toFixed(1)} KB · {timeAgo(p.updatedAt)}</span>
                </div>
              ))}
              {!d?.prompts?.length && <div className="faint" style={{ fontSize: 13 }}>No prompt files found.</div>}
            </div>
          )}
        </Card>
      </div>

      {/* Pending capabilities — honest */}
      {d?.pending && (
        <div className="grid cols-3">
          <PendingBanner title="Prompt versioning" message={d.pending.promptVersioning} />
          <PendingBanner title="Lesson templates" message={d.pending.lessonTemplates} />
          <PendingBanner title="Topic generation" message={d.pending.topicGeneration} />
        </div>
      )}

      {/* Review notes (non-runtime config) */}
      {can('aiteacher.edit') && (
        <Card>
          <SectionHead title="Quality review notes" tone="gold" right={<button className="btn btn-soft sm" onClick={saveNotes} disabled={savingNotes}><Save size={13} /> {savingNotes ? 'Saving…' : 'Save'}</button>} />
          <textarea className="textarea" placeholder="Notes for the content team on lesson quality, recurring issues, prompts to revisit…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Card>
      )}

      {/* Lessons quality review */}
      <div className="col gap-12">
        <div className="row gap-12 wrap">
          <div className="tabs">
            <button className={`tab ${tab === 'lessons' ? 'active' : ''}`} onClick={() => { setTab('lessons'); setPage(1) }}>All lessons</button>
            <button className={`tab ${tab === 'flagged' ? 'active' : ''}`} onClick={() => { setTab('flagged'); setPage(1) }}>Flagged (failed)<span className="n">{d?.lessons?.failed ?? 0}</span></button>
          </div>
          <div className="search grow" style={{ minWidth: 220, maxWidth: 340 }}>
            <Search size={16} />
            <input className="input" placeholder="Search lessons…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>
        <DataTable columns={cols} rows={lessons.data?.rows || []} rowId={(r) => r.id} loading={lessons.loading} error={lessons.error} onRetry={lessons.reload}
          page={lessons.data?.page} totalPages={lessons.data?.totalPages} total={lessons.data?.total} onPage={setPage}
          emptyIcon={Bot} emptyTitle="No lessons" emptyMessage="Generated lessons will appear here for quality review." />
      </div>
    </div>
  )
}

function ConfigRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="row between" style={{ padding: '8px 12px', background: S.canvas, borderRadius: 10 }}>
      <span className="faint" style={{ fontWeight: 700, fontSize: 12.5 }}>{label}</span>
      <span style={{ fontWeight: 800, fontSize: 13 }}>{String(value)}</span>
    </div>
  )
}
