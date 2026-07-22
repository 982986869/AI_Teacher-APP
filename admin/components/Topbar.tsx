'use client'

import { usePathname } from 'next/navigation'
import { NAV } from './nav'
import { S } from '@/lib/theme'
import { ThemeToggle } from './ThemeToggle'

const TITLES: Record<string, string> = Object.fromEntries(
  NAV.flatMap((g) => g.items).map((i) => [i.href, i.label]),
)

export function Topbar() {
  const pathname = usePathname()
  const base = '/' + (pathname.split('/')[1] || '')
  const title = TITLES[base] || 'Admin'
  return (
    <header className="topbar">
      <div className="col" style={{ gap: 0 }}>
        <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, color: S.faint, textTransform: 'uppercase' }}>
          Operations Console
        </span>
        <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: -0.3 }}>{title}</span>
      </div>
      <div className="spacer" />
      <ThemeToggle />
    </header>
  )
}
