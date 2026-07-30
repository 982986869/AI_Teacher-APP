'use client'

import { useState } from 'react'
import {
  Video, Plus, PenLine, Trash2, Search, CheckCircle2, XCircle, Archive, RotateCcw,
  CirclePlay, MapPin, ExternalLink,
} from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { Card, Badge, EmptyState, ErrorState, Skel } from '@/components/ui'
import { Modal, ConfirmDialog } from '@/components/Modal'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api } from '@/lib/api'
import type { Session } from '@/lib/types'
import { S } from '@/lib/theme'
import { fmtDateTime, timeAgo } from '@/lib/format'

const STATUS_TABS = [
  { k: '', l: 'All' }, { k: 'scheduled', l: 'Scheduled' }, { k: 'completed', l: 'Completed' },
  { k: 'cancelled', l: 'Cancelled' }, { k: 'archived', l: 'Archived' },
]

const empty = {
  title: '', subject: '', chapter: '', teacherName: '', classLevel: '', startsAt: '',
  durationMin: '60', mode: 'online', meetingLink: '', location: '', recordingUrl: '', capacity: '', description: '',
}

// ISO → the value a <input type="datetime-local"> expects (local wall-clock).
function toLocalInput(iso: string) {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function SessionsPage() {
  const { can } = useAuth()
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 300)
  const { data, loading, error, reload } = useApi<{ rows: Session[] }>('/sessions', { status, subject: debounced })
  const [editing, setEditing] = useState<Session | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<any>(empty)
  const [busy, setBusy] = useState(false)
  const [del, setDel] = useState<Session | null>(null)

  const editable = can('content.edit')

  function openCreate() { setForm(empty); setCreating(true); setEditing(null) }
  function openEdit(s: Session) {
    setEditing(s); setCreating(false)
    setForm({
      title: s.title, subject: s.subject || '', chapter: s.chapter || '', teacherName: s.teacherName || '',
      classLevel: s.classLevel == null ? '' : String(s.classLevel), startsAt: s.startsAt ? toLocalInput(s.startsAt) : '',
      durationMin: String(s.durationMin ?? 60), mode: s.mode || 'online', meetingLink: s.meetingLink || '',
      location: s.location || '', recordingUrl: s.recordingUrl || '', capacity: s.capacity == null ? '' : String(s.capacity),
      description: s.description || '',
    })
  }

  async function save() {
    if (!form.title.trim()) { toast('A session title is required', 'err'); return }
    if (!form.startsAt) { toast('A start date & time is required', 'err'); return }
    setBusy(true)
    try {
      const body: any = {
        title: form.title.trim(), subject: form.subject, chapter: form.chapter, teacherName: form.teacherName,
        classLevel: form.classLevel === '' ? null : Number(form.classLevel),
        startsAt: new Date(form.startsAt).toISOString(),
        durationMin: form.durationMin === '' ? 60 : Number(form.durationMin),
        mode: form.mode,
        meetingLink: form.mode === 'online' ? (form.meetingLink || null) : null,
        location: form.mode === 'offline' ? (form.location || null) : null,
        recordingUrl: form.recordingUrl.trim() || null,
        capacity: form.capacity === '' ? null : Number(form.capacity),
        description: form.description,
      }
      if (editing) await api(`/sessions/${editing.id}`, { method: 'PATCH', body })
      else await api('/sessions', { method: 'POST', body })
      toast(editing ? 'Session updated' : 'Session created', 'ok')
      setCreating(false); setEditing(null); reload()
    } catch (e: any) { toast(e?.message || 'Failed', 'err') }
    finally { setBusy(false) }
  }

  async function transition(s: Session, st: string) {
    try { await api(`/sessions/${s.id}/status`, { method: 'POST', body: { status: st } }); toast(`Session ${st}`, 'ok'); reload() }
    catch (e: any) { toast(e?.message || 'Failed', 'err') }
  }
  async function remove() {
    if (!del) return
    setBusy(true)
    try { await api(`/sessions/${del.id}`, { method: 'DELETE' }); toast('Session deleted', 'ok'); setDel(null); reload() }
    catch (e: any) { toast(e?.message || 'Failed', 'err') } finally { setBusy(false) }
  }

  const modalOpen = creating || !!editing

  return (
    <div className="col gap-16">
      <div className="page-head">
        <div>
          <h1 className="h1">Sessions</h1>
          <div className="sub">Publish live classes and attach recordings — students see them in the app's Sessions tab, and any session with a recording appears under Recordings.</div>
        </div>
        {editable && <div className="actions"><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New session</button></div>}
      </div>

      <div className="row gap-12 wrap">
        <div className="tabs">{STATUS_TABS.map((t) => <button key={t.k} className={`tab ${status === t.k ? 'active' : ''}`} onClick={() => setStatus(t.k)}>{t.l}</button>)}</div>
        <div className="search grow" style={{ minWidth: 220, maxWidth: 340 }}><Search size={16} /><input className="input" placeholder="Search subject…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="grid cols-2">{[0, 1, 2, 3].map((i) => <Skel key={i} h={150} r={20} />)}</div>
        : error ? <ErrorState message={error} onRetry={reload} />
        : !data?.rows?.length ? <Card><EmptyState icon={Video} title="No sessions" message={editable ? 'Create your first session. Add a recording link to make it a recorded lecture students can replay.' : 'Sessions will appear here once created.'} action={editable ? <button className="btn btn-primary sm" onClick={openCreate}><Plus size={14} /> New session</button> : undefined} /></Card>
        : (
          <div className="grid cols-2">
            {data.rows.map((s) => (
              <Card key={s.id} className="col" style={{ gap: 10 }}>
                <div className="row between gap-8">
                  <div className="row gap-8" style={{ minWidth: 0 }}>
                    {s.mode === 'offline' ? <MapPin size={15} color={S.orange} /> : <Video size={15} color={S.blue} />}
                    <span className="h2 truncate">{s.title}</span>
                  </div>
                  <Badge>{s.status}</Badge>
                </div>

                <div className="muted" style={{ fontSize: 13, fontWeight: 600 }}>
                  {[s.subject, s.teacherName].filter(Boolean).join(' · ') || 'Live class'}
                </div>

                <div className="row gap-8 wrap" style={{ fontSize: 11.5 }}>
                  <Badge tone="blue" dot={false}>{s.classLevel == null ? 'All classes' : `Class ${s.classLevel}`}</Badge>
                  <Badge tone="indigo" dot={false}>{fmtDateTime(s.startsAt)}</Badge>
                  <Badge tone="indigo" dot={false}>{s.durationMin} min</Badge>
                  {s.recordingUrl
                    ? <a href={s.recordingUrl} target="_blank" rel="noreferrer" className="row gap-4" style={{ textDecoration: 'none' }}><Badge tone="purple" dot={false}><span className="row gap-4"><CirclePlay size={11} /> Recording <ExternalLink size={10} /></span></Badge></a>
                    : <Badge tone="gold" dot={false}>No recording</Badge>}
                </div>

                {editable && (
                  <div className="row gap-6 wrap" style={{ borderTop: '1px solid var(--hair)', paddingTop: 10 }}>
                    {s.status !== 'completed' && <button className="btn btn-soft sm" onClick={() => transition(s, 'completed')}><CheckCircle2 size={13} /> Completed</button>}
                    {s.status === 'scheduled' && <button className="btn btn-ghost sm" onClick={() => transition(s, 'cancelled')}><XCircle size={13} /> Cancel</button>}
                    {s.status !== 'archived' && <button className="btn btn-ghost sm" onClick={() => transition(s, 'archived')}><Archive size={13} /> Archive</button>}
                    {(s.status === 'archived' || s.status === 'cancelled') && <button className="btn btn-ghost sm" onClick={() => transition(s, 'scheduled')}><RotateCcw size={13} /> Restore</button>}
                    <button className="btn btn-ghost sm" onClick={() => openEdit(s)}><PenLine size={13} /> Edit</button>
                    <button className="btn btn-danger sm ml-auto" onClick={() => setDel(s)}><Trash2 size={13} /></button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

      {/* Editor */}
      <Modal open={modalOpen} onClose={() => { setCreating(false); setEditing(null) }} title={editing ? 'Edit session' : 'New session'} width={620}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setCreating(false); setEditing(null) }} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>{editing ? 'Save changes' : 'Create session'}</button>
          </>
        }>
        <div className="col gap-14">
          <div className="field"><label>Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Kinematics — Motion in a Straight Line" autoFocus /></div>

          <div className="row gap-12 wrap">
            <div className="field grow"><label>Subject</label><input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Physics" /></div>
            <div className="field grow"><label>Teacher</label><input className="input" value={form.teacherName} onChange={(e) => setForm({ ...form, teacherName: e.target.value })} placeholder="Arjun Sir" /></div>
          </div>

          <div className="row gap-12 wrap">
            <div className="field grow"><label>Chapter</label><input className="input" value={form.chapter} onChange={(e) => setForm({ ...form, chapter: e.target.value })} placeholder="Kinematics" /></div>
            <div className="field" style={{ width: 130 }}><label>Class</label><input className="input" value={form.classLevel} onChange={(e) => setForm({ ...form, classLevel: e.target.value })} placeholder="All" /></div>
          </div>

          <div className="row gap-12 wrap">
            <div className="field grow"><label>Starts at</label><input className="input" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
            <div className="field" style={{ width: 130 }}><label>Duration (min)</label><input className="input" type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} placeholder="60" /></div>
          </div>

          <div className="row gap-12 wrap">
            <div className="field" style={{ width: 150 }}><label>Mode</label>
              <select className="select" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option value="online">Online</option><option value="offline">Offline</option></select>
            </div>
            {form.mode === 'online'
              ? <div className="field grow"><label>Meeting link</label><input className="input" value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet.google.com/…" /></div>
              : <div className="field grow"><label>Location</label><input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Centre / room" /></div>}
            <div className="field" style={{ width: 120 }}><label>Capacity</label><input className="input" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="—" /></div>
          </div>

          {/* Recording — the recorded-lecture link students replay. */}
          <div className="field">
            <label><span className="row gap-6" style={{ alignItems: 'center' }}><CirclePlay size={14} color={S.purple} /> Recording link</span></label>
            <input className="input" value={form.recordingUrl} onChange={(e) => setForm({ ...form, recordingUrl: e.target.value })} placeholder="https://… (video URL — leave empty if not recorded yet)" />
            <div className="faint" style={{ fontSize: 11.5, fontWeight: 600, marginTop: 4 }}>Add a link to make this a recorded lecture in the app's Recordings section. Clear it to remove the recording.</div>
          </div>

          <div className="field"><label>Description</label><textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this session covers…" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={busy} danger confirmLabel="Delete"
        title="Delete session" message={<>Delete <b>{del?.title}</b>? This removes it (and its recording) from the app. This cannot be undone.</>} />
    </div>
  )
}
