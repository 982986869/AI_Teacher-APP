'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  RefreshCw, ArrowRight, GraduationCap, Users, BookOpenCheck, FileClock, FilePlus2,
  ClipboardCheck, CircleCheck, Activity as ActivityIcon, HeartPulse,
} from 'lucide-react'
import { useDashboard } from '@/components/dashboard/useDashboard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { LineChart } from '@/components/charts'
import { PageHero, SectionLabel, Insight, MiniStat, Card, SectionHead, Skel, ErrorState, EmptyState } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { fmtDate } from '@/lib/format'
import { S } from '@/lib/theme'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

// One clean labelled progress bar for the learning-health card.
function HealthBar({ label, value, tone }: { label: string; value: number | null; tone: string }) {
  const has = value !== null && value !== undefined
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="row between" style={{ marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: S.sub }}>{label}</span>
        <span className="tnum" style={{ fontWeight: 800, fontSize: 13, color: has ? S.ink : S.faint }}>{has ? `${Math.round(value!)}%` : 'Not enough data'}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'var(--hair)', overflow: 'hidden' }}>
        <div style={{ width: `${has ? Math.min(100, value!) : 0}%`, height: '100%', borderRadius: 4, background: tone, transition: 'width .6s cubic-bezier(0.22,1,0.36,1)' }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { admin } = useAuth()
  const { data, loading, error, reload, lastUpdated } = useDashboard()

  // Keyboard "R" to refresh — a quiet power-user affordance.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey && !(e.target as HTMLElement)?.closest('input,textarea')) reload()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reload])

  const firstName = (admin?.name || '').split(' ')[0]

  if (loading && !data) {
    return (
      <>
        <PageHero eyebrow={fmtDate(new Date().toISOString())} title={`${greeting()}, ${firstName}`} subtitle="Here's what's happening across Ailernova today." />
        <Skel h={92} r={24} style={{ marginBottom: 20 }} />
        <div className="flow three" style={{ marginBottom: 24 }}>{[0, 1, 2].map((i) => <Skel key={i} h={72} r={16} />)}</div>
        <Skel h={260} r={20} />
      </>
    )
  }
  if (error && !data) {
    return (
      <>
        <PageHero title={`${greeting()}, ${firstName}`} />
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      </>
    )
  }
  if (!data) return null

  const { overview, aiTeacher, brainGym, practice, content, activity, trends } = data

  // Attention queue — built ONLY from real fields, only shown when > 0. No invented numbers.
  const attn = [
    content.draftContent != null && content.draftContent > 0
      ? { icon: FileClock, tone: S.gold, count: content.draftContent, title: 'Drafts awaiting review', sub: 'Content saved but not yet published', href: '/cms' } : null,
    aiTeacher.pendingReview > 0
      ? { icon: ClipboardCheck, tone: S.purple, count: aiTeacher.pendingReview, title: 'AI lessons pending review', sub: 'Generated lessons waiting on a reviewer', href: '/ai-teacher' } : null,
    content.missingContent > 0
      ? { icon: FilePlus2, tone: S.orange, count: content.missingContent, title: 'Chapters missing content', sub: 'Chapters with no notes or questions yet', href: '/cms' } : null,
  ].filter(Boolean) as { icon: any; tone: string; count: number; title: string; sub: string; href: string }[]

  const primary = attn[0]
  const spark = trends.activeUsers.map((p) => ({ label: p.date.slice(5), value: p.count }))

  return (
    <>
      <PageHero
        eyebrow={fmtDate(new Date().toISOString())}
        title={`${greeting()}, ${firstName}`}
        subtitle="A calm view of what needs you today — and how learning is going."
        actions={
          <button className="btn btn-ghost sm" onClick={reload} title="Refresh (R)">
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        }
      />

      {/* Primary insight — the single most pressing thing, or a calm all-clear. */}
      {primary ? (
        <Insight
          tone="gold" icon={primary.icon}
          value={primary.count}
          title={primary.title}
          note={primary.sub}
          action={<Link href={primary.href} className="btn btn-primary sm">Review <ArrowRight size={14} /></Link>}
        />
      ) : (
        <Insight
          tone="emerald" icon={CircleCheck}
          value="All clear"
          title="Nothing needs your attention right now"
          note="No drafts, review queues or content gaps are open."
        />
      )}

      {/* A few meaningful numbers — not a wall of cards. */}
      <div className="flow three" style={{ marginTop: 18 }}>
        <MiniStat icon={GraduationCap} tone="indigo" label="New students this week" value={overview.newRegistrationsWeek} />
        <MiniStat icon={Users} tone="blue" label="Active this week" value={overview.activeThisWeek} />
        <MiniStat icon={BookOpenCheck} tone="emerald" label="Lessons completed" value={aiTeacher.lessonsCompleted} />
      </div>

      {/* Active learners trend — one clean chart. */}
      <SectionLabel>Active learners · last {spark.length} days</SectionLabel>
      <Card>
        {spark.some((p) => (p.value || 0) > 0)
          ? <LineChart series={spark} tone="indigo" height={200} />
          : <EmptyState icon={ActivityIcon} title="No activity in this window" message="Daily active learners will chart here as students return." />}
      </Card>

      <div className="split" style={{ marginTop: 24 }}>
        {/* Recent activity */}
        <Card>
          <SectionHead title="Recent activity" tone="indigo" right={<Link href="/reports" className="crumb-link">View reports</Link>} />
          <ActivityFeed items={activity} />
        </Card>

        {/* Learning health + attention */}
        <div className="col gap-16">
          <Card>
            <SectionHead title="Learning health" tone="emerald" />
            <HealthBar label="Lesson completion" value={aiTeacher.averageCompletion} tone={S.emerald} />
            <HealthBar label="Brain Gym accuracy" value={brainGym.averageAccuracy} tone={S.orange} />
            <HealthBar label="Practice average score" value={practice.averageScore} tone={S.blue} />
          </Card>

          <Card>
            <SectionHead title="Attention required" tone="gold" right={<HeartPulse size={15} color={S.faint} />} />
            {attn.length ? attn.map((a, i) => (
              <Link key={i} href={a.href} className="attn-row" style={{ textDecoration: 'none' }}>
                <span className="attn-icon" style={{ background: a.tone + '1f' }}><a.icon size={18} color={a.tone} strokeWidth={2.3} /></span>
                <div className="attn-body">
                  <div className="attn-title">{a.title}</div>
                  <div className="attn-sub">{a.sub}</div>
                </div>
                <span className="attn-count tnum">{a.count}</span>
              </Link>
            )) : (
              <div className="row gap-10" style={{ padding: '8px 4px', color: S.muted, fontWeight: 700, fontSize: 13 }}>
                <CircleCheck size={17} color={S.emerald} /> Everything's in order.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <SectionLabel>Quick actions</SectionLabel>
      <Card><QuickActions /></Card>
    </>
  )
}
