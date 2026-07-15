'use client'

import { useState } from 'react'
import { Dumbbell, BookOpen, Target, Activity, Link2, Unlink, GraduationCap } from 'lucide-react'
import { useApi } from '@/components/useApi'
import { Skel, ErrorState, IconChip, Badge } from '@/components/ui'
import { Modal, ConfirmDialog } from '@/components/Modal'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api, ApiError } from '@/lib/api'
import type { ParentDetailData } from '@/lib/types'
import { S } from '@/lib/theme'
import { fmtDate, timeAgo, initials, colorFor } from '@/lib/format'

export function ParentDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const { can } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useApi<ParentDetailData>(`/parents/${id}`)
  const [linkOpen, setLinkOpen] = useState(false)
  const [unlinkConfirm, setUnlinkConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [linkQuery, setLinkQuery] = useState('')

  const editable = can('users.edit')

  if (loading) return <div className="col gap-12">{[0, 1, 2, 3].map((i) => <Skel key={i} h={i === 0 ? 60 : 40} />)}</div>
  if (error || !data) return <ErrorState message={error || 'Not found'} onRetry={reload} />

  const { parent, child, snapshot } = data
  const p = snapshot?.progress

  async function link() {
    const q = linkQuery.trim()
    if (!q) { toast('Enter the child\'s email or phone', 'err'); return }
    setBusy(true)
    try {
      const body = q.includes('@') ? { email: q } : { phone: q }
      await api(`/parents/${id}/link`, { method: 'POST', body })
      setLinkOpen(false); setLinkQuery(''); reload(); onChanged(); toast('Child linked', 'ok')
    } catch (e) { toast((e as ApiError)?.message || 'Link failed', 'err') } finally { setBusy(false) }
  }

  async function unlink() {
    setBusy(true)
    try { await api(`/parents/${id}/unlink`, { method: 'POST' }); setUnlinkConfirm(false); reload(); onChanged(); toast('Child unlinked', 'ok') }
    catch (e) { toast((e as ApiError)?.message || 'Unlink failed', 'err') } finally { setBusy(false) }
  }

  return (
    <div className="col gap-16">
      {/* Parent identity */}
      <div className="row gap-12">
        <span className="avatar" style={{ background: colorFor(parent.id), width: 48, height: 48, fontSize: 17, borderRadius: 14 }}>{initials(parent.name)}</span>
        <div className="grow">
          <div style={{ fontWeight: 900, fontSize: 17 }}>{parent.name}</div>
          <div className="faint" style={{ fontSize: 12.5, fontWeight: 600 }}>{parent.email || parent.phone || '—'}</div>
        </div>
        <Badge tone={parent.isActive ? 'emerald' : 'red'}>{parent.isActive ? 'active' : 'deactivated'}</Badge>
      </div>

      <div className="grid cols-2" style={{ gap: 10 }}>
        <Meta label="School" value={parent.school || '—'} />
        <Meta label="Language" value={parent.language || '—'} />
        <Meta label="Joined" value={fmtDate(parent.createdAt)} />
        <Meta label="Linkage" value={child ? 'Linked' : 'Not linked'} />
      </div>

      {/* Linked child */}
      <div className="col gap-8" style={{ borderTop: '1px solid var(--hair)', paddingTop: 14 }}>
        <div className="row between">
          <div className="eyebrow">Linked child</div>
          {editable && (child
            ? <button className="btn btn-ghost sm" onClick={() => setUnlinkConfirm(true)}><Unlink size={13} /> Unlink</button>
            : <button className="btn btn-soft sm" onClick={() => setLinkOpen(true)}><Link2 size={13} /> Link a child</button>)}
        </div>
        {child ? (
          <>
            <div className="row gap-10" style={{ background: S.canvas, borderRadius: 12, padding: '10px 12px' }}>
              <span className="avatar" style={{ background: colorFor(child.id) }}>{initials(child.name)}</span>
              <div className="grow">
                <div className="strong">{child.name}</div>
                <div className="faint" style={{ fontSize: 11.5 }}>{child.email || child.phone || '—'}</div>
              </div>
              {child.grade && <Badge tone="indigo" dot={false}>{child.grade}</Badge>}
            </div>
            {p && (
              <div className="grid cols-2" style={{ gap: 10, marginTop: 4 }}>
                <MiniStat icon={Dumbbell} tone="orange" label="Brain Gym" value={p.brainGymPlays} />
                <MiniStat icon={Activity} tone="gold" label="Accuracy" value={p.accuracy === null ? '—' : `${p.accuracy}%`} />
                <MiniStat icon={BookOpen} tone="purple" label="Lessons" value={p.lessons} />
                <MiniStat icon={Target} tone="red" label="Open mistakes" value={p.openMistakes} />
              </div>
            )}
            {!!snapshot?.recentActivity?.length && (
              <div style={{ marginTop: 6 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Recent activity</div>
                <div className="col gap-6">
                  {snapshot.recentActivity.slice(0, 6).map((a, i) => (
                    <div key={i} className="row between" style={{ fontSize: 12.5 }}>
                      <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{a.type}{a.subject ? ` · ${a.subject}` : ''}</span>
                      <span className="faint" style={{ fontWeight: 600 }}>{timeAgo(a.at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="row gap-10" style={{ background: S.canvas, borderRadius: 12, padding: '14px 12px' }}>
            <IconChip icon={GraduationCap} tone="indigo" size={36} />
            <div className="faint" style={{ fontSize: 13, fontWeight: 600 }}>No child linked yet. Link a student account to show their progress here.</div>
          </div>
        )}
      </div>

      <Modal open={linkOpen} onClose={() => setLinkOpen(false)} title="Link a child" width={420}
        footer={<><button className="btn btn-ghost" onClick={() => setLinkOpen(false)} disabled={busy}>Cancel</button><button className="btn btn-primary" onClick={link} disabled={busy}>{busy ? 'Linking…' : 'Link child'}</button></>}>
        <div className="field">
          <label>Child's email or phone</label>
          <input className="input" value={linkQuery} onChange={(e) => setLinkQuery(e.target.value)} placeholder="student@example.com" autoFocus />
          <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>The account must be a student. Links this parent to that child.</div>
        </div>
      </Modal>

      <ConfirmDialog open={unlinkConfirm} onClose={() => setUnlinkConfirm(false)} onConfirm={unlink} busy={busy} confirmLabel="Unlink"
        title="Unlink child" message={<>Remove the link between <b>{parent.name}</b> and <b>{child?.name}</b>? The child's data is unaffected.</>} />
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: S.canvas, borderRadius: 12, padding: '9px 12px' }}>
      <div className="faint" style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 13.5, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function MiniStat({ icon, tone, label, value }: { icon: any; tone: any; label: string; value: number | string }) {
  return (
    <div className="row gap-10" style={{ background: S.canvas, borderRadius: 12, padding: '10px 12px' }}>
      <IconChip icon={icon} tone={tone} size={34} />
      <div><div style={{ fontWeight: 900, fontSize: 16 }}>{value}</div><div className="faint" style={{ fontSize: 11, fontWeight: 700 }}>{label}</div></div>
    </div>
  )
}
