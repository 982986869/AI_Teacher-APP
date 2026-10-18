'use client'

/**
 * Charts and motion for the dashboard overview.
 *
 * Colours come from a validated palette rather than taste: the sequential blue
 * ramp for the ordered progress states, and three categorical slots for the
 * three learning metrics. Both were run through the palette validator in light
 * and dark mode. The light-mode contrast warning on two slots is answered the
 * way the method requires — every mark carries a visible text label, so identity
 * never rests on colour alone.
 *
 * Everything that moves here does so to show a value arriving: a line draws in
 * the direction it is read, an arc sweeps to its share, a number counts to its
 * total. Nothing loops, nothing moves after it has landed, and all of it is off
 * under prefers-reduced-motion.
 */

import { useEffect, useId, useRef, useState } from 'react'
import { S } from '@/lib/theme'

/** Sequential blue, light → dark. The order IS the meaning: not started → done. */
export const PROGRESS_RAMP = {
  notStarted: '#b7d3f6',
  inProgress: '#5598e7',
  completed: '#1c5cab',
} as const

/** Three distinct measures, so identity (categorical) is the right encoding. */
export const METRIC_HUES = ['#2a78d6', '#1baf7a', '#eda100'] as const

/** The one easing used everywhere, so the whole page decelerates alike. */
export const EASE = 'cubic-bezier(.22,1,.36,1)'

/**
 * Honours the OS "reduce motion" setting, and keeps honouring it if the viewer
 * changes it while the page is open. Every animated component here checks it and
 * renders its final state immediately rather than animating to it.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return reduced
}

/**
 * True one frame after mount. Animating from a CSS value set in the same commit
 * as the element's creation does nothing — the browser has no previous value to
 * interpolate from — so the "from" state must be painted first.
 */
function useAfterMount(enabled = true) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!enabled) { setOn(true); return }
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)))
    return () => cancelAnimationFrame(r)
  }, [enabled])
  return on
}

/**
 * A number that counts to its value.
 *
 * Decimals are kept: the dashboard shows average study hours, and rounding 0.3
 * to an integer prints a confident "0" for a figure that is not zero.
 */
