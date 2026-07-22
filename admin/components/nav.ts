import {
  LayoutDashboard, Users, BookOpen, Bot, BarChart3, Megaphone, Settings, ScrollText,
  FolderTree, UsersRound, LineChart as LineChartIcon, type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/lib/types'

export interface NavItem { label: string; href: string; icon: LucideIcon; perm: Permission }
export interface NavGroup { label: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, perm: 'dashboard.view' }],
  },
  {
    label: 'People',
    items: [
      { label: 'Users', href: '/users', icon: Users, perm: 'users.view' },
      { label: 'Parents', href: '/parents', icon: UsersRound, perm: 'users.view' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'CMS', href: '/cms', icon: FolderTree, perm: 'content.view' },
      { label: 'Content', href: '/content', icon: BookOpen, perm: 'content.view' },
      { label: 'AI Teacher', href: '/ai-teacher', icon: Bot, perm: 'aiteacher.view' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', href: '/analytics', icon: LineChartIcon, perm: 'reports.view' },
      { label: 'Reports', href: '/reports', icon: BarChart3, perm: 'reports.view' },
    ],
  },
  {
    label: 'Communications',
    items: [{ label: 'Announcements', href: '/announcements', icon: Megaphone, perm: 'announcements.view' }],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings, perm: 'settings.view' },
      { label: 'Audit Logs', href: '/audit', icon: ScrollText, perm: 'audit.view' },
    ],
  },
]
