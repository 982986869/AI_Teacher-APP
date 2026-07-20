import {
  LayoutDashboard, UsersRound, BookOpen, Bot, BarChart3, Megaphone, Settings,
  ScrollText, LineChart as LineChartIcon, GraduationCap, HeartHandshake, type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/lib/types'

export interface NavItem { label: string; href: string; icon: LucideIcon; perm: Permission }
export interface NavGroup { label: string; items: NavItem[] }

// Calm, grouped navigation — only major product areas are visible. Secondary flows
// (individual students, a parent's linked child, a single setting) live INSIDE their
// module, reached by drilling in — never as top-level nav noise. Each area owns a
// complete flow: landing → collection → detail.
export const NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, perm: 'dashboard.view' }],
  },
  {
    label: 'People',
    items: [{ label: 'People', href: '/people', icon: UsersRound, perm: 'users.view' }],
  },
  {
    label: 'Learning',
    items: [
      { label: 'Content', href: '/cms', icon: BookOpen, perm: 'content.view' },
      { label: 'AI Teacher', href: '/ai-teacher', icon: Bot, perm: 'aiteacher.view' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Reports', href: '/reports', icon: BarChart3, perm: 'reports.view' },
      { label: 'Analytics', href: '/analytics', icon: LineChartIcon, perm: 'reports.view' },
      { label: 'Announcements', href: '/announcements', icon: Megaphone, perm: 'announcements.view' },
      { label: 'Settings', href: '/settings', icon: Settings, perm: 'settings.view' },
    ],
  },
  {
    label: 'System',
    items: [{ label: 'Audit Logs', href: '/audit', icon: ScrollText, perm: 'audit.view' }],
  },
]

// Human page titles + parent trail for the product-bar breadcrumb. Static routes map
// directly; dynamic detail routes resolve their crumb from the section + a live label.
export const ROUTE_META: Record<string, { title: string; parent?: string }> = {
  '/dashboard': { title: 'Dashboard' },
  '/people': { title: 'People' },
  '/people/students': { title: 'Students', parent: '/people' },
  '/people/parents': { title: 'Parents', parent: '/people' },
  '/people/team': { title: 'Team', parent: '/people' },
  '/cms': { title: 'Content' },
  '/content': { title: 'Content' },
  '/ai-teacher': { title: 'AI Teacher' },
  '/reports': { title: 'Reports' },
  '/analytics': { title: 'Analytics' },
  '/announcements': { title: 'Announcements' },
  '/settings': { title: 'Settings' },
  '/audit': { title: 'Audit Logs' },
}

export const PEOPLE_AREAS = [
  { key: 'students', label: 'Students', href: '/people/students', icon: GraduationCap, tone: 'indigo' as const, blurb: 'Learners, progress and account actions' },
  { key: 'parents', label: 'Parents', href: '/people/parents', icon: HeartHandshake, tone: 'emerald' as const, blurb: 'Guardians and their linked children' },
  { key: 'team', label: 'Team', href: '/people/team', icon: UsersRound, tone: 'purple' as const, blurb: 'Admins and staff with portal access' },
]