export function Num({ value, decimals = 0, duration = 900 }: {
  value: number; decimals?: number; duration?: number
}) {
  const reduced = useReducedMotion()
  const [n, setN] = useState(reduced ? value : 0)
  const from = useRef(0)

  useEffect(() => {
    if (reduced) { setN(value); return }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(a + (value - a) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduced])

  return (
    <span className="tnum">
      {decimals > 0
        ? n.toFixed(decimals)
        : Math.round(n).toLocaleString('en-IN')}
    </span>
  )
}

/**
 * Activity over time.
 *
 * The line draws left-to-right on mount — the direction time is read — and then
 * stops. Hovering gives a crosshair and the exact value, because an area chart
 * without one makes the reader estimate off a grid line.
 */
export function AreaChart({ series, height = 230, color = '#2a78d6', suffix = '', ariaLabel }: {
  series: { label: string; value: number | null }[]
  height?: number; color?: string; suffix?: string; ariaLabel?: string
}) {
  const id = useId()
  const reduced = useReducedMotion()
  const drawn = useAfterMount(!reduced)
  const [hover, setHover] = useState<number | null>(null)

  const w = 680, h = height, padL = 38, padB = 28, padT = 14, padR = 14
  const vals = series.map((s) => s.value).filter((v): v is number => v != null)
  // A flat-zero series would divide by zero and draw along the axis; a floor of 1
  // keeps the geometry valid while the chart still honestly reads zero.
  const max = Math.max(...vals, 1)
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const x = (i: number) => padL + (i / Math.max(1, series.length - 1)) * innerW
  const y = (v: number) => padT + innerH - (v / max) * innerH

  let line = ''
  series.forEach((s, i) => {
    if (s.value == null) { line += ' '; return }
    const prev = series[i - 1]
    const cmd = !prev || prev.value == null ? 'M' : 'L'
    line += cmd + x(i).toFixed(1) + ',' + y(s.value).toFixed(1) + ' '
  })

  const ticks = 4
  const step = Math.max(1, Math.ceil(series.length / 7))
  const last = series.length - 1
  const hv = hover != null ? series[hover] : null

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={'0 0 ' + w + ' ' + h} width="100%" height={h}
        style={{ display: 'block', overflow: 'visible' }}
        role="img" aria-label={ariaLabel || 'Activity over time'}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const box = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
          const rel = ((e.clientX - box.left) / box.width) * w
          const i = Math.round(((rel - padL) / innerW) * Math.max(1, series.length - 1))
          setHover(Math.max(0, Math.min(series.length - 1, i)))
        }}
      >
        <defs>
          <linearGradient id={'ar' + id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.24" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          {/* The fill is revealed by a wipe that travels with the line, so the two
              arrive together instead of the area flashing in fully formed. */}
          <clipPath id={'cl' + id}>
            <rect
              x={padL} y={0} height={h}
              width={drawn ? innerW : 0}
              style={{ transition: reduced ? 'none' : 'width 1100ms ' + EASE }}
            />
          </clipPath>
        </defs>

        {/* recessive grid — present enough to read against, quiet enough to ignore */}
        {Array.from({ length: ticks + 1 }).map((_, i) => {
          const gy = padT + (i / ticks) * innerH
          return (
            <g key={i}>
              <line x1={padL} y1={gy} x2={w - padR} y2={gy} stroke={S.hair} strokeWidth="1" />
              <text x={padL - 8} y={gy + 3.5} fontSize="10" fill={S.faint} textAnchor="end" fontWeight="700">
                {Math.round(max - (i / ticks) * max)}
              </text>
            </g>
          )
        })}

        {line.trim() !== '' && (
          <g clipPath={'url(#cl' + id + ')'}>
            <path
              d={line + ' L' + x(last) + ',' + (padT + innerH) + ' L' + padL + ',' + (padT + innerH) + ' Z'}
              fill={'url(#ar' + id + ')'}
            />
            <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )}

        {/* the endpoint is emphasised — "where we are now" is read first. It fades
            in once the line has reached it, not before. */}
        {series[last] && series[last].value != null && (
          <circle
            cx={x(last)} cy={y(series[last].value as number)} r="4.5"
            fill={color} stroke={S.card} strokeWidth="2"
            opacity={drawn ? 1 : 0}
            style={{ transition: reduced ? 'none' : 'opacity 300ms ' + EASE + ' 850ms' }}
          />
        )}

        {hv && hv.value != null && (
          <g pointerEvents="none">
            <line
              x1={x(hover as number)} y1={padT} x2={x(hover as number)} y2={padT + innerH}
              stroke={color} strokeWidth="1" strokeDasharray="3 3" opacity="0.55"
            />
            <circle cx={x(hover as number)} cy={y(hv.value)} r="5.5" fill={color} stroke={S.card} strokeWidth="2" />
          </g>
        )}

        {series.map((s, i) => (i % step === 0 || i === last ? (
          <text key={i} x={x(i)} y={h - 9} fontSize="10" fill={S.faint} textAnchor="middle" fontWeight="700">
            {s.label}
          </text>
        ) : null))}
      </svg>

      {hv && hv.value != null && (
        <div style={{
          position: 'absolute', top: 2,
          left: ((x(hover as number) / w) * 100) + '%', transform: 'translateX(-50%)',
          background: S.ink, color: S.card, borderRadius: 8, padding: '5px 9px',
          fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {hv.label} · {hv.value}{suffix}
        </div>
      )}
    </div>
  )
}

/**
 * Part-to-whole across ordered states.
 *
 * Each arc sweeps to its share on mount, one after another, so the ring is read
 * as it is built. Segments are separated by a small surface gap so adjacent
 * fills never merge, and every segment is named in the legend with its own
 * count — colour is never the only thing carrying identity.
 */
