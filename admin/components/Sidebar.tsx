'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, GraduationCap } from 'lucide-react'
import { NAV } from './nav'
import { useAuth } from '@/lib/auth'
import { initials, colorFor } from '@/lib/format'

export function Sidebar() {
  const pathname = usePathname()
  const { admin, can, logout } = useAuth()
  if (!admin) return null

  return (
    <aside className="sidebar hide-sm">
      <div className="sidebar-brand">
        <span className="sidebar-logo"><GraduationCap size={19} /></span>
        <span className="sidebar-word">Ailernova<small>Admin Console</small></span>
      </div>

      <nav className="nav">
        {NAV.map((group) => {
          const items = group.items.filter((i) => can(i.perm))
          if (!items.length) return null
          return (
            <div key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {items.map((it) => {
                const active = pathname === it.href || pathname.startsWith(it.href + '/')
                return (
                  <Link key={it.href} href={it.href} className={`nav-item ${active ? 'active' : ''}`}>
                    <it.icon size={18} strokeWidth={active ? 2.5 : 2.1} />
                    {it.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

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
    </aside>
  )
}
