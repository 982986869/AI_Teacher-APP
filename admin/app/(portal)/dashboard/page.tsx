'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  GraduationCap, Activity, CalendarDays, Users, School, ShieldCheck, UserPlus, Repeat,
  Bot, CircleCheck, PercentCircle, MessageCircleQuestion, TriangleAlert, Timer, ClipboardList,
  Dumbbell, Sparkles, CheckCheck, CircleX, Gauge, Flame,
  Target, ClipboardCheck, TrendingUp, TrendingDown, Swords, UsersRound, LogOut,
  BookOpen, Layers, FileText, ListChecks, FolderOpen, PackageOpen, FileWarning, FilePen, FileCheck2,
  RefreshCw, ArrowDown, Zap, RadioTower,
} from 'lucide-react'
import { useDashboard } from '@/components/dashboard/useDashboard'
import { usePullToRefresh } from '@/components/dashboard/usePullToRefresh'
import { MetricTile, MetricSkeleton, DashboardSection, ms, delta, type MetricSpec } from '@/components/dashboard/primitives'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { PlatformHealth } from '@/components/dashboard/PlatformHealth'
import { Card, SectionHead, ErrorState, Spinner, Badge } from '@/components/ui'
import { ColumnChart } from '@/components/charts'
import { useAuth } from '@/lib/auth'
import { timeAgo, fmtNum } from '@/lib/format'

