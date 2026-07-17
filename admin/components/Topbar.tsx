'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search, Bell, ChevronDown, LogOut, CheckCheck } from 'lucide-react'
import { ROUTE_META } from './nav'
import { useAuth } from '@/lib/auth'
import { initials, colorFor } from '@/lib/format'
import { Breadcrumb } from './ui'
import { ThemeToggle } from './ThemeToggle'

// Walk the path, collecting a crumb for every prefix we have a human title for.
function crumbsFor(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  let acc = ''
  const trail: { label: string; href?: string }[] = []
  for (const p of parts) {
    acc += '/' + p
    const meta = ROUTE_META[acc]
    if (meta) trail.push({ label: meta.title, href: acc })
  }
  return trail.length ? trail : [{ label: 'Admin' }]
}

export function ProductBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { admin, logout } = useAuth()
  const [q, setQ] = useState('')
  const [menu, setMenu] = useState<null | 'profile' | 'bell'>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMenu(null) }, [pathname])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    router.push(term ? `/people/students?q=${encodeURIComponent(term)}` : '/people/students')
  }

  return (
    <header className="product-bar" ref={wrapRef}>
      <button className="pb-icon-btn pb-menu" onClick={onMenu} aria-label="Open menu"><Menu size={18} /></button>
      <Breadcrumb trail={crumbsFor(pathname)} />

      <form className="pb-search" onSubmit={submit} role="search">
        <Search size={15} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search students…"
          aria-label="Search students"
        />
      </form>

      <button className="pb-icon-btn" onClick={() => setMenu(menu === 'bell' ? null : 'bell')} aria-label="Notifications">
        <Bell size={17} />
      </button>

      <button className="pb-profile" onClick={() => setMenu(menu === 'profile' ? null : 'profile')} aria-label="Account">
        <span className="avatar" style={{ background: colorFor(admin?.id || ''), width: 30, height: 30, borderRadius: 9, fontSize: 12 }}>
          {initials(admin?.name)}
        </span>
        <span className="who"><b>{(admin?.name || '').split(' ')[0]}</b><small>{admin?.roleLabel}</small></span>
        <ChevronDown size={15} color="var(--faint)" />
      </button>

      {menu && <div className="scrim" onClick={() => setMenu(null)} />}

      {menu === 'bell' && (
        <div className="pop" role="menu">
          <div className="pop-head" style={{ fontWeight: 900, fontSize: 13 }}>Notifications</div>
          <div className="state" style={{ padding: '30px 20px' }}>
            <span className="state-icon" style={{ width: 52, height: 52, borderRadius: 16 }}><CheckCheck size={22} color="var(--faint)" /></span>
            <div className="state-title" style={{ fontSize: 14 }}>You're all caught up</div>
            <div className="state-msg" style={{ fontSize: 12.5 }}>New activity shows up here as it happens.</div>
          </div>
        </div>
      )}

      {menu === 'profile' && (
        <div className="pop" role="menu">
          <div className="pop-head">
            <div style={{ fontWeight: 900, fontSize: 13.5 }}>{admin?.name}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>{admin?.email}</div>
          </div>
          <div className="row between pop-item" style={{ cursor: 'default' }} onClick={(e) => e.stopPropagation()}>
            <span>Appearance</span><ThemeToggle />
          </div>
          <Link href="/settings" className="pop-item" role="menuitem">Settings</Link>
          <button className="pop-item" onClick={logout} role="menuitem" style={{ color: 'var(--red)' }}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </header>
  )
}
