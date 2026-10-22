'use client'

/**
 * Announcements — broadcast to students, parents and teachers.
 *
 * Rows rather than cards: an announcement is read as a line in a list (who is it
 * for, has it gone out, when), and a grid of boxes made every one look equally
 * urgent. The status pill and audience chip carry the two facts that decide
 * whether anything needs doing.
 */

import { useState } from 'react'
import {
  Megaphone, Plus, Pin, Send, Archive, PenLine, Trash2, Search, FileText,
  CalendarDays, User, MoreVertical, SlidersHorizontal, Users as UsersIcon, Check,
} from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { Card, EmptyState, ErrorState, Skel } from '@/components/ui'
import { Modal, ConfirmDialog } from '@/components/Modal'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api } from '@/lib/api'
import type { Announcement } from '@/lib/types'
import { fmtDate } from '@/lib/format'

const AUDIENCES = ['all', 'students', 'parents', 'teachers', 'class']
const STATUS_TABS = [{ k: '', l: 'All' }, { k: 'draft', l: 'Draft' }, { k: 'published', l: 'Published' }, { k: 'archived', l: 'Archived' }]

const empty = { title: '', body: '', audience: 'all', classLevel: '', pinned: false }

/** Status decides the row's icon and tint — a published notice should not look
 *  like a draft at a glance, and colour alone never says which is which. */
const LOOK: Record<string, { tint: string; icon: typeof Megaphone; label: string }> = {
  published: { tint: '#12A06A', icon: Megaphone, label: 'Published' },
  draft: { tint: '#2a78d6', icon: FileText, label: 'Draft' },
  archived: { tint: '#E8833A', icon: Archive, label: 'Archived' },
}

const audienceLabel = (a: Announcement) =>
  a.audience === 'class' ? `Class ${a.classLevel}`
    : a.audience === 'all' ? 'All'
    : a.audience.charAt(0).toUpperCase() + a.audience.slice(1)

const audienceReach = (a: Announcement) =>
  a.audience === 'all' ? 'Students, Parents, Teachers'
    : a.audience === 'class' ? `Class ${a.classLevel} students`
    : a.audience.charAt(0).toUpperCase() + a.audience.slice(1)

