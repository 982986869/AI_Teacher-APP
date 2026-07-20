'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { CircleAlert, Inbox, Loader2, RotateCw, ChevronRight, type LucideIcon } from 'lucide-react'
import { S, STATUS_TONE, accent, type AccentKey } from '@/lib/theme'

// ─── Section header (signature accent dot + bold title) ────────────────────────
export function SectionHead({ title, tone = 'indigo', right }: { title: string; tone?: AccentKey; right?: ReactNode }) {
  return (
    <div className="card-head">
      <span className="section-dot" style={{ background: accent(tone).color }} />
      <span className="h2">{title}</span>
      {right && <span className="ml-auto">{right}</span>}
    </div>
  )
}

// ─── Icon chip (soft-tint rounded square with a lucide icon) ───────────────────
export function IconChip({ icon: Icon, tone = 'indigo', size = 38 }: { icon: LucideIcon; tone?: AccentKey; size?: number }) {
  const a = accent(tone)
  return (
    <span className="chip" style={{ width: size, height: size, background: a.soft, borderRadius: size >= 38 ? 12 : 10 }}>
      <Icon size={size * 0.46} color={a.color} strokeWidth={2.3} />
    </span>
  )
}

// ─── Badge / status pill ───────────────────────────────────────────────────────
export function Badge({ children, tone, dot = true }: { children: ReactNode; tone?: AccentKey; dot?: boolean }) {
  const t = tone || (typeof children === 'string' ? STATUS_TONE[children.toLowerCase()] : undefined) || 'indigo'
  const a = accent(t)
  return (
    <span className="badge" style={{ background: a.soft, color: a.color }}>
      {dot && <span className="dot" style={{ background: a.color }} />}
      {children}
    </span>
  )
}

// ─── Count-up number (mounts from 0 → value) ───────────────────────────────────
export function CountUp({ value, duration = 700 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (value === 0) { setN(0); return }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <span className="dcountup">{n.toLocaleString('en-IN')}</span>
}

// ─── Stat card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, tone = 'indigo', label, value, suffix, delta, sub }: {
  icon: LucideIcon; tone?: AccentKey; label: string; value: number | string | null
  suffix?: string; delta?: { dir: 'up' | 'down'; text: string }; sub?: string
}) {
  const a = accent(tone)
  return (
    <div className="stat">
      <span className="chip" style={{ background: a.soft }}>
        <Icon size={18} color={a.color} strokeWidth={2.4} />
      </span>
      <div className="value" style={{ color: S.ink }}>
        {value === null || value === undefined ? '—' : typeof value === 'number' ? <CountUp value={value} /> : value}
        {suffix && value !== null ? <span style={{ fontSize: 16, color: S.muted }}>{suffix}</span> : null}
      </div>
      <div className="label">{label}</div>
      {delta && <div className={`delta ${delta.dir}`}>{delta.text}</div>}
      {sub && <div className="delta" style={{ color: S.faint }}>{sub}</div>}
    </div>
  )
}

// ─── Loading / skeleton primitives ─────────────────────────────────────────────
export function Skel({ w = '100%', h = 14, r = 8, style }: { w?: number | string; h?: number; r?: number; style?: React.CSSProperties }) {
  return <div className="sk" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="spin" />
}

// A skeleton table body that mirrors the real layout while loading.
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ padding: '6px 14px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="row gap-16" style={{ padding: '13px 0', borderBottom: '1px solid var(--hair)' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skel key={j} w={j === 0 ? 180 : `${Math.max(40, 120 - j * 14)}px`} h={12} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Empty & error states ──────────────────────────────────────────────────────
export function EmptyState({ icon: Icon = Inbox, title, message, action }: {
  icon?: LucideIcon; title: string; message?: string; action?: ReactNode
}) {
  return (
    <div className="state">
      <span className="state-icon"><Icon size={30} color={S.faint} strokeWidth={2} /></span>
      <div className="state-title">{title}</div>
      {message && <div className="state-msg">{message}</div>}
      {action && <div className="state-actions">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="state">
      <span className="state-icon"><CircleAlert size={30} color={S.muted} strokeWidth={2} /></span>
      <div className="state-title">Something went wrong</div>
      <div className="state-msg">{message || 'Check your connection and try again.'}</div>
      {onRetry && (
        <div className="state-actions">
          <button className="btn btn-primary sm" onClick={onRetry}><RotateCw size={14} /> Retry</button>
        </div>
      )}
    </div>
  )
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────
export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return <div className={`card ${className}`} style={style}>{children}</div>
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────
export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" className={`toggle ${on ? 'on' : ''}`} disabled={disabled}
      onClick={() => !disabled && onChange(!on)} aria-pressed={on}>
      <span className="knob" />
    </button>
  )
}

