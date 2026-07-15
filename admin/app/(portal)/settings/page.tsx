'use client'

import { Info } from 'lucide-react'
import { useApi } from '@/components/useApi'
import { Card, SectionHead, Skel, ErrorState } from '@/components/ui'
import { FeatureFlags } from '@/components/settings/FeatureFlags'
import { SettingCard } from '@/components/settings/SettingCard'
import { useAuth } from '@/lib/auth'
import type { Setting } from '@/lib/types'
import { S } from '@/lib/theme'

const CATEGORY_ORDER = ['general', 'academics', 'system']
const CATEGORY_LABEL: Record<string, string> = { general: 'General', academics: 'Academics', system: 'System' }

export default function SettingsPage() {
  const { can } = useAuth()
  const { data, loading, error, reload } = useApi<{ settings: Setting[]; version: any }>('/settings')
  const editable = can('settings.edit')

  const byCategory: Record<string, Setting[]> = {}
  for (const s of data?.settings || []) (byCategory[s.category] ||= []).push(s)
  const categories = Object.keys(byCategory).sort((a, b) => (CATEGORY_ORDER.indexOf(a) + 99) - (CATEGORY_ORDER.indexOf(b) + 99))

  return (
    <div className="col gap-24">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="h1">Settings</h1>
          <div className="sub">Feature flags, platform configuration and maintenance controls.</div>
        </div>
      </div>

      {/* Feature Flags */}
      {can('flags.view') && <FeatureFlags />}

      {/* Settings by category */}
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading ? (
        <div className="grid cols-2">{[0, 1, 2, 3].map((i) => <Skel key={i} h={150} r={20} />)}</div>
      ) : (
        categories.map((cat) => (
          <section key={cat} className="col gap-12">
            <SectionHead title={CATEGORY_LABEL[cat] || cat} tone="blue" />
            <div className="grid cols-2">
              {byCategory[cat].map((s) => <SettingCard key={s.key} setting={s} editable={editable} onConflict={reload} />)}
            </div>
          </section>
        ))
      )}

      {/* Version info (read-only) */}
      {!loading && !error && (
        <Card>
          <SectionHead title="Version information" tone="cyan" right={<Info size={15} color={S.faint} />} />
          <div className="grid cols-3" style={{ gap: 10 }}>
            <Info2 label="API version" value={data?.version?.apiVersion} />
            <Info2 label="Environment" value={data?.version?.environment} />
            <Info2 label="Node" value={data?.version?.node} />
          </div>
        </Card>
      )}
    </div>
  )
}

function Info2({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ background: 'var(--canvas)', borderRadius: 12, padding: '10px 14px' }}>
      <div className="faint" style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 14, marginTop: 2 }}>{value || '—'}</div>
    </div>
  )
}
