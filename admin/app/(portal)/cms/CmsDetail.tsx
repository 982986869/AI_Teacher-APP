'use client'

import { useState } from 'react'
import { Save, Send, CheckCircle2, Archive, XCircle, Undo2, Trash2, History, ChevronRight, FolderOpen } from 'lucide-react'
import { useApi } from '@/components/useApi'
import { Drawer, ConfirmDialog } from '@/components/Modal'
import { Badge, Skel, ErrorState } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api, ApiError } from '@/lib/api'
import type { CmsNode, CmsVersion, CmsStatus } from '@/lib/types'
import { fmtDateTime, timeAgo } from '@/lib/format'

interface DetailData { node: CmsNode; breadcrumb: { id: string; name: string; level: string }[]; childCount: number }

const TRANSITIONS: { to: CmsStatus; label: string; icon: any; tone: string; needsPublish?: boolean }[] = [
  { to: 'review', label: 'Send to review', icon: Send, tone: 'btn-soft' },
  { to: 'published', label: 'Publish', icon: CheckCircle2, tone: 'btn-primary', needsPublish: true },
  { to: 'archived', label: 'Archive', icon: Archive, tone: 'btn-ghost' },
  { to: 'rejected', label: 'Reject', icon: XCircle, tone: 'btn-ghost' },
  { to: 'draft', label: 'Back to draft', icon: Undo2, tone: 'btn-ghost' },
]

