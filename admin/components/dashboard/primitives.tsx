'use client'

import { ReactNode } from 'react'
import { Clock, type LucideIcon } from 'lucide-react'
import { accent, type AccentKey } from '@/lib/theme'
import { CountUp, Skel } from '@/components/ui'
import { Sparkline } from '@/components/charts'

// ─── Shared metric tile ────────────────────────────────────────────────────────
// The single reusable metric component for the whole dashboard. Handles: number
// count-up, string values, an honest "Pending Backend" state, an optional sparkline,
// a delta chip, a hint line, and click-through. No metric is ever faked here — a
// `pending` tile is visually distinct (dashed) and never shows a number.
export interface MetricSpec {
  key?: string
  icon: LucideIcon
  tone?: AccentKey
  label: string
  value?: number | string | null
  suffix?: string
  hint?: string
  spark?: number[]
  delta?: { dir: 'up' | 'down' | 'flat'; text: string }
  pending?: boolean
  onClick?: () => void
}

export function MetricTile({ icon: Icon, tone = 'indigo', label, value, suffix, hint, spark, delta, pending, onClick }: MetricSpec) {
  const a = accent(tone)
  if (pending) {
    return (
      <div className="metric pending">
        <div className="metric-top">
          <span className="metric-chip" style={{ background: 'var(--canvas)' }}><Icon size={16} color="var(--faint)" strokeWidth={2.2} /></span>
          <span className="metric-label">{label}</span>
        </div>
        <div className="metric-value">Not tracked yet</div>
        <span className="pending-tag"><Clock size={10} /> Pending Backend</span>
      </div>
    )
  }
  const isNum = typeof value === 'number'
  return (
    <div className={`metric ${onClick ? 'clickable' : ''}`} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}>
      <div className="metric-top">
        <span className="metric-chip" style={{ background: a.soft }}><Icon size={16} color={a.color} strokeWidth={2.4} /></span>
        <span className="metric-label">{label}</span>
        {delta && <span className={`delta-chip ${delta.dir} ml-auto`}>{delta.text}</span>}
      </div>
      <div className="metric-value">
        {value === null || value === undefined ? '—' : isNum ? <CountUp value={value as number} /> : value}
        {suffix && value !== null && value !== undefined ? <span style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 800 }}>{suffix}</span> : null}
      </div>
      {hint && <div className="metric-hint">{hint}</div>}
      {spark && spark.length > 1 && <div className="metric-spark"><Sparkline data={spark} tone={tone} height={30} /></div>}
    </div>
  )
}

export function MetricSkeleton() {
  return (
    <div className="metric">
      <div className="metric-top"><Skel w={32} h={32} r={10} /><Skel w={90} h={11} /></div>
      <Skel w={72} h={26} r={7} />
      <Skel w={54} h={10} style={{ marginTop: 8 }} />
    </div>
  )
}

// ─── Section wrapper (modular card container) ──────────────────────────────────
export function DashboardSection({ title, tone = 'indigo', icon: Icon, description, right, children, min = 180 }: {
  title: string; tone?: AccentKey; icon?: LucideIcon; description?: string; right?: ReactNode; children: ReactNode; min?: number
}) {
  const a = accent(tone)
  return (
    <section className="col gap-12">
      <div className="row between wrap gap-8" style={{ alignItems: 'flex-end' }}>
        <div className="row gap-10" style={{ alignItems: 'center' }}>
          {Icon
            ? <span className="metric-chip" style={{ background: a.soft, width: 30, height: 30 }}><Icon size={16} color={a.color} strokeWidth={2.4} /></span>
            : <span className="section-dot" style={{ background: a.color }} />}
          <div className="col" style={{ gap: 0 }}>
            <span className="h2">{title}</span>
            {description && <span className="faint" style={{ fontSize: 12, fontWeight: 600 }}>{description}</span>}
          </div>
        </div>
        {right}
      </div>
      {/* auto-fill keeps the metric grid fully responsive across every breakpoint */}
      <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }}>
        {children}
      </div>
    </section>
  )
}

// Format helpers used across sections.
export function ms(v: number | null | undefined): string {
  if (v == null || v === 0) return '—'
  return v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`
}

export function delta(today: number, label = 'today'): MetricSpec['delta'] {
  if (!today) return undefined
  return { dir: 'up', text: `+${today.toLocaleString('en-IN')} ${label}` }
}
