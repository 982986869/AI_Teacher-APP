'use client'

import { useId } from 'react'
import { S, accent, type AccentKey } from '@/lib/theme'

// Lightweight bespoke SVG charts — no chart library, matching the app's hand-painted
// gradient look. All are responsive via viewBox + width:100%.

export function Sparkline({ data, tone = 'indigo', height = 40 }: { data: number[]; tone?: AccentKey; height?: number }) {
  const id = useId()
  const a = accent(tone)
  if (!data.length) return <div style={{ height }} />
  const w = 120, h = height
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pts = data.map((v, i) => [(i / Math.max(1, data.length - 1)) * w, h - 4 - ((v - min) / range) * (h - 8)])
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sp${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a.color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={a.color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp${id})`} />
      <path d={line} fill="none" stroke={a.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// Line chart with x-axis dates + gridlines. values may contain nulls (gaps).
export function LineChart({ series, tone = 'indigo', height = 220, yMax }: {
  series: { label: string; value: number | null }[]; tone?: AccentKey; height?: number; yMax?: number
}) {
  const id = useId()
  const a = accent(tone)
  const w = 640, h = height, padL = 34, padB = 26, padT = 12, padR = 8
  const vals = series.map((s) => s.value).filter((v): v is number => v !== null)
  const max = yMax ?? Math.max(...vals, 1)
  const innerW = w - padL - padR, innerH = h - padT - padB
  const x = (i: number) => padL + (i / Math.max(1, series.length - 1)) * innerW
  const y = (v: number) => padT + innerH - (v / max) * innerH

  // Build path segments, breaking on nulls.
  let d = ''
  series.forEach((s, i) => {
    if (s.value === null) { d += ' '; return }
    const prev = series[i - 1]
    d += `${!prev || prev.value === null ? 'M' : 'L'}${x(i).toFixed(1)},${y(s.value).toFixed(1)} `
  })
  const ticks = 4
  const step = Math.max(1, Math.ceil(series.length / 8))
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`ln${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={a.color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={a.color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const gy = padT + (i / ticks) * innerH
        const val = Math.round(max - (i / ticks) * max)
        return (
          <g key={i}>
            <line x1={padL} y1={gy} x2={w - padR} y2={gy} stroke={S.hair} strokeWidth="1" />
            <text x={padL - 6} y={gy + 3} fontSize="9" fill={S.faint} textAnchor="end" fontWeight="700">{val}</text>
          </g>
        )
      })}
      {d.trim() && <path d={`${d} L${x(series.length - 1)},${padT + innerH} L${padL},${padT + innerH} Z`} fill={`url(#ln${id})`} opacity={0.9} />}
      {d.trim() && <path d={d} fill="none" stroke={a.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />}
      {series.map((s, i) => (i % step === 0 ? (
        <text key={i} x={x(i)} y={h - 8} fontSize="9" fill={S.faint} textAnchor="middle" fontWeight="700">
          {s.label}
        </text>
      ) : null))}
    </svg>
  )
}

// Horizontal bar list (most-active subjects, weak topics, etc.).
export function BarList({ items, tone = 'indigo', valueSuffix = '' }: {
  items: { label: string; sub?: string; value: number }[]; tone?: AccentKey; valueSuffix?: string
}) {
  const a = accent(tone)
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="col gap-12">
      {items.map((it, i) => (
        <div key={i}>
          <div className="row between" style={{ marginBottom: 5 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: S.ink }} className="truncate">
              {it.label}{it.sub ? <span style={{ color: S.faint, fontWeight: 600 }}> · {it.sub}</span> : null}
            </span>
            <span className="tnum" style={{ fontWeight: 800, fontSize: 13, color: S.sub }}>{it.value.toLocaleString('en-IN')}{valueSuffix}</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: S.hair, overflow: 'hidden' }}>
            <div style={{ width: `${(it.value / max) * 100}%`, height: '100%', borderRadius: 4, background: a.color, transition: 'width .5s cubic-bezier(0.22,1,0.36,1)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// Column/bar chart for categorical comparisons.
export function ColumnChart({ items, tone = 'indigo', height = 200, suffix = '' }: {
  items: { label: string; value: number | null }[]; tone?: AccentKey; height?: number; suffix?: string
}) {
  const a = accent(tone)
  const max = Math.max(...items.map((i) => i.value ?? 0), 1)
  return (
    <div className="row" style={{ alignItems: 'flex-end', gap: 10, height, padding: '8px 0' }}>
      {items.map((it, i) => {
        const pct = it.value === null ? 0 : (it.value / max) * 100
        return (
          <div key={i} className="col" style={{ flex: 1, alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <span className="tnum" style={{ fontSize: 11, fontWeight: 800, color: S.sub }}>{it.value ?? '—'}{it.value !== null ? suffix : ''}</span>
            <div style={{ width: '100%', maxWidth: 46, height: `${Math.max(2, pct)}%`, background: `linear-gradient(180deg, ${a.color}, ${a.color}cc)`, borderRadius: '6px 6px 3px 3px', transition: 'height .5s cubic-bezier(0.22,1,0.36,1)' }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: S.faint, textAlign: 'center' }} className="truncate">{it.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// Donut for a single completion/retention rate.
export function Donut({ value, tone = 'emerald', size = 120, label }: { value: number | null; tone?: AccentKey; size?: number; label?: string }) {
  const a = accent(tone)
  const r = size / 2 - 9
  const c = 2 * Math.PI * r
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value))
  return (
    <div className="col" style={{ alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={S.hair} strokeWidth="9" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={a.color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .7s cubic-bezier(0.22,1,0.36,1)' }} />
        <text x="50%" y="50%" textAnchor="middle" dy="0.1em" fontSize={size * 0.24} fontWeight="900" fill={S.ink}>
          {value === null ? '—' : `${pct}%`}
        </text>
      </svg>
      {label && <span style={{ fontSize: 12, fontWeight: 700, color: S.muted }}>{label}</span>}
    </div>
  )
}