export default function AnnouncementsPage() {
  const { can } = useAuth()
  const toast = useToast()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [pinnedOnly, setPinnedOnly] = useState(false)
  const debounced = useDebounced(search, 300)
  const { data, loading, error, reload } = useApi<{ rows: Announcement[] }>('/announcements', { status, search: debounced })
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<any>(empty)
  const [busy, setBusy] = useState(false)
  const [del, setDel] = useState<Announcement | null>(null)
  const [menu, setMenu] = useState<string | null>(null)

  const editable = can('announcements.edit')
  const rows = (data?.rows || []).filter((a) => !pinnedOnly || a.pinned)

  function openCreate() { setForm(empty); setCreating(true); setEditing(null) }
  function openEdit(a: Announcement) {
    setEditing(a)
    setForm({ title: a.title, body: a.body, audience: a.audience, classLevel: a.classLevel || '', pinned: a.pinned })
  }

  async function save(publish?: boolean) {
    if (!form.title.trim()) { toast('Title is required', 'err'); return }
    setBusy(true)
    try {
      const body = { ...form, classLevel: form.audience === 'class' ? form.classLevel : null }
      if (editing) await api(`/announcements/${editing.id}`, { method: 'PATCH', body })
      else await api('/announcements', { method: 'POST', body: { ...body, status: publish ? 'published' : 'draft' } })
      toast(editing ? 'Announcement updated' : publish ? 'Published' : 'Draft saved', 'ok')
      setCreating(false); setEditing(null); reload()
    } catch (e: any) { toast(e?.message || 'Failed', 'err') } finally { setBusy(false) }
  }

  async function transition(a: Announcement, s: string) {
    setMenu(null)
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
      <div className="an-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="ann-title">Announcements</h1>
          <div className="sub">Broadcast messages to students, parents and teachers — with draft, publish and archive control.</div>
        </div>
        {editable && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> New Announcement
          </button>
        )}
      </div>

      <div className="ann-layout">
        <div className="col gap-14" style={{ minWidth: 0 }}>
          {/* ── filter bar ───────────────────────────────────────────────── */}
          <div className="ann-bar">
            <div className="ann-seg">
              {STATUS_TABS.map((t) => (
                <button key={t.k} className={'ann-seg-btn' + (status === t.k ? ' on' : '')} onClick={() => setStatus(t.k)}>
                  {t.l}
                </button>
              ))}
            </div>
            <div className="ann-search">
              <Search size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements..." aria-label="Search announcements" />
            </div>
            <button
              className={'ann-icon-btn' + (pinnedOnly ? ' on' : '')}
              onClick={() => setPinnedOnly((p) => !p)}
              title={pinnedOnly ? 'Showing pinned only' : 'Show pinned only'}
              aria-pressed={pinnedOnly}
            >
              <SlidersHorizontal size={16} />
            </button>
          </div>

          {/* ── list ─────────────────────────────────────────────────────── */}
          {loading && !data ? (
            <div className="col gap-12">{[0, 1, 2, 3].map((i) => <Skel key={i} h={112} r={16} />)}</div>
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : !rows.length ? (
            <Card>
              <EmptyState
                icon={Megaphone}
                title={pinnedOnly ? 'Nothing pinned' : search ? 'No matches' : 'No announcements'}
                message={pinnedOnly ? 'Pin an announcement to keep it at the top.'
                  : search ? 'Try a different search term.'
                  : editable ? 'Create your first announcement to broadcast it to the app.'
                  : 'Announcements will appear here once created.'}
                action={editable && !search && !pinnedOnly
                  ? <button className="btn btn-primary sm" onClick={openCreate}><Plus size={14} /> New Announcement</button>
                  : undefined}
              />
            </Card>
          ) : (
            <div className="col gap-12">
              {rows.map((a, i) => {
                const look = LOOK[a.status] || LOOK.draft
                const Icon = look.icon
                return (
                  <div key={a.id} className="ann-row" style={{ animationDelay: Math.min(i, 8) * 45 + 'ms' }}>
                    <span className="ann-row-ic" style={{ background: look.tint + '1a', color: look.tint }}>
                      <Icon size={20} strokeWidth={2.1} />
                    </span>

                    <div className="ann-row-main">
                      <div className="row gap-8" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        {a.pinned && <Pin size={13} className="ann-pin" />}
                        <span className="ann-row-title">{a.title}</span>
                      </div>
                      <div className="ann-row-body">{a.body || <span className="faint">No message</span>}</div>
                      <div className="row gap-10" style={{ alignItems: 'center', flexWrap: 'wrap', marginTop: 9 }}>
                        <span className="ann-aud">{audienceLabel(a)}</span>
                        <span className="ann-meta"><UsersIcon size={13} /> {audienceReach(a)}</span>
                      </div>
                    </div>

                    <div className="ann-row-side">
                      <span className={'ann-pill ' + a.status}><i /> {look.label}</span>
                      <span className="ann-meta"><CalendarDays size={13} /> {fmtDate(a.publishedAt || a.createdAt)}</span>
                      <span className="ann-meta"><User size={13} /> {a.createdByName || 'system'}</span>
                    </div>

                    {editable && (
                      <div className="ann-kebab-wrap">
                        <button className="ann-icon-btn sm" aria-label="Actions" aria-expanded={menu === a.id}
                          onClick={() => setMenu(menu === a.id ? null : a.id)}>
                          <MoreVertical size={16} />
                        </button>
                        {menu === a.id && (
                          <>
                            <div className="ann-menu-scrim" onClick={() => setMenu(null)} />
                            <div className="ann-menu" role="menu">
                              <button onClick={() => { setMenu(null); openEdit(a) }}><PenLine size={14} /> Edit</button>
                              {a.status !== 'published' && <button onClick={() => transition(a, 'published')}><Send size={14} /> Publish</button>}
                              {a.status !== 'archived' && <button onClick={() => transition(a, 'archived')}><Archive size={14} /> Archive</button>}
                              {a.status === 'archived' && <button onClick={() => transition(a, 'draft')}><PenLine size={14} /> Back to draft</button>}
                              <button className="danger" onClick={() => { setMenu(null); setDel(a) }}><Trash2 size={14} /> Delete</button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── sidebar ──────────────────────────────────────────────────────── */}
        {editable && (
          <aside className="ann-aside">
            <div className="ann-aside-art" aria-hidden="true">
              <Megaphone size={64} strokeWidth={1.6} />
              <span className="ann-spark s1" /><span className="ann-spark s2" /><span className="ann-spark s3" />
            </div>
            <h2 className="ann-aside-title">Stay Connected</h2>
            <p className="ann-aside-sub">
              Share important updates, announcements and news with your students, parents and teachers.
            </p>
            <button className="btn btn-primary" onClick={openCreate} style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={16} /> New Announcement
            </button>

            {!!data?.rows?.length && (
              <div className="ann-counts">
                {(['published', 'draft', 'archived'] as const).map((k) => {
                  const n = data.rows.filter((r) => r.status === k).length
                  return (
                    <div key={k} className="ann-count">
                      <span className="tnum">{n}</span>
                      <span>{LOOK[k].label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── editor ───────────────────────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => { setCreating(false); setEditing(null) }}
        title={editing ? 'Edit announcement' : 'New announcement'} width={580}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setCreating(false); setEditing(null) }} disabled={busy}>Cancel</button>
            {editing
              ? <button className="btn btn-primary" onClick={() => save()} disabled={busy}><Check size={15} /> Save changes</button>
              : <>
                  <button className="btn btn-ghost" onClick={() => save(false)} disabled={busy}>Save draft</button>
                  <button className="btn btn-primary" onClick={() => save(true)} disabled={busy}><Send size={15} /> Publish</button>
                </>}
          </>
        }>
        <div className="col gap-14">
          <div className="field">
            <label>Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. New mock tests available" autoFocus />
          </div>
          <div className="field">
            <label>Message</label>
            <textarea className="textarea" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write the announcement…" />
          </div>
          <div className="row gap-12 wrap">
            <div className="field grow">
              <label>Audience</label>
              <select className="select" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            {form.audience === 'class' && (
              <div className="field" style={{ width: 120 }}>
                <label>Class</label>
                <input className="input" value={form.classLevel} onChange={(e) => setForm({ ...form, classLevel: e.target.value })} placeholder="11" />
              </div>
            )}
            <label className="row gap-8" style={{ alignItems: 'center', paddingTop: 22, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm({ ...form, pinned: e.target.checked })} /> Pin to top
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove} busy={busy} danger confirmLabel="Delete"
        title="Delete announcement" message={<>Delete <b>{del?.title}</b>? This cannot be undone.</>} />

      <style jsx global>{`
        @keyframes ann-rise { from { opacity: 0; transform: translateY(10px); } }
        @keyframes ann-menu { from { opacity: 0; transform: translateY(-5px) scale(.97); } }
        @keyframes ann-float { 0%,100% { transform: translateY(0) rotate(-8deg); } 50% { transform: translateY(-7px) rotate(-8deg); } }
        @keyframes ann-twinkle { 0%,100% { opacity: .25; transform: scale(.8); } 50% { opacity: 1; transform: scale(1); } }

        .ann-title { font-size: 30px; font-weight: 900; letter-spacing: -.03em; line-height: 1.1; }
        .ann-layout { display: grid; grid-template-columns: 1fr 340px; gap: 18px; align-items: start; }
        @media (max-width: 1100px) { .ann-layout { grid-template-columns: 1fr; } }

        .ann-bar {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          padding: 12px 14px; border-radius: 15px; border: 1px solid var(--line); background: var(--card);
        }
        .ann-seg { display: flex; gap: 3px; padding: 3px; border-radius: 11px; background: var(--surface-2); }
        .ann-seg-btn {
          padding: 7px 17px; border: 0; border-radius: 9px; background: transparent; cursor: pointer;
          font-size: 13px; font-weight: 650; color: var(--muted); transition: background .2s, color .2s;
        }
        .ann-seg-btn:hover { color: var(--ink); }
        .ann-seg-btn.on { background: var(--accent); color: #fff; }

        .ann-search {
          display: flex; align-items: center; gap: 9px; flex: 1 1 200px; min-width: 180px;
          padding: 8px 13px; border-radius: 11px; border: 1px solid var(--line); background: var(--card);
          color: var(--faint); transition: border-color .2s;
        }
        .ann-search:focus-within { border-color: var(--accent); }
        .ann-search input { border: 0; outline: 0; background: transparent; flex: 1; font-size: 13px; color: var(--ink); }

        .ann-icon-btn {
          width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; flex: 0 0 auto;
          border: 1px solid var(--line); background: var(--card); color: var(--muted); cursor: pointer;
          transition: background .18s, color .18s, border-color .18s;
        }
        .ann-icon-btn:hover { border-color: var(--accent); color: var(--ink); }
        .ann-icon-btn.on { background: var(--accent); border-color: var(--accent); color: #fff; }
        .ann-icon-btn.sm { width: 32px; height: 32px; border-radius: 9px; }

        /* ── rows ──────────────────────────────────────────────────────── */
        .ann-row {
          display: flex; align-items: flex-start; gap: 16px; padding: 18px;
          border: 1px solid var(--line); border-radius: 16px; background: var(--card);
          animation: ann-rise .34s cubic-bezier(.22,1,.36,1) both;
          transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s, border-color .22s;
        }
        .ann-row:hover { transform: translateY(-2px); box-shadow: var(--shadow-sm); border-color: var(--accent); }
        .ann-row-ic { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; }
        .ann-row-main { min-width: 0; flex: 1 1 260px; }
        .ann-row-title { font-size: 15px; font-weight: 750; color: var(--ink); }
        .ann-pin { color: #eda100; fill: #eda100; flex: 0 0 auto; }
        .ann-row-body {
          font-size: 13px; color: var(--muted); line-height: 1.55; margin-top: 4px;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .ann-aud {
          padding: 3px 11px; border-radius: 99px; font-size: 11.5px; font-weight: 700;
          background: rgba(79,109,245,.1); color: var(--accent-ink);
        }
        .ann-meta { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); white-space: nowrap; }
        .ann-row-side { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex: 0 0 auto; }

        .ann-pill {
          display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 99px;
          font-size: 11.5px; font-weight: 700;
        }
        .ann-pill > i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .ann-pill.published { background: rgba(18,160,106,.12); color: #0E8A5B; }
        .ann-pill.draft     { background: var(--surface-2); color: var(--muted); }
        .ann-pill.archived  { background: rgba(232,131,58,.12); color: #B45309; }

        .ann-kebab-wrap { position: relative; flex: 0 0 auto; }
        .ann-menu-scrim { position: fixed; inset: 0; z-index: 20; }
        .ann-menu {
          position: absolute; right: 0; top: calc(100% + 6px); z-index: 21; min-width: 182px;
          background: var(--card); border: 1px solid var(--line); border-radius: 11px;
          box-shadow: var(--shadow-lg); padding: 5px; display: flex; flex-direction: column;
          animation: ann-menu .16s cubic-bezier(.22,1,.36,1) both;
        }
        .ann-menu button {
          display: flex; align-items: center; gap: 9px; padding: 8px 10px; border: 0; border-radius: 8px;
          background: transparent; cursor: pointer; font-size: 13px; text-align: left; color: var(--ink);
        }
        .ann-menu button:hover { background: var(--surface-2); }
        .ann-menu button.danger { color: #DC2626; }

        /* ── sidebar ───────────────────────────────────────────────────── */
        .ann-aside {
          position: sticky; top: 18px;
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px;
          padding: 30px 24px; border-radius: 18px; border: 1px solid var(--line);
          background: linear-gradient(170deg, rgba(79,109,245,.07), transparent 60%), var(--card);
        }
        .ann-aside-art {
          position: relative; width: 112px; height: 112px; border-radius: 50%;
          display: grid; place-items: center; color: var(--accent);
          background: radial-gradient(circle at 50% 50%, rgba(79,109,245,.16), transparent 70%);
          margin-bottom: 4px;
        }
        .ann-aside-art > svg { animation: ann-float 4.5s ease-in-out infinite; }
        .ann-spark { position: absolute; border-radius: 50%; background: var(--accent); }
        .ann-spark.s1 { width: 7px; height: 7px; top: 12px; right: 16px; animation: ann-twinkle 2.6s ease-in-out infinite; }
        .ann-spark.s2 { width: 5px; height: 5px; top: 34px; right: 4px; animation: ann-twinkle 2.6s ease-in-out .5s infinite; }
        .ann-spark.s3 { width: 4px; height: 4px; bottom: 22px; left: 10px; animation: ann-twinkle 2.6s ease-in-out 1s infinite; }
        .ann-aside-title { font-size: 22px; font-weight: 850; letter-spacing: -.02em; }
        .ann-aside-sub { font-size: 13.5px; color: var(--muted); line-height: 1.6; margin: 0 0 4px; }

        .ann-counts { display: flex; gap: 8px; width: 100%; margin-top: 4px; }
        .ann-count {
          flex: 1; display: flex; flex-direction: column; gap: 1px; padding: 9px 6px;
          border-radius: 11px; background: var(--surface-2);
        }
        .ann-count > span:first-child { font-size: 17px; font-weight: 900; color: var(--ink); }
        .ann-count > span:last-child { font-size: 10.5px; font-weight: 650; color: var(--muted); }

        @media (max-width: 760px) {
          .ann-row { flex-wrap: wrap; }
          .ann-row-side { align-items: flex-start; flex-direction: row; flex-wrap: wrap; width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ann-row, .ann-menu { animation: none !important; }
          .ann-row:hover { transform: none; }
          .ann-aside-art > svg, .ann-spark { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
