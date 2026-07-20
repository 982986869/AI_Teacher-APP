'use client'

import { useState } from 'react'
import { KeyRound, ShieldCheck, Ban, Trash2, CircleCheck, Copy, Dumbbell, BookOpen, Target, Activity } from 'lucide-react'
import { useApi } from '@/components/useApi'
import { Badge, Skel, ErrorState, IconChip } from '@/components/ui'
import { ConfirmDialog, Modal } from '@/components/Modal'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api } from '@/lib/api'
import type { AdminRole } from '@/lib/types'
import { S } from '@/lib/theme'
import { fmtDate, timeAgo, initials, colorFor } from '@/lib/format'

interface DetailData {
  user: any
  progress: { brainGymPlays: number; xp: number; accuracy: number | null; lessons: number; openMistakes: number; practiceAttempts: number }
  linkedParents: { id: string; name: string; email: string }[]
  recentActivity: { type: string; subject: string | null; chapter: string | null; at: string }[]
}

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'No admin access' },
  { value: 'support', label: 'Support' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
]

export function UserDetail({ id, onChanged, onClose }: { id: string; onChanged: () => void; onClose: () => void }) {
  const { can, admin } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useApi<DetailData>(`/users/${id}`)
  const [confirm, setConfirm] = useState<null | 'deactivate' | 'reactivate' | 'delete'>(null)
  const [roleModal, setRoleModal] = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [newRole, setNewRole] = useState<string>('')
  const [tempPw, setTempPw] = useState<string | null>(null)

  if (loading) return <div className="col gap-12">{[0, 1, 2, 3].map((i) => <Skel key={i} h={i === 0 ? 60 : 40} />)}</div>
  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return null

  const u = data.user
  const p = data.progress

  async function act(fn: () => Promise<any>, msg: string) {
    setBusy(true)
    try { await fn(); toast(msg, 'ok'); reload(); onChanged() }
    catch (e: any) { toast(e?.message || 'Action failed', 'err') }
    finally { setBusy(false); setConfirm(null) }
  }

  async function changeRole() {
    await act(() => api(`/users/${id}/role`, { method: 'PATCH', body: { adminRole: newRole || null } }), 'Role updated')
    setRoleModal(false)
  }
  async function resetPw() {
    setBusy(true)
    try {
      const res = await api<{ temporaryPassword?: string }>(`/users/${id}/reset-password`, { method: 'POST', body: {} })
      setTempPw(res.temporaryPassword || null)
      toast('Password reset', 'ok')
    } catch (e: any) { toast(e?.message || 'Reset failed', 'err') }
    finally { setBusy(false) }
  }

  return (
    <div className="col gap-16">
      {/* Identity */}
      <div className="row gap-12">
        <span className="avatar" style={{ background: colorFor(u.id), width: 48, height: 48, fontSize: 17, borderRadius: 14 }}>{initials(u.name)}</span>
        <div className="grow">
          <div style={{ fontWeight: 900, fontSize: 17 }}>{u.name}</div>
          <div className="faint" style={{ fontSize: 12.5, fontWeight: 600 }}>{u.email || u.phone || '—'}</div>
        </div>
        <Badge tone={u.isActive ? 'emerald' : 'red'}>{u.isActive ? 'active' : 'deactivated'}</Badge>
      </div>

      {/* Meta */}
      <div className="grid cols-2" style={{ gap: 10 }}>
        <Meta label="Account type" value={u.adminRole ? u.adminRole.replace('_', ' ') : u.accountType} />
        <Meta label="Class" value={u.grade || '—'} />
        <Meta label="Stream" value={u.stream || '—'} />
        <Meta label="Board" value={u.board || '—'} />
        <Meta label="Provider" value={u.provider} />
        <Meta label="Joined" value={fmtDate(u.createdAt)} />
      </div>

      {/* Progress snapshot */}
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Learning snapshot</div>
        <div className="grid cols-2" style={{ gap: 10 }}>
          <MiniStat icon={Dumbbell} tone="orange" label="Brain Gym" value={p.brainGymPlays} />
          <MiniStat icon={Activity} tone="gold" label="Accuracy" value={p.accuracy === null ? '—' : `${p.accuracy}%`} />
          <MiniStat icon={BookOpen} tone="purple" label="Lessons" value={p.lessons} />
          <MiniStat icon={Target} tone="red" label="Open mistakes" value={p.openMistakes} />
        </div>
      </div>

      {data.linkedParents.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Linked parent</div>
          {data.linkedParents.map((par) => (
            <div key={par.id} className="row gap-10" style={{ padding: '8px 0' }}>
              <span className="avatar" style={{ background: colorFor(par.id) }}>{initials(par.name)}</span>
              <div><div className="strong">{par.name}</div><div className="faint" style={{ fontSize: 11.5 }}>{par.email}</div></div>
            </div>
          ))}
        </div>
      )}

      {data.recentActivity.length > 0 && (
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Recent activity</div>
          <div className="col gap-8">
            {data.recentActivity.slice(0, 6).map((a, i) => (
              <div key={i} className="row between" style={{ fontSize: 12.5 }}>
                <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{a.type}{a.subject ? ` · ${a.subject}` : ''}</span>
                <span className="faint" style={{ fontWeight: 600 }}>{timeAgo(a.at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="col gap-8" style={{ borderTop: '1px solid var(--hair)', paddingTop: 14 }}>
        <div className="eyebrow">Actions</div>
        <div className="row gap-8 wrap">
          {can('users.password') && <button className="btn btn-soft sm" onClick={() => { setTempPw(null); setPwModal(true) }}><KeyRound size={14} /> Reset password</button>}
          {can('users.role') && <button className="btn btn-ghost sm" onClick={() => { setNewRole(u.adminRole || ''); setRoleModal(true) }}><ShieldCheck size={14} /> Manage role</button>}
          {can('users.edit') && (u.isActive
            ? <button className="btn btn-ghost sm" onClick={() => setConfirm('deactivate')}><Ban size={14} /> Deactivate</button>
            : <button className="btn btn-ghost sm" onClick={() => setConfirm('reactivate')}><CircleCheck size={14} /> Reactivate</button>)}
          {can('users.delete') && u.adminRole !== 'super_admin' && <button className="btn btn-danger sm" onClick={() => setConfirm('delete')}><Trash2 size={14} /> Delete</button>}
        </div>
      </div>

      {/* Confirms */}
      <ConfirmDialog open={confirm === 'deactivate'} onClose={() => setConfirm(null)} busy={busy} danger confirmLabel="Deactivate"
        onConfirm={() => act(() => api(`/users/${id}/status`, { method: 'PATCH', body: { isActive: false } }), 'User deactivated')}
        title="Deactivate user" message={<>Block <b>{u.name}</b> from signing in? Their data is preserved and they can be reactivated later.</>} />
      <ConfirmDialog open={confirm === 'reactivate'} onClose={() => setConfirm(null)} busy={busy} confirmLabel="Reactivate"
        onConfirm={() => act(() => api(`/users/${id}/status`, { method: 'PATCH', body: { isActive: true } }), 'User reactivated')}
        title="Reactivate user" message={<>Restore sign-in access for <b>{u.name}</b>?</>} />
      <ConfirmDialog open={confirm === 'delete'} onClose={() => setConfirm(null)} busy={busy} danger confirmLabel="Delete permanently"
        onConfirm={() => act(async () => { await api(`/users/${id}`, { method: 'DELETE' }); onClose() }, 'User deleted')}
        title="Delete user" message={<>Permanently delete <b>{u.name}</b> and all their learning data? This cannot be undone.</>} />

      {/* Role modal */}
      <Modal open={roleModal} onClose={() => setRoleModal(false)} title="Manage admin role" width={420}
        footer={<><button className="btn btn-ghost" onClick={() => setRoleModal(false)} disabled={busy}>Cancel</button><button className="btn btn-primary" onClick={changeRole} disabled={busy}>Save role</button></>}>
        <div className="field">
          <label>Admin role</label>
          <select className="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            {ROLE_OPTIONS.filter((o) => o.value !== 'super_admin' || admin?.role === 'super_admin').map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="faint" style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
            Granting an admin role gives this person access to the operations console. Only a Super Admin can assign the Super Admin role.
          </div>
        </div>
      </Modal>

      {/* Password modal */}
      <Modal open={pwModal} onClose={() => setPwModal(false)} title="Reset password" width={420}
        footer={tempPw ? <button className="btn btn-primary" onClick={() => setPwModal(false)}>Done</button>
          : <><button className="btn btn-ghost" onClick={() => setPwModal(false)} disabled={busy}>Cancel</button><button className="btn btn-primary" onClick={resetPw} disabled={busy}>Generate temporary password</button></>}>
        {tempPw ? (
          <div className="col gap-10">
            <div className="faint" style={{ fontSize: 13, fontWeight: 600 }}>Share this one-time password with the user. They should change it after signing in.</div>
            <div className="row gap-8" style={{ background: S.canvas, padding: '12px 14px', borderRadius: 12, border: '1px solid var(--hair)' }}>
              <code style={{ flex: 1, fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>{tempPw}</code>
              <button className="btn btn-soft sm" onClick={() => { navigator.clipboard?.writeText(tempPw); toast('Copied', 'ok') }}><Copy size={13} /> Copy</button>
            </div>
          </div>
        ) : (
          <div className="faint" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6 }}>
            Generate a secure temporary password for <b style={{ color: S.ink }}>{u.name}</b>. The current password will be invalidated immediately.
          </div>
        )}
      </Modal>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: S.canvas, borderRadius: 12, padding: '9px 12px' }}>
      <div className="faint" style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 13.5, textTransform: 'capitalize', marginTop: 2 }}>{value}</div>
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