export function SegmentDonut({ segments, size = 168, centerValue, centerLabel }: {
  segments: { label: string; value: number; color: string }[]
  size?: number; centerValue?: string; centerLabel?: string
}) {
  const reduced = useReducedMotion()
  const drawn = useAfterMount(!reduced)
  const [hover, setHover] = useState<number | null>(null)

  const total = segments.reduce((sum, x) => sum + x.value, 0)
  const stroke = 18
  const r = size / 2 - stroke / 2 - 2
  const c = 2 * Math.PI * r
  const nonEmpty = segments.filter((s) => s.value > 0).length
  const GAP = nonEmpty > 1 ? 3 : 0

  let acc = 0
  const arcs = segments.map((seg, i) => {
    const frac = total > 0 ? seg.value / total : 0
    const len = Math.max(0, frac * c - GAP)
    const shown = drawn ? len : 0
    const node = (
      <circle
        key={seg.label}
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={seg.color}
        strokeWidth={hover === i ? stroke + 3 : stroke}
        strokeDasharray={shown + ' ' + (c - shown)}
        strokeDashoffset={-acc}
        transform={'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'}
        onMouseEnter={() => setHover(i)}
        onMouseLeave={() => setHover(null)}
        style={{
          transition: reduced
            ? 'stroke-width .18s'
            : 'stroke-dasharray 780ms ' + EASE + ' ' + (i * 130) + 'ms, stroke-width .18s ' + EASE,
        }}
      />
    )
    acc += frac * c
    return node
  })

  const active = hover != null ? segments[hover] : null

  return (
    <div className="col" style={{ alignItems: 'center', gap: 14 }}>
      <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} role="img"
        aria-label={segments.map((s) => s.label + ': ' + s.value).join(', ')}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={S.hair} strokeWidth={stroke} />
        {total > 0 && arcs}
        <text x="50%" y="47%" textAnchor="middle" fontSize={size * 0.2} fontWeight="900" fill={S.ink} className="tnum">
          {active ? active.value : (centerValue != null ? centerValue : total)}
        </text>
        <text x="50%" y="63%" textAnchor="middle" fontSize={size * 0.082} fontWeight="700" fill={S.muted}>
          {active ? active.label : (centerLabel || 'total')}
        </text>
      </svg>

      <div className="col" style={{ gap: 7, width: '100%' }}>
        {segments.map((s, i) => (
          <div
            key={s.label} className="row between dash-legend"
            style={{ alignItems: 'center', gap: 10, opacity: hover == null || hover === i ? 1 : 0.5 }}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
          >
            <span className="row gap-8" style={{ alignItems: 'center', minWidth: 0 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flex: '0 0 auto' }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: S.sub }}>{s.label}</span>
            </span>
            <span className="tnum" style={{ fontSize: 12.5, fontWeight: 800, color: S.ink }}>
              {s.value}{total > 0 ? ' · ' + Math.round((s.value / total) * 100) + '%' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * One labelled metric bar. Fills from zero on mount, staggered against its
 * neighbours so three bars read as a sequence rather than a jolt. The label and
 * value are always visible text.
 */
export function MetricBar({ label, value, color, note, index = 0 }: {
  label: string; value: number | null; color: string; note?: string; index?: number
}) {
  const reduced = useReducedMotion()
  const filled = useAfterMount(!reduced)
  const has = value != null
  const pct = has ? Math.min(100, Math.max(0, value as number)) : 0

  return (
    <div style={{ marginBottom: 15 }}>
      <div className="row between" style={{ marginBottom: 6, alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontWeight: 650, fontSize: 13, color: S.sub }}>{label}</span>
        <span className="tnum" style={{ fontWeight: 800, fontSize: 13, color: has ? S.ink : S.faint }}>
          {has ? <><Num value={Math.round(value as number)} />%</> : 'No data yet'}
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: 'var(--hair)', overflow: 'hidden' }}>
        <div style={{
          width: (filled ? pct : 0) + '%',
          height: '100%', borderRadius: 99, background: color,
          transition: reduced ? 'none' : 'width 820ms ' + EASE + ' ' + (index * 110) + 'ms',
        }} />
      </div>
      {note && <div style={{ fontSize: 11.5, color: S.faint, marginTop: 4 }}>{note}</div>}
    </div>
  )
}
