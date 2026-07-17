'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { initials, colorFor } from '@/lib/format'

// A single airy person row — avatar, name, a quiet sub-line, right-aligned meta badges
// and a relative timestamp. The whole row is one link into the full profile page.
export function PersonRow({ href, seed, name, sub, right, when }: {
  href: string; seed: string; name: string; sub?: ReactNode; right?: ReactNode; when?: string
}) {
  return (
    <Link href={href} className="person-row">
      <span className="avatar" style={{ background: colorFor(seed), width: 40, height: 40, borderRadius: 12, fontSize: 14 }}>{initials(name)}</span>
      <div className="pr-main">
        <div className="pr-name truncate">{name}</div>
        {sub != null && <div className="pr-sub truncate">{sub}</div>}
      </div>
      <div className="pr-meta">
        {right}
        {when && <span className="pr-when">{when}</span>}
        <ChevronRight size={16} className="pr-chev" />
      </div>
    </Link>
  )
}

// Pill segmented control for a small set of filters (All / Linked / Unlinked, etc.).
export function Segmented({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div className="tabs">
      {options.map((o) => (
        <button key={o.value} className={`tab ${value === o.value ? 'active' : ''}`} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

// Server-paginated footer — "N total · Page X of Y" with Prev/Next.
export function Pager({ page, totalPages, total, onPage }: {
  page: number; totalPages: number; total: number; onPage: (p: number) => void
}) {
  if (!total) return null
  return (
    <div className="pagination">
      <span className="info">{total.toLocaleString('en-IN')} total · Page {page} of {Math.max(1, totalPages)}</span>
      <span className="ml-auto row gap-8">
        <button className="btn btn-ghost sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={14} /> Prev</button>
        <button className="btn btn-ghost sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next <ChevronRight size={14} /></button>
      </span>
    </div>
  )
}
