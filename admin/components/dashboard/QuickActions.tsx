'use client'

import { useRouter } from 'next/navigation'
import { FolderPlus, Layers, Megaphone, Upload, Users, type LucideIcon } from 'lucide-react'
import { accent, type AccentKey } from '@/lib/theme'
import { useAuth } from '@/lib/auth'
import type { Permission } from '@/lib/types'

interface Action { label: string; sub: string; icon: LucideIcon; tone: AccentKey; href: string; perm: Permission }

// Each action deep-links into the module that owns it. Actions are hidden when the
// signed-in role lacks the permission, so support/analyst never see write shortcuts.
const ACTIONS: Action[] = [
  { label: 'Add Subject', sub: 'Content', icon: FolderPlus, tone: 'indigo', href: '/content', perm: 'content.edit' },
  { label: 'Add Chapter', sub: 'Content', icon: Layers, tone: 'blue', href: '/content', perm: 'content.edit' },
  { label: 'Create Announcement', sub: 'Broadcast', icon: Megaphone, tone: 'purple', href: '/announcements', perm: 'announcements.edit' },
  { label: 'Upload Resources', sub: 'Content', icon: Upload, tone: 'emerald', href: '/content', perm: 'content.edit' },
  { label: 'Manage Users', sub: 'People', icon: Users, tone: 'orange', href: '/users', perm: 'users.view' },
]

export function QuickActions() {
  const router = useRouter()
  const { can } = useAuth()
  const actions = ACTIONS.filter((a) => can(a.perm))
  if (!actions.length) return null
  return (
    <div className="qa-grid">
      {actions.map((a) => {
        const c = accent(a.tone)
        return (
          <button key={a.label} className="qa" onClick={() => router.push(a.href)}>
            <span className="qa-chip" style={{ background: c.soft }}><a.icon size={17} color={c.color} strokeWidth={2.4} /></span>
            <div className="col" style={{ gap: 0 }}>
              <span className="qa-label">{a.label}</span>
              <span className="qa-sub">{a.sub}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
