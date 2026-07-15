'use client'

import { useEffect, useState } from 'react'
import {
  Bot, Dumbbell, Swords, Target, BookOpen, Users, Bell, FlaskConical, type LucideIcon,
} from 'lucide-react'
import { useApi } from '@/components/useApi'
import { Card, SectionHead, Toggle, Badge, Skel, ErrorState, IconChip } from '@/components/ui'
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
    <Card>
      <SectionHead title="Feature Flags" tone="indigo" right={<Badge tone="indigo" dot={false}>{loading ? '…' : `${flags.length} flags`}</Badge>} />
      {loading ? (
        <div className="grid cols-2">{[0, 1, 2, 3].map((i) => <Skel key={i} h={92} r={16} />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="grid cols-2">
          {flags.map((f) => {
            const meta = ICONS[f.key] || { icon: FlaskConical, tone: 'indigo' as AccentKey }
            const isBusy = busy.has(f.key)
            return (
              <div key={f.key} className="row gap-12" style={{ alignItems: 'flex-start', background: 'var(--canvas)', borderRadius: 14, padding: 14 }}>
                <IconChip icon={meta.icon} tone={meta.tone} size={40} />
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="row between gap-8">
                    <span style={{ fontWeight: 900, fontSize: 14.5 }}>{f.label}</span>
                    <Toggle on={f.enabled} disabled={!editable || isBusy} onChange={() => patch(f, { enabled: !f.enabled }, { enabled: !f.enabled }, `${f.label} ${!f.enabled ? 'enabled' : 'disabled'}`)} />
                  </div>
                  {f.description && <div className="faint" style={{ fontSize: 12, fontWeight: 600, marginTop: 2, lineHeight: 1.4 }}>{f.description}</div>}
                  <div className="row gap-8 wrap" style={{ marginTop: 10, alignItems: 'center' }}>
                    <label className="row gap-6" style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>
                      env
                      <select className="select" style={{ width: 'auto', padding: '3px 6px', fontSize: 11.5 }} value={f.environment} disabled={!editable || isBusy}
                        onChange={(e) => patch(f, { environment: e.target.value }, { environment: e.target.value as FeatureFlag['environment'] }, `${f.label} environment updated`)}
                        aria-label={`${f.label} environment`}>
                        {ENVS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </label>
                    <Badge tone="cyan" dot={false}>{f.rolloutScope}</Badge>
                    <span className="ml-auto faint" style={{ fontSize: 10.5, fontWeight: 700 }} title={new Date(f.updatedAt).toLocaleString()}>
                      {f.updatedByName ? `${f.updatedByName} · ${timeAgo(f.updatedAt)}` : `${timeAgo(f.updatedAt)}`}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