// ─── Page hero (module landing header — greeting/title + purpose + primary action) ──
// The calm, editorial page header the Student/Parent apps open with: an optional small
// eyebrow, a large friendly title, one short purpose sentence, and room for a primary
// action on the right. Replaces the dense "page-head" template block.
export function PageHero({ eyebrow, title, subtitle, actions }: {
  eyebrow?: ReactNode; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode
}) {
  return (
    <header className="page-hero">
      <div className="grow" style={{ minWidth: 0 }}>
        {eyebrow && <div className="hero-eyebrow">{eyebrow}</div>}
        <h1 className="hero-title">{title}</h1>
        {subtitle && <p className="hero-sub">{subtitle}</p>}
      </div>
      {actions && <div className="hero-actions">{actions}</div>}
    </header>
  )
}

// ─── Editorial section label (uppercase tracked label + hairline rule) ─────────
// Mirrors the Parent app's `Label` — the signature section divider across Ailernova.
export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="section-label">
      <span className="section-label-text">{children}</span>
      <span className="section-label-rule" />
      {right && <span className="section-label-right">{right}</span>}
    </div>
  )
}

// ─── Primary insight (one large, calm, actionable statement — not a metric wall) ──
export function Insight({ tone = 'indigo', icon: Icon, value, title, note, action }: {
  tone?: AccentKey; icon?: LucideIcon; value: ReactNode; title: ReactNode; note?: ReactNode; action?: ReactNode
}) {
  const a = accent(tone)
  return (
    <div className="insight" style={{ background: a.soft }}>
      {Icon && <span className="insight-icon" style={{ background: '#fff' }}><Icon size={22} color={a.color} strokeWidth={2.3} /></span>}
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="insight-value" style={{ color: a.color }}>{value}</div>
        <div className="insight-title">{title}</div>
        {note && <div className="insight-note">{note}</div>}
      </div>
      {action && <div className="insight-action">{action}</div>}
    </div>
  )
}

// ─── Mini stat (small inline metric — icon chip + value + label, no card wall) ──
export function MiniStat({ icon: Icon, tone = 'indigo', label, value, suffix }: {
  icon: LucideIcon; tone?: AccentKey; label: string; value: number | string | null; suffix?: string
}) {
  const a = accent(tone)
  return (
    <div className="mini-stat">
      <span className="mini-stat-chip" style={{ background: a.soft }}><Icon size={16} color={a.color} strokeWidth={2.4} /></span>
      <div style={{ minWidth: 0 }}>
        <div className="mini-stat-value">
          {value === null || value === undefined ? '—' : typeof value === 'number' ? <CountUp value={value} /> : value}
          {suffix && value !== null && value !== undefined ? <span className="mini-stat-suffix">{suffix}</span> : null}
        </div>
        <div className="mini-stat-label">{label}</div>
      </div>
    </div>
  )
}

// ─── Breadcrumb (People / Students / Aarav Sharma) ─────────────────────────────
export function Breadcrumb({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.map((c, i) => (
        <span key={i} className="crumb">
          {c.href && i < trail.length - 1
            ? <Link href={c.href} className="crumb-link">{c.label}</Link>
            : <span className={i === trail.length - 1 ? 'crumb-current' : 'crumb-link'}>{c.label}</span>}
          {i < trail.length - 1 && <ChevronRight size={13} className="crumb-sep" />}
        </span>
      ))}
    </nav>
  )
}

// ─── Pending / not-yet-built banner (honest signalling) ────────────────────────
export function PendingBanner({ title, message }: { title: string; message: string }) {
  return (
    <div className="card" style={{ background: S.goldSoft, borderColor: '#F3E1B5' }}>
      <div className="row gap-12">
        <span className="chip" style={{ background: '#fff', width: 40, height: 40, borderRadius: 12, flexShrink: 0 }}>
          <CircleAlert size={19} color={S.gold} strokeWidth={2.4} />
        </span>
        <div>
          <div style={{ fontWeight: 900, color: '#8A5A16' }}>{title}</div>
          <div style={{ fontSize: 13, color: '#9A6A22', fontWeight: 600, marginTop: 2 }}>{message}</div>
        </div>
      </div>
    </div>
  )
}
