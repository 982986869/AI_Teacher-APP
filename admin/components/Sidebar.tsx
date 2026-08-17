'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, GraduationCap, X } from 'lucide-react'
import { NAV } from './nav'
import { useAuth } from '@/lib/auth'
import { initials, colorFor } from '@/lib/format'

// Shared, permission-filtered nav list used by both the desktop sidebar and the mobile
// drawer, so the two never drift.
function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { can } = useAuth()
  return (
    <nav className="nav">
      {NAV.map((group) => {
        const items = group.items.filter((i) => can(i.perm))
        if (!items.length) return null
        return (
          <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {items.map((it) => {
              const active = pathname === it.href || pathname.startsWith(it.href + '/')
              return (
                <Link key={it.href} href={it.href} className={`nav-item ${active ? 'active' : ''}`} onClick={onNavigate}>
                  <it.icon size={18} strokeWidth={active ? 2.5 : 2.1} />
                  {it.label}
                </Link>
              )
            })}
          </div>
        )
      })}
    </nav>
  )
}

function Brand() {
  return (
    <div className="sidebar-brand">
      <span className="sidebar-logo"><GraduationCap size={20} /></span>
      <span className="sidebar-word">Ailernova<small>Admin</small></span>
    </div>
  )
}

function Foot() {
  const { admin, logout } = useAuth()
  if (!admin) return null
  return (
    <div className="sidebar-foot">
      <div className="row gap-10" style={{ padding: '4px 6px' }}>
        <span className="avatar" style={{ background: colorFor(admin.id) }}>{initials(admin.name)}</span>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="truncate" style={{ fontWeight: 800, fontSize: 13 }}>{admin.name}</div>
          <div className="truncate" style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 700 }}>{admin.roleLabel}</div>
        </div>
        <button className="btn btn-ghost icon-btn" onClick={logout} title="Sign out" aria-label="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}

// Desktop rail — sticky, quiet, always present ≥1024px.
export function Sidebar() {
  const { admin } = useAuth()
  if (!admin) return null
  return (
    <aside className="sidebar">
      <Brand />
      <NavList />
      <Foot />
    </aside>
  )
}

// Mobile drawer — same nav, slides in from the left over a scrim (<1024px).
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <>
      <div className="nav-scrim" onClick={onClose} />
      <aside className="nav-drawer" role="dialog" aria-label="Navigation">
        <div className="row between" style={{ paddingRight: 12 }}>
          <Brand />
          <button className="btn btn-ghost icon-btn" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
        </div>
        <NavList onNavigate={onClose} />
        <Foot />
      </aside>
    </>
  )
}