export function CmsDetail({ id, onClose, onChanged, onDrill }: { id: string; onClose: () => void; onChanged: () => void; onDrill: (n: CmsNode) => void }) {
  const { can } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useApi<DetailData>(`/cms/nodes/${id}`)
  const versions = useApi<{ rows: CmsVersion[] }>(`/cms/nodes/${id}/versions`)
  const [edit, setEdit] = useState<Partial<CmsNode> | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [showVersions, setShowVersions] = useState(false)

  const editable = can('content.edit')
  const n = data?.node
  const form = { ...(n || {}), ...(edit || {}) } as CmsNode
  const dirty = edit !== null && n && (['name', 'description', 'difficulty', 'visibility', 'estimatedDuration'].some((k) => (edit as any)[k] !== undefined && (edit as any)[k] !== (n as any)[k]) || (edit.tags && edit.tags.join(',') !== n.tags.join(',')))

  if (loading) return <Drawer open onClose={onClose} title="Content details"><div className="col gap-12">{[0, 1, 2, 3].map((i) => <Skel key={i} h={i === 0 ? 60 : 40} />)}</div></Drawer>
  if (error || !n) return <Drawer open onClose={onClose} title="Content details"><ErrorState message={error || 'Not found'} onRetry={reload} /></Drawer>

  const set = (patch: Partial<CmsNode>) => setEdit((e) => ({ ...(e || {}), ...patch }))

  async function save() {
    setBusy(true)
    try {
      await api(`/cms/nodes/${id}`, { method: 'PATCH', body: {
        name: form.name, description: form.description, difficulty: form.difficulty || null,
        visibility: form.visibility, estimatedDuration: form.estimatedDuration, tags: form.tags,
        expectedLockVersion: n!.lockVersion,
      } })
      setEdit(null); reload(); onChanged(); toast('Saved', 'ok')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) { toast('Changed elsewhere — reloading', 'err'); reload() }
      else toast((e as ApiError)?.message || 'Save failed', 'err')
    } finally { setBusy(false) }
  }

  async function transition(to: CmsStatus) {
    setBusy(true)
    try {
      await api(`/cms/nodes/${id}/status`, { method: 'POST', body: { status: to } })
      reload(); versions.reload(); onChanged(); toast(`Moved to ${to}`, 'ok')
    } catch (e) { toast((e as ApiError)?.message || 'Failed', 'err') } finally { setBusy(false) }
  }

  async function restore(v: number) {
    setBusy(true)
    try { await api(`/cms/nodes/${id}/versions/${v}/restore`, { method: 'POST' }); reload(); onChanged(); toast(`Restored v${v} as draft`, 'ok') }
    catch (e) { toast((e as ApiError)?.message || 'Restore failed', 'err') } finally { setBusy(false) }
  }

  async function doDelete(cascade: boolean) {
    setBusy(true)
    try {
      await api(`/cms/nodes/${id}${cascade ? '?cascade=true' : ''}`, { method: 'DELETE' })
      toast('Deleted', 'ok'); onChanged(); onClose()
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) { setConfirmDel(true); return } // has children → confirm cascade
      toast((e as ApiError)?.message || 'Delete failed', 'err')
    } finally { setBusy(false) }
  }

  return (
    <Drawer open onClose={onClose} title="Content details">
      <div className="col gap-16">
        {/* Identity + breadcrumb */}
        <div>
          <div className="row gap-8 wrap" style={{ marginBottom: 8 }}>
            {(data?.breadcrumb || []).map((b) => (
              <span key={b.id} className="row gap-4 faint" style={{ fontSize: 11.5, fontWeight: 700 }}>{b.name}<ChevronRight size={12} /></span>
            ))}
            <Badge tone="indigo" dot={false}>{n.level}</Badge>
          </div>
          <div className="row between gap-8">
            <div style={{ fontWeight: 900, fontSize: 18 }}>{n.name}</div>
            <Badge>{n.status}</Badge>
          </div>
          <div className="faint" style={{ fontSize: 12 }}>/{n.slug} · v{n.version} · {data?.childCount ?? 0} children</div>
        </div>

        {n.level !== 'lesson' && (
          <button className="btn btn-soft sm" onClick={() => onDrill(n)}><FolderOpen size={14} /> View {data?.childCount ?? 0} children</button>
        )}

        {/* Status workflow */}
        {editable && (
          <div className="col gap-8">
            <div className="eyebrow">Workflow</div>
            <div className="row gap-8 wrap">
              {TRANSITIONS.filter((t) => t.to !== n.status).map((t) => {
                const blocked = t.needsPublish && !can('content.publish')
                return (
                  <button key={t.to} className={`btn ${t.tone} sm`} disabled={busy || blocked} title={blocked ? 'You cannot publish' : undefined} onClick={() => transition(t.to)}>
                    <t.icon size={14} /> {t.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Editable fields */}
        <div className="col gap-12" style={{ borderTop: '1px solid var(--hair)', paddingTop: 14 }}>
          <div className="field"><label>Name</label><input className="input" disabled={!editable} value={form.name} onChange={(e) => set({ name: e.target.value })} /></div>
          <div className="field"><label>Description</label><textarea className="textarea" disabled={!editable} value={form.description || ''} onChange={(e) => set({ description: e.target.value })} /></div>
          <div className="row gap-12 wrap">
            <div className="field grow"><label>Difficulty</label><select className="select" disabled={!editable} value={form.difficulty || ''} onChange={(e) => set({ difficulty: (e.target.value || null) as any })}><option value="">—</option>{['easy', 'medium', 'hard'].map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
            <div className="field" style={{ width: 130 }}><label>Duration (min)</label><input className="input" disabled={!editable} value={form.estimatedDuration ?? ''} onChange={(e) => set({ estimatedDuration: e.target.value ? parseInt(e.target.value, 10) : null })} /></div>
          </div>
          <div className="field"><label>Tags (comma-separated)</label><input className="input" disabled={!editable} value={(form.tags || []).join(', ')} onChange={(e) => set({ tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} /></div>
          <label className="row gap-8" style={{ alignItems: 'center', fontWeight: 700, fontSize: 13, cursor: editable ? 'pointer' : 'default' }}>
            <input type="checkbox" disabled={!editable} checked={form.visibility === 'hidden'} onChange={(e) => set({ visibility: e.target.checked ? 'hidden' : 'visible' })} /> Hidden (won't reach students even if published)
          </label>
          {editable && <button className="btn btn-primary sm" style={{ alignSelf: 'flex-start' }} disabled={!dirty || busy} onClick={save}><Save size={13} /> {busy ? 'Saving…' : 'Save changes'}</button>}
        </div>

        {/* Version history */}
        <div className="col gap-8" style={{ borderTop: '1px solid var(--hair)', paddingTop: 14 }}>
          <button className="row between pointer" style={{ background: 'none', border: 'none', padding: 0 }} onClick={() => setShowVersions((v) => !v)}>
            <span className="eyebrow"><History size={12} style={{ verticalAlign: -1 }} /> Version history ({versions.data?.rows?.length ?? 0})</span>
            <ChevronRight size={16} style={{ transform: showVersions ? 'rotate(90deg)' : 'none', transition: 'transform .15s', color: 'var(--faint)' }} />
          </button>
          {showVersions && (
            versions.data?.rows?.length ? (
              <div className="col gap-6">
                {versions.data.rows.map((v) => (
                  <div key={v.id} className="row between" style={{ background: 'var(--canvas)', borderRadius: 10, padding: '8px 12px' }}>
                    <div><span className="strong">v{v.version}</span> <span className="faint" style={{ fontSize: 11.5 }}>{v.changeSummary || 'published'} · {v.editorName || '—'} · {timeAgo(v.publishedAt || v.createdAt)}</span></div>
                    {editable && <button className="btn btn-ghost sm" disabled={busy} onClick={() => restore(v.version)}><Undo2 size={13} /> Restore</button>}
                  </div>
                ))}
              </div>
            ) : <div className="faint" style={{ fontSize: 12.5 }}>No published versions yet.</div>
          )}
        </div>

        {/* Delete */}
        {can('content.edit') && (
          <div style={{ borderTop: '1px solid var(--hair)', paddingTop: 14 }}>
            <button className="btn btn-danger sm" disabled={busy} onClick={() => doDelete(false)}><Trash2 size={13} /> Delete {n.level}</button>
          </div>
        )}
      </div>

      <ConfirmDialog open={confirmDel} onClose={() => setConfirmDel(false)} busy={busy} danger confirmLabel="Delete everything"
        onConfirm={() => { setConfirmDel(false); doDelete(true) }}
        title="Delete with children" message={<>This {n.level} has <b>{data?.childCount}</b> child item{(data?.childCount ?? 0) > 1 ? 's' : ''}. Deleting it removes the entire subtree. Continue?</>} />
    </Drawer>
  )
}
