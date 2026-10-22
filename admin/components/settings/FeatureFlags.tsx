'use client'

import { useEffect, useState } from 'react'
import {
  Bot, Dumbbell, Swords, Target, BookOpen, Users, Bell, FlaskConical, Layers, type LucideIcon,
} from 'lucide-react'
import { useApi } from '@/components/useApi'
import { Toggle, Skel, ErrorState } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api, ApiError } from '@/lib/api'
import type { FeatureFlag } from '@/lib/types'
import type { AccentKey } from '@/lib/theme'
import { timeAgo } from '@/lib/format'

const ICONS: Record<string, { icon: LucideIcon; tone: AccentKey }> = {
  ai_teacher: { icon: Bot, tone: 'purple' },
  brain_gym: { icon: Dumbbell, tone: 'orange' },
  arena: { icon: Swords, tone: 'cyan' },
  practice: { icon: Target, tone: 'blue' },
  resources: { icon: BookOpen, tone: 'emerald' },
  parent_app: { icon: Users, tone: 'indigo' },
  notifications: { icon: Bell, tone: 'gold' },
  experimental: { icon: FlaskConical, tone: 'red' },
}
const ENVS: FeatureFlag['environment'][] = ['all', 'production', 'development']

/** Hex per tone, so a flag's colour survives outside the Card/IconChip system. */
const TINT: Record<string, string> = {
  purple: '#8B5CF6', orange: '#e8833a', cyan: '#19a0b8', blue: '#2a78d6',
  emerald: '#1baf7a', indigo: '#4F6DF5', gold: '#eda100', red: '#e8699b',
}

export function FeatureFlags() {
  const { can } = useAuth()
  const toast = useToast()
  const { data, loading, error, reload } = useApi<{ flags: FeatureFlag[] }>('/feature-flags')
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [busy, setBusy] = useState<Set<string>>(new Set())
  const editable = can('flags.edit')

  useEffect(() => { if (data?.flags) setFlags(data.flags) }, [data])

  function setBusyFor(key: string, on: boolean) {
    setBusy((b) => { const n = new Set(b); on ? n.add(key) : n.delete(key); return n })
  }

  // Optimistic patch: apply locally, call API, reconcile with the returned row.
  // On a 409 (someone else changed it) revert and refetch the fresh state.
  async function patch(flag: FeatureFlag, body: Record<string, any>, optimistic: Partial<FeatureFlag>, okMsg: string) {
    if (!editable) return
    setBusyFor(flag.key, true)
    setFlags((prev) => prev.map((f) => (f.key === flag.key ? { ...f, ...optimistic } : f)))
    try {
      const res = await api<{ flag: FeatureFlag }>(`/feature-flags/${flag.key}`, { method: 'PATCH', body: { ...body, expectedVersion: flag.version } })
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? res.flag : f)))
      toast(okMsg, 'ok')
    } catch (e) {
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? flag : f))) // revert
      if (e instanceof ApiError && e.status === 409) { toast('Changed elsewhere — refreshing', 'err'); reload() }
      else toast((e as ApiError)?.message || 'Update failed', 'err')
    } finally {
      setBusyFor(flag.key, false)
    }
  }

  return (
    <section className="set-section">
      <div className="set-section-head">
        <div>
          <h2 className="set-section-title">Feature Flags</h2>
          <div className="set-section-sub">Enable or disable features across the platform.</div>
        </div>
        <span className="set-count"><Layers size={14} /> {loading ? '…' : `${flags.length} Flags`}</span>
      </div>

      {loading ? (
        <div className="set-flags">{[0, 1, 2, 3].map((i) => <Skel key={i} h={132} r={15} />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="set-flags">
          {flags.map((f, i) => {
            const meta = ICONS[f.key] || { icon: FlaskConical, tone: 'indigo' as AccentKey }
            const isBusy = busy.has(f.key)
            const Icon = meta.icon
            return (
              <div key={f.key} className={'set-flag' + (f.enabled ? ' on' : '')} style={{ animationDelay: Math.min(i, 8) * 45 + 'ms' }}>
                <div className="row gap-11" style={{ alignItems: 'flex-start' }}>
                  <span className="set-flag-ic" style={{ background: TINT[meta.tone] + '1a', color: TINT[meta.tone] }}>
                    <Icon size={19} strokeWidth={2.1} />
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row between gap-8" style={{ alignItems: 'flex-start' }}>
                      <span className="set-flag-name">{f.label}</span>
                      <Toggle
                        on={f.enabled}
                        disabled={!editable || isBusy}
                        onChange={() => patch(f, { enabled: !f.enabled }, { enabled: !f.enabled }, `${f.label} ${!f.enabled ? 'enabled' : 'disabled'}`)}
                      />
                    </div>
                    {f.description && <div className="set-flag-desc">{f.description}</div>}
                  </div>
                </div>

                <div className="set-flag-foot">
                  {/* Scope and environment stay editable — a flag that can only be
                      flipped on or off cannot be rolled out to production alone,
                      which is most of what flags are for. */}
                  <span className="set-scope">{f.rolloutScope}</span>
                  <select
                    className="set-env" value={f.environment} disabled={!editable || isBusy}
                    onChange={(e) => patch(f, { environment: e.target.value }, { environment: e.target.value as FeatureFlag['environment'] }, `${f.label} environment updated`)}
                    aria-label={`${f.label} environment`}
                  >
                    {ENVS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <span className="set-flag-when" title={new Date(f.updatedAt).toLocaleString()}>
                    {f.updatedByName ? `${f.updatedByName} · ${timeAgo(f.updatedAt)}` : timeAgo(f.updatedAt)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