export default function DashboardPage() {
  const { admin } = useAuth()
  const { data, loading, error, reload, lastUpdated } = useDashboard()
  const refresh = useCallback(() => reload(), [reload])
  const { pull, ready } = usePullToRefresh(refresh)

  // Keyboard shortcut: R refreshes (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
      if (e.key.toLowerCase() === 'r' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); refresh() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [refresh])

  // Live "updated Xs ago" — re-render every 20s.
  const [, setTick] = useState(0)
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 20000); return () => clearInterval(id) }, [])

  const refreshing = loading && !!data
  const first = admin?.name?.split(' ')[0] || 'there'

  return (
    <div className="col gap-24">
      {/* Pull-to-refresh indicator (mobile) */}
      <div className="ptr" style={{ height: pull, marginTop: pull ? -8 : 0 }}>
        {pull > 0 && (<><ArrowDown size={15} className={ready ? 'spin' : ''} style={{ transform: ready ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} /> {ready ? 'Release to refresh' : 'Pull to refresh'}</>)}
      </div>

      {/* Header */}
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="h1">Good to see you, {first}</h1>
          <div className="sub">A live pulse of the Ailernova platform — every widget is real data, or clearly marked Pending Backend.</div>
        </div>
        <div className="actions">
          <span className="updated-pill">
            <span className="live-dot" />
            {lastUpdated ? `Updated ${timeAgo(lastUpdated.toISOString())}` : 'Loading…'}
          </span>
          <button className="btn btn-ghost" onClick={refresh} disabled={loading} title="Refresh (R)">
            <RefreshCw size={15} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {error && !data ? (
        <ErrorState message={error} onRetry={refresh} />
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* 1 · Overview */}
          <DashboardSection title="Overview" tone="indigo" icon={Activity} description="Who's on the platform and how active they are">
            {metrics([
              { key: 'students', icon: GraduationCap, tone: 'indigo', label: 'Total Students', value: data.overview.totalStudents },
              { key: 'active-today', icon: Zap, tone: 'emerald', label: 'Active Today', value: data.overview.activeToday, hint: pctHint(data.overview.activeToday, data.overview.totalStudents) },
              { key: 'active-week', icon: CalendarDays, tone: 'blue', label: 'Active This Week', value: data.overview.activeThisWeek, spark: data.trends.activeUsers.map((t) => t.count) },
              { key: 'parents', icon: Users, tone: 'cyan', label: 'Parents', value: data.overview.parents },
              { key: 'teachers', icon: School, tone: 'purple', label: 'Teachers', value: data.overview.teachers },
              { key: 'admins', icon: ShieldCheck, tone: 'orange', label: 'Admins', value: data.overview.admins },
              { key: 'new', icon: UserPlus, tone: 'indigo', label: 'New Registrations', value: data.overview.newRegistrationsWeek, hint: `${fmtNum(data.overview.newRegistrationsToday)} today · 7-day`, spark: data.trends.signups.map((t) => t.count) },
              { key: 'returning', icon: Repeat, tone: 'gold', label: 'Returning Users', value: data.overview.returningUsers, hint: 'active 2 weeks running' },
            ])}
          </DashboardSection>

          {/* 2 · AI Teacher */}
          <DashboardSection title="AI Teacher" tone="purple" icon={Bot} description="Lesson generation, doubts and quality">
            {metrics([
              { key: 'lg', icon: Sparkles, tone: 'purple', label: 'Lessons Generated Today', value: data.aiTeacher.lessonsGeneratedToday },
              { key: 'lc', icon: CircleCheck, tone: 'emerald', label: 'Lessons Completed', value: data.aiTeacher.lessonsCompleted, delta: delta(data.aiTeacher.lessonsCompletedToday) },
              { key: 'ac', icon: PercentCircle, tone: 'blue', label: 'Average Completion', value: data.aiTeacher.averageCompletion, suffix: '%' },
              { key: 'doubts', icon: MessageCircleQuestion, tone: 'cyan', label: 'Doubts Asked', value: data.aiTeacher.doubtsAsked, delta: delta(data.aiTeacher.doubtsToday) },
              { key: 'fail', icon: TriangleAlert, tone: 'red', label: 'AI Failures', value: data.aiTeacher.aiFailures },
              { key: 'gen', icon: Timer, tone: 'gold', label: 'Avg Generation Time', value: ms(data.aiTeacher.avgGenerationMs) },
              { key: 'review', icon: ClipboardList, tone: 'orange', label: 'Pending Review', value: data.aiTeacher.pendingReview, hint: 'failed lessons to inspect' },
            ])}
          </DashboardSection>

          {/* 3 · Brain Gym */}
          <DashboardSection title="Brain Gym" tone="orange" icon={Dumbbell} description="Adaptive practice and the AI question pipeline">
            {metrics([
              { key: 'sess', icon: Dumbbell, tone: 'orange', label: 'Sessions Today', value: data.brainGym.sessionsToday },
              { key: 'qg', icon: Sparkles, tone: 'purple', label: 'Questions Generated', value: data.brainGym.questionsGenerated, delta: delta(data.brainGym.questionsGeneratedToday) },
              { key: 'qa', icon: CheckCheck, tone: 'emerald', label: 'Questions Accepted', value: data.brainGym.questionsAccepted },
              { key: 'qr', icon: CircleX, tone: 'red', label: 'Questions Rejected', value: data.brainGym.questionsRejected },
              { key: 'acc', icon: Gauge, tone: 'gold', label: 'Average Accuracy', value: data.brainGym.averageAccuracy, suffix: '%' },
              { key: 'streak', icon: Flame, tone: 'orange', label: 'Active Streak Users', value: data.brainGym.activeStreakUsers, hint: 'played 2 days running' },
            ])}
          </DashboardSection>

          {/* 4 · Practice & Mock Tests */}
          <DashboardSection title="Practice & Mock Tests" tone="blue" icon={Target} description="Attempt volume and performance">
            {metrics([
              { key: 'pa', icon: Target, tone: 'blue', label: 'Practice Attempts', value: data.practice.practiceAttempts, delta: delta(data.practice.practiceToday) },
              { key: 'ma', icon: ClipboardCheck, tone: 'indigo', label: 'Mock Attempts', value: data.practice.mockAttempts, delta: delta(data.practice.mockToday) },
              { key: 'as', icon: Gauge, tone: 'emerald', label: 'Average Score', value: data.practice.averageScore, suffix: '%' },
              { key: 'most', icon: TrendingUp, tone: 'purple', label: 'Most Attempted Subject', value: data.practice.mostAttemptedSubject?.subject ?? '—', hint: data.practice.mostAttemptedSubject ? `${fmtNum(data.practice.mostAttemptedSubject.attempts)} attempts` : 'no mock attempts yet' },
              { key: 'low', icon: TrendingDown, tone: 'red', label: 'Lowest Performing Subject', value: data.practice.lowestPerformingSubject?.subject ?? '—', hint: data.practice.lowestPerformingSubject ? `${data.practice.lowestPerformingSubject.avgScore}% avg` : 'no mock attempts yet' },
            ])}
          </DashboardSection>

          {/* 5 · Arena */}
          <DashboardSection title="Arena" tone="cyan" icon={Swords} description="1v1 battle activity and rating spread">
            {metrics([
              { key: 'mt', icon: Swords, tone: 'cyan', label: 'Matches Today', value: data.arena.matchesToday },
              { key: 'ap', icon: UsersRound, tone: 'blue', label: 'Active Players', value: data.arena.activePlayers, hint: 'last 7 days' },
              { key: 'ab', icon: LogOut, tone: 'red', label: 'Abandoned Matches', value: data.arena.abandonedMatches, delta: delta(data.arena.abandonedToday) },
            ])}
          </DashboardSection>
          <Card>
            <SectionHead title="Rating distribution" tone="cyan" right={<Badge tone="cyan" dot={false}>current ratings</Badge>} />
            {data.arena.ratingDistribution.some((b) => b.count > 0)
              ? <ColumnChart tone="cyan" items={data.arena.ratingDistribution.map((b) => ({ label: b.label, value: b.count }))} height={170} />
              : <div className="state" style={{ padding: 28 }}><div className="state-msg">No arena matches recorded yet — the rating spread will appear as players compete.</div></div>}
          </Card>

          {/* 6 · Content Health */}
          <DashboardSection title="Content Health" tone="emerald" icon={BookOpen} description="Catalog coverage and publishing state" min={170}>
            {metrics([
              { key: 'subj', icon: GraduationCap, tone: 'indigo', label: 'Subjects', value: data.content.subjects },
              { key: 'chap', icon: Layers, tone: 'blue', label: 'Chapters', value: data.content.chapters },
              { key: 'notes', icon: FileText, tone: 'emerald', label: 'Notes', value: data.content.notes },
              { key: 'mcqs', icon: ListChecks, tone: 'purple', label: 'MCQs', value: data.content.mcqs },
              { key: 'mock', icon: ClipboardList, tone: 'orange', label: 'Mock Tests', value: data.content.mockTests },
              { key: 'res', icon: FolderOpen, tone: 'cyan', label: 'Resources', value: data.content.resources, hint: 'papers & solutions' },
              { key: 'miss', icon: FileWarning, tone: 'red', label: 'Missing Content', value: data.content.missingContent, hint: 'chapters with no sections' },
              { key: 'draft', icon: FilePen, tone: 'gold', label: 'Draft Content', pending: data.content.draftContent === null, value: data.content.draftContent },
              { key: 'pub', icon: FileCheck2, tone: 'emerald', label: 'Published Content', pending: data.content.publishedContent === null, value: data.content.publishedContent },
            ])}
          </DashboardSection>

          {/* 7 + 9 · Recent Activity & Platform Health */}
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)' }}>
            <Card>
              <SectionHead title="Recent Activity" tone="indigo" right={<span className="eyebrow"><RadioTower size={12} style={{ verticalAlign: -1 }} /> live feed</span>} />
              <ActivityFeed items={data.activity} />
            </Card>
            <Card>
              <SectionHead title="Platform Health" tone="emerald" />
              <PlatformHealth platform={data.platform} />
            </Card>
          </div>

          {/* 8 · Quick Actions */}
          <Card>
            <SectionHead title="Quick Actions" tone="purple" />
            <QuickActions />
          </Card>

          <div className="row center" style={{ padding: '4px 0 8px' }}>
            <span className="faint" style={{ fontSize: 11.5, fontWeight: 700 }}>Press <kbd style={{ padding: '1px 6px', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'inherit' }}>R</kbd> to refresh · pull down on touch devices</span>
          </div>
        </>
      )}
    </div>
  )
}

// Map metric specs → tiles. A single place so every section renders identically.
function metrics(specs: MetricSpec[]) {
  return specs.map(({ key, ...spec }) => <MetricTile key={key} {...spec} />)
}

function pctHint(part: number, whole: number): string | undefined {
  if (!whole) return undefined
  return `${Math.round((part / whole) * 100)}% of students`
}

function DashboardSkeleton() {
  return (
    <div className="col gap-24">
      {[8, 7, 6].map((n, i) => (
        <section key={i} className="col gap-12">
          <div className="row gap-10"><div className="sk" style={{ width: 30, height: 30, borderRadius: 10 }} /><div className="sk" style={{ width: 160, height: 16, borderRadius: 6 }} /></div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {Array.from({ length: n }).map((_, j) => <MetricSkeleton key={j} />)}
          </div>
        </section>
      ))}
    </div>
  )
}
