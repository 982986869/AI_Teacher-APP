'use client'

import { useState } from 'react'
import { Megaphone, Plus, Pin, Send, Archive, PenLine, Trash2, Search } from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { Card, Badge, EmptyState, ErrorState, Skel, SectionHead } from '@/components/ui'
import { Modal, ConfirmDialog } from '@/components/Modal'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api } from '@/lib/api'
import type { Announcement } from '@/lib/types'
import { S } from '@/lib/theme'
import { timeAgo, fmtDateTime } from '@/lib/format'

const AUDIENCES = ['all', 'students', 'parents', 'teachers', 'class']
const STATUS_TABS = [{ k: '', l: 'All' }, { k: 'draft', l: 'Draft' }, { k: 'published', l: 'Published' }, { k: 'archived', l: 'Archived' }]

const empty = { title: '', body: '', audience: 'all', classLevel: '', pinned: false }

export default function AnnouncementsPage() {
  const { can } = useAuth()
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 300)
  const { data, loading, error, reload } = useApi<{ rows: Announcement[] }>('/announcements', { status, search: debounced })
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<any>(empty)
  const [busy, setBusy] = useState(false)
  const [del, setDel] = useState<Announcement | null>(null)

  const editable = can('announcements.edit')

  function openCreate() { setForm(empty); setCreating(true); setEditing(null) }
  function openEdit(a: Announcement) { setEditing(a); setForm({ title: a.title, body: a.body, audience: a.audience, classLevel: a.classLevel || '', pinned: a.pinned }); }

  async function save(publish?: boolean) {
    if (!form.title.trim()) { toast('Title is required', 'err'); return }
    setBusy(true)
    try {
      const body = { ...form, classLevel: form.audience === 'class' ? form.classLevel : null }
      if (editing) await api(`/announcements/${editing.id}`, { method: 'PATCH', body })
      else await api('/announcements', { method: 'POST', body: { ...body, status: publish ? 'published' : 'draft' } })
      toast(editing ? 'Announcement updated' : publish ? 'Published' : 'Draft saved', 'ok')
      setCreating(false); setEditing(null); reload()
    } catch (e: any) { toast(e?.message || 'Failed', 'err') }
    finally { setBusy(false) }
  }

  async function transition(a: Announcement, s: string) {
    try { await api(`/announcements/${a.id}/transition`, { method: 'POST', body: { status: s } }); toast(`Announcement ${s}`, 'ok'); reload() }
    catch (e: any) { toast(e?.message || 'Failed', 'err') }
  }
  async function remove() {
    if (!del) return
    setBusy(true)
    try { await api(`/announcements/${del.id}`, { method: 'DELETE' }); toast('Deleted', 'ok'); setDel(null); reload() }
    catch (e: any) { toast(e?.message || 'Failed', 'err') } finally { setBusy(false) }
  }

  const modalOpen = creating || !!editing

  return (
    <div className="col gap-16">
      <div className="page-head">
        <div>
          <h1 className="h1">Announcements</h1>
          <div className="sub">Broadcast messages to students, parents and teachers — with draft, publish and archive control.</div>
        </div>
        {editable && <div className="actions"><button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New announcement</button></div>}
      </div>

      <div className="row gap-12 wrap">
        <div className="tabs">{STATUS_TABS.map((t) => <button key={t.k} className={`tab ${status === t.k ? 'active' : ''}`} onClick={() => setStatus(t.k)}>{t.l}</button>)}</div>
        <div className="search grow" style={{ minWidth: 220, maxWidth: 340 }}><Search size={16} /><input className="input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>

      {loading ? <div className="grid cols-2">{[0, 1, 2, 3].map((i) => <Skel key={i} h={130} r={20} />)}</div>
        : error ? <ErrorState message={error} onRetry={reload} />
        : !data?.rows?.length ? <Card><EmptyState icon={Megaphone} title="No announcements" message={editable ? 'Create your first announcement to broadcast it to the app.' : 'Announcements will appear here once created.'} action={editable ? <button className="btn btn-primary sm" onClick={openCreate}><Plus size={14} /> New announcement</button> : undefined} /></Card>
        : (
          <div className="grid cols-2">
            {data.rows.map((a) => (
              <Card key={a.id} className="col" style={{ gap: 10 }}>
                <div className="row between gap-8">
                  <div className="row gap-8" style={{ minWidth: 0 }}>
                    {a.pinned && <Pin size={15} color={S.gold} fill={S.gold} />}
                    <span className="h2 truncate">{a.title}</span>
                  </div>
                  <Badge>{a.status}</Badge>
                </div>
                <div className="muted" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.body || <span className="faint">No body</span>}</div>
                <div className="row gap-8 wrap" style={{ fontSize: 11.5 }}>
                  <Badge tone="blue" dot={false}>{a.audience === 'class' ? `Class ${a.classLevel}` : a.audience}</Badge>
                  <span className="faint" style={{ fontWeight: 700 }}>{a.createdByName || 'system'} · {timeAgo(a.updatedAt)}</span>
                </div>
                {editable && (
                  <div className="row gap-6 wrap" style={{ borderTop: '1px solid var(--hair)', paddingTop: 10 }}>
                    {a.status !== 'published' && <button className="btn btn-soft sm" onClick={() => transition(a, 'published')}><Send size={13} /> Publish</button>}
                    {a.status !== 'archived' && <button className="btn btn-ghost sm" onClick={() => transition(a, 'archived')}><Archive size={13} /> Archive</button>}
                    {a.status === 'archived' && <button className="btn btn-ghost sm" onClick={() => transition(a, 'draft')}><PenLine size={13} /> Unarchive</button>}
                    <button className="btn btn-ghost sm" onClick={() => openEdit(a)}><PenLine size={13} /> Edit</button>
                    <button className="btn btn-danger sm ml-auto" onClick={() => setDel(a)}><Trash2 size={13} /></button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

      {/* Editor */}
      <Modal open={modalOpen} onClose={() => { setCreating(false); setEditing(null) }} title={editing ? 'Edit announcement' : 'New announcement'} width={560}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setCreating(false); setEditing(null) }} disabled={busy}>Cancel</button>
            {editing ? <button className="btn btn-primary" onClick={() => save()} disabled={busy}>Save changes</button>
              : <><button className="btn btn-ghost" onClick={() => save(false)} disabled={busy}>Save draft</button><button className="btn btn-primary" onClick={() => save(true)} disabled={busy}><Send size={15} /> Publish</button></>}
          </>
        }>
        <div className="col gap-14">
          <div className="field"><label>Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. New mock tests available" autoFocus /></div>
          <div className="field"><label>Message</label><textarea className="textarea" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write the announcement…" /></div>
          <div className="row gap-12 wrap">
            <div className="field grow"><label>Audience</label>
              <select className="select" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>{AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}</select>
            </div>
            {form.audience === 'class' && <div className="field" style={{ width: 120 }}><label>Class</label><input className="input" value={form.classLevel} onChange={(e) => setForm({ ...form, classLevel: e.target.value })} placeholder="11" /></div>}
            <label className="row gap-8" style={{ alignItems: 'center', paddingTop: 22, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin to top
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={busy} danger confirmLabel="Delete"
        title="Delete announcement" message={<>Delete <b>{del?.title}</b>? This cannot be undone.</>} />
    </div>
  )
}
