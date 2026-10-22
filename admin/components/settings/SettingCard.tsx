'use client'

import { useEffect, useState } from 'react'
import { Save, Wrench, CalendarDays, Mail, GraduationCap, Flag, Settings as Cog, Clock, Smartphone, ShieldCheck, Layers, type LucideIcon } from 'lucide-react'
import { Toggle } from '@/components/ui'
import { ConfirmDialog } from '@/components/Modal'
import { useToast } from '@/lib/toast'
import { api, ApiError } from '@/lib/api'
import type { Setting } from '@/lib/types'
import type { AccentKey } from '@/lib/theme'
import { fmtDateTime } from '@/lib/format'

const META: Record<string, { icon: LucideIcon; tone: AccentKey }> = {
  maintenance_mode: { icon: Wrench, tone: 'orange' },
  academic_year: { icon: CalendarDays, tone: 'blue' },
  supported_classes: { icon: GraduationCap, tone: 'indigo' },
  contact_email: { icon: Mail, tone: 'cyan' },
  default_student_experience: { icon: Flag, tone: 'purple' },
  app_version: { icon: Smartphone, tone: 'emerald' },
  platform_config: { icon: ShieldCheck, tone: 'blue' },
  mobile_release: { icon: Smartphone, tone: 'indigo' },
}

/** Hex per tone, so a card's colour survives outside the Card/IconChip system. */
const TINT: Record<string, string> = {
  purple: '#8B5CF6', orange: '#e8833a', cyan: '#19a0b8', blue: '#2a78d6',
  emerald: '#1baf7a', indigo: '#4F6DF5', gold: '#eda100', red: '#e8699b',
}
const EXPERIENCES = ['standard', 'guided', 'exam']
const CLASS_RANGE = [6, 7, 8, 9, 10, 11, 12]

export function SettingCard({ setting, editable, onConflict }: { setting: Setting; editable: boolean; onConflict: () => void }) {
  const toast = useToast()
  const [value, setValue] = useState<any>(setting.value)
  const [baseline, setBaseline] = useState<any>(setting.value)
  const [version, setVersion] = useState(setting.version)
  const [busy, setBusy] = useState(false)
  const [confirmMaint, setConfirmMaint] = useState(false)
  const meta = META[setting.key] || { icon: Cog, tone: 'indigo' as AccentKey }

  useEffect(() => { setValue(setting.value); setBaseline(setting.value); setVersion(setting.version) }, [setting])

  const dirty = JSON.stringify(value) !== JSON.stringify(baseline)
  const set = (patch: Record<string, any>) => setValue((v: any) => ({ ...v, ...patch }))

  async function doSave() {
    setBusy(true)
    try {
      const res = await api<{ setting: Setting }>(`/settings/${setting.key}`, { method: 'PATCH', body: { value, expectedVersion: version } })
      setBaseline(res.setting.value); setValue(res.setting.value); setVersion(res.setting.version)
      toast('Saved', 'ok')
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) { toast('Changed elsewhere — reloading', 'err'); onConflict() }
      else toast((e as ApiError)?.message || 'Save failed', 'err')
    } finally { setBusy(false); setConfirmMaint(false) }
  }

  function save() {
    // Turning maintenance mode ON is high-impact → confirm first.
    if (setting.key === 'maintenance_mode' && value?.enabled === true && baseline?.enabled !== true) { setConfirmMaint(true); return }
    doSave()
  }

  const Icon = meta.icon
  return (
    <div className={'set-card' + (dirty ? ' dirty' : '')}>
      <div className="row gap-11" style={{ alignItems: 'flex-start' }}>
        <span className="set-card-ic" style={{ background: TINT[meta.tone] + '1a', color: TINT[meta.tone] }}>
          <Icon size={19} strokeWidth={2.1} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="set-card-title">{setting.label || setting.key}</div>
          {setting.description && <div className="set-card-sub">{setting.description}</div>}
        </div>
      </div>

      <div className="col gap-10 set-card-body">{renderEditor(setting.key, value, set, editable)}</div>

      {editable && (
        <div className="set-card-foot">
          <span className="set-when" title={`version ${version}`}>
            <Clock size={12} /> Updated {fmtDateTime(setting.updatedAt)}
          </span>
          {/* The button only lights up once something has actually changed, so a
              card that looks saveable always is. */}
          <button className="btn btn-primary sm" onClick={save} disabled={!dirty || busy}>
            <Save size={13} /> {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}

      <ConfirmDialog open={confirmMaint} onClose={() => setConfirmMaint(false)} onConfirm={doSave} busy={busy} danger confirmLabel="Enable maintenance"
        title="Enable maintenance mode" message="This shows a maintenance banner to users. Enable it now?" />
    </div>
  )
}

function renderEditor(key: string, value: any, set: (p: Record<string, any>) => void, editable: boolean) {
  // Supported classes → toggle chips
  if (key === 'supported_classes') {
    const active: number[] = Array.isArray(value?.classes) ? value.classes : []
    return (
      <div className="row gap-6 wrap" role="group" aria-label="Supported classes">
        {CLASS_RANGE.map((c) => {
          const on = active.includes(c)
          return (
            <button key={c} className={'set-chip' + (on ? ' on' : '')} aria-pressed={on} disabled={!editable}
              onClick={() => set({ classes: on ? active.filter((x) => x !== c) : [...active, c].sort((a, b) => a - b) })}>
              Class {c}
            </button>
          )
        })}
      </div>
    )
  }
  // Default experience → select
  if (key === 'default_student_experience') {
    return (
      <div className="field">
        <label htmlFor="exp">Experience</label>
        <select id="exp" className="select" value={value?.experience || 'standard'} disabled={!editable} onChange={(e) => set({ experience: e.target.value })}>
          {EXPERIENCES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
    )
  }
  // Generic: iterate the value object's fields
  const entries = value && typeof value === 'object' ? Object.entries(value) : []
  return entries.map(([k, v]) => (
    <div key={k} className="row between gap-12" style={{ padding: '4px 0' }}>
      <label htmlFor={`${key}-${k}`} style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</label>
      {typeof v === 'boolean'
        ? <Toggle on={!!v} disabled={!editable} onChange={(nv) => set({ [k]: nv })} />
        : k === 'message'
          ? <textarea id={`${key}-${k}`} className="textarea" style={{ maxWidth: 320, minHeight: 60 }} disabled={!editable} value={String(v ?? '')} onChange={(e) => set({ [k]: e.target.value })} />
          : <input id={`${key}-${k}`} className="input" type={k === 'email' ? 'email' : 'text'} style={{ maxWidth: 220 }} disabled={!editable} value={String(v ?? '')} onChange={(e) => set({ [k]: e.target.value })} />}
    </div>
  ))
}
