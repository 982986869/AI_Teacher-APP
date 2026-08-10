'use client'

import { useState } from 'react'
import { Sidebar, MobileNav } from './Sidebar'
import { ProductBar } from './Topbar'

// Owns the one piece of shell-level state (the mobile drawer) and lays out the frame:
// quiet desktop rail + slim product bar + a breathing content column.
export function Shell({ children, supportUnread = 0 }: { children: React.ReactNode; supportUnread?: number }) {
  const [navOpen, setNavOpen] = useState(false)
  return (
    <div className="shell">
      <Sidebar supportUnread={supportUnread} />
      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} supportUnread={supportUnread} />
      <div className="main">
        <ProductBar onMenu={() => setNavOpen(true)} />
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
