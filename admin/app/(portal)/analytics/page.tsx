'use client'

import { useState } from 'react'
import {
  GraduationCap, Users, Zap, CalendarDays, UserPlus, CircleCheck, Dumbbell, Target, Bot, Timer,
  Activity, Gauge, Trophy, TriangleAlert, BookOpen, TrendingDown, Sparkles, RadioTower, School,
} from 'lucide-react'
import { useApi } from '@/components/useApi'
import { MetricTile, MetricSkeleton, DashboardSection } from '@/components/dashboard/primitives'
import { LineChart, BarList } from '@/components/charts'
import { Card, SectionHead, Skel, EmptyState, ErrorState, Badge } from '@/components/ui'
import { S } from '@/lib/theme'
import { fmtNum, timeAgo, initials, colorFor } from '@/lib/format'
import type { AnalyticsSummary, AnalyticsTrends, AnalyticsTop, AnalyticsActivity, AnalyticsFacets, TrendPointV } from '@/lib/types'

const RANGES = [{ d: 7, l: '7d' }, { d: 30, l: '30d' }, { d: 90, l: '90d' }]
const fmtDur = (sec: number) => (!sec ? '—' : sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`)
const series = (arr?: TrendPointV[]) => (arr || []).map((p) => ({ label: p.date.slice(5), value: p.value }))

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [klass, setKlass] = useState('')
  const [board, setBoard] = useState('')
  const [school, setSchool] = useState('')
  const [subject, setSubject] = useState('')

  const facets = useApi<AnalyticsFacets>('/analytics/facets')
  const filters = { days, class: klass, board, school, subject }
  const summary = useApi<AnalyticsSummary>('/analytics/summary', filters)
  const trends = useApi<AnalyticsTrends>('/analytics/trends', filters)
  const top = useApi<AnalyticsTop>('/analytics/top', filters)
  const activity = useApi<AnalyticsActivity>('/analytics/activity')

  const m = summary.data
  const t = trends.data

  return (
    <div className="col gap-24">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="h1">Analytics</h1>
          <div className="sub">Real-time platform intelligence — every widget is drawn from live data.</div>
        </div>
        <div className="actions">
          <div className="tabs">{RANGES.map((r) => <button key={r.d} className={`tab ${days === r.d ? 'active' : ''}`} onClick={() => setDays(r.d)}>{r.l}</button>)}</div>
        </div>
      </div>

      {/* Filter bar */}
      <Card style={{ padding: 12 }}>
        <div className="row gap-10 wrap" style={{ alignItems: 'center' }}>
          <span className="eyebrow" style={{ marginRight: 2 }}>Filters</span>
          <FilterSelect icon={GraduationCap} value={klass} onChange={setKlass} placeholder="All classes" options={facets.data?.classes} />
          <FilterSelect icon={BookOpen} value={board} onChange={setBoard} placeholder="All boards" options={facets.data?.boards} />
          <FilterSelect icon={School} value={school} onChange={setSchool} placeholder="All schools" options={facets.data?.schools} />
          <FilterSelect icon={Sparkles} value={subject} onChange={setSubject} placeholder="All subjects" options={facets.data?.subjects} />
          {(klass || board || school || subject) && (
            <button className="btn btn-ghost sm" onClick={() => { setKlass(''); setBoard(''); setSchool(''); setSubject('') }}>Clear</button>
          )}
        </div>
      </Card>

      {summary.error && <ErrorState message={summary.error} onRetry={summary.reload} />}

      {/* Overview */}
      <DashboardSection title="Overview" tone="indigo" icon={Activity} description="Population & engagement across the selected window">
        {summary.loading ? Array.from({ length: 12 }).map((_, i) => <MetricSkeleton key={i} />) : m ? [
          <MetricTile key="students" icon={GraduationCap} tone="indigo" label="Total Students" value={m.totalStudents} />,
          <MetricTile key="parents" icon={Users} tone="blue" label="Total Parents" value={m.totalParents} />,
          <MetricTile key="today" icon={Zap} tone="emerald" label="Active Today" value={m.activeToday} />,
          <MetricTile key="week" icon={CalendarDays} tone="cyan" label="Active This Week" value={m.activeThisWeek} />,
          <MetricTile key="new" icon={UserPlus} tone="purple" label="New Registrations" value={m.newRegistrations} hint={`${fmtNum(m.newToday)} today`} />,
          <MetricTile key="completion" icon={CircleCheck} tone="emerald" label="Lesson Completion" value={m.lessonCompletionRate} suffix="%" />,
          <MetricTile key="bg" icon={Dumbbell} tone="orange" label="Brain Gym Sessions" value={m.brainGymSessions} />,
          <MetricTile key="practice" icon={Target} tone="blue" label="Practice Attempts" value={m.practiceAttempts} />,
          <MetricTile key="ai" icon={Bot} tone="purple" label="AI Teacher Sessions" value={m.aiTeacherSessions} hint={`${fmtNum(m.doubtsAsked)} doubts`} />,
          <MetricTile key="dur" icon={Timer} tone="gold" label="Avg Session Duration" value={fmtDur(m.avgSessionDuration)} />,
          <MetricTile key="we" icon={Gauge} tone="cyan" label="Weekly Engagement" value={m.weeklyEngagement} suffix="%" />,
          <MetricTile key="me" icon={Gauge} tone="indigo" label="Monthly Engagement" value={m.monthlyEngagement} suffix="%" />,
        ] : <EmptyState title="No data" />}
      </DashboardSection>

      {/* Trend charts */}
      <div className="grid cols-2">
        <ChartCard title="Daily Active Users" tone="indigo" loading={trends.loading} data={series(t?.dailyActiveUsers)} />
        <ChartCard title="Weekly Active Users" tone="blue" loading={trends.loading} data={series(t?.weeklyActiveUsers)} />
        <ChartCard title="Lesson Completion Trend" tone="emerald" loading={trends.loading} data={series(t?.lessonCompletion)} />
        <ChartCard title="Brain Gym Usage Trend" tone="orange" loading={trends.loading} data={series(t?.brainGym)} />
        <ChartCard title="Practice Usage Trend" tone="cyan" loading={trends.loading} data={series(t?.practice)} />
        <ChartCard title="AI Teacher Usage Trend" tone="purple" loading={trends.loading} data={series(t?.aiTeacher)} />
      </div>
      <ChartCard title="Parent Engagement Trend" tone="gold" loading={trends.loading} data={series(t?.parentEngagement)} full />

      {/* Top lists */}
      <div className="grid cols-2">
        <Card>
          <SectionHead title="Top Performing Students" tone="emerald" right={<Trophy size={15} color={S.emerald} />} />
          {top.loading ? <BarsSkel /> : top.data?.topStudents.length
            ? <div className="col gap-1">{top.data.topStudents.map((s, i) => (
                <div key={s.id} className="feed-row"><span className="tnum faint" style={{ width: 22, fontWeight: 800 }}>{i + 1}</span><span className="avatar" style={{ background: colorFor(s.id) }}>{initials(s.name)}</span><div className="grow"><div className="strong truncate">{s.name}</div><div className="faint" style={{ fontSize: 11 }}>{s.grade || '—'} · {s.sessions} sessions</div></div><div className="col" style={{ alignItems: 'flex-end', gap: 0 }}><span className="strong tnum">{fmtNum(s.xp)} XP</span>{s.accuracy !== null && <span className="faint" style={{ fontSize: 11 }}>{s.accuracy}% acc</span>}</div></div>
              ))}</div>
            : <EmptyState icon={Trophy} title="No activity yet" message="Top students appear once they earn XP." />}
        </Card>
        <Card>
          <SectionHead title="Students at Risk" tone="red" right={<TriangleAlert size={15} color={S.red} />} />
          {top.loading ? <BarsSkel /> : top.data?.studentsAtRisk.length
            ? <div className="col gap-1">{top.data.studentsAtRisk.map((s) => (
                <div key={s.id} className="feed-row"><span className="avatar" style={{ background: colorFor(s.id) }}>{initials(s.name)}</span><div className="grow"><div className="strong truncate">{s.name}</div><div className="faint" style={{ fontSize: 11 }}>{s.grade || '—'} · {s.openMistakes} open mistakes</div></div><Badge tone="red" dot={false}>{s.accuracy ?? 0}% acc</Badge></div>
              ))}</div>
            : <EmptyState icon={CircleCheck} title="No at-risk students" message="Students with low accuracy over 3+ sessions appear here." />}
        </Card>
        <Card>
          <SectionHead title="Weak Subjects" tone="orange" />
          {top.loading ? <BarsSkel /> : top.data?.weakSubjects.length
            ? <BarList tone="orange" valueSuffix=" mistakes" items={top.data.weakSubjects.map((r) => ({ label: r.subject, sub: `${r.students} students`, value: r.mistakes }))} />
            : <EmptyState icon={Target} title="No weak subjects" message="Emerge from unresolved mistakes." />}
        </Card>
        <Card>
          <SectionHead title="Weak Chapters" tone="red" />
          {top.loading ? <BarsSkel /> : top.data?.weakChapters.length
            ? <BarList tone="red" valueSuffix=" mistakes" items={top.data.weakChapters.map((r) => ({ label: r.chapter, sub: `${r.subject} · ${r.students} students`, value: r.mistakes }))} />
            : <EmptyState icon={Target} title="No weak chapters" message="Emerge from unresolved mistakes." />}
        </Card>
        <Card>
          <SectionHead title="Most Used Lessons" tone="purple" />
          {top.loading ? <BarsSkel /> : top.data?.mostUsedLessons.length
            ? <BarList tone="purple" valueSuffix="" items={top.data.mostUsedLessons.map((r) => ({ label: r.title, sub: r.subject, value: r.count }))} />
            : <EmptyState icon={BookOpen} title="No lessons yet" message="Generated lessons appear here." />}
        </Card>
        <Card>
          <SectionHead title="Most Used Brain Gym Activities" tone="orange" />
          {top.loading ? <BarsSkel /> : top.data?.mostUsedBrainGym.length
            ? <BarList tone="orange" valueSuffix=" plays" items={top.data.mostUsedBrainGym.map((r) => ({ label: r.activity, sub: `${r.accuracy}% accuracy`, value: r.count }))} />
            : <EmptyState icon={Dumbbell} title="No Brain Gym data" message="Activity appears with more plays." />}
        </Card>
      </div>

      {/* Realtime */}
      <DashboardSection title="Realtime" tone="cyan" icon={RadioTower} description="The latest across the platform" min={280}>
        <Feed title="Recent Signups" loading={activity.loading} items={(activity.data?.recentSignups || []).map((r) => ({ id: r.id, title: r.name, sub: `${r.grade || 'Student'} · ${r.detail || ''}`, at: r.at }))} icon={UserPlus} tone="indigo" />
        <Feed title="Recent Lesson Activity" loading={activity.loading} items={(activity.data?.recentLessons || []).map((r) => ({ id: r.id, title: r.title, sub: r.student, at: r.at }))} icon={GraduationCap} tone="emerald" />
        <Feed title="Recent AI Teacher Sessions" loading={activity.loading} items={(activity.data?.recentAiTeacher || []).map((r) => ({ id: r.id, title: r.title, sub: `${r.subject} · ${r.student}`, at: r.at }))} icon={Bot} tone="purple" />
        <Feed title="Recent Parent Activity" loading={activity.loading} items={(activity.data?.recentParents || []).map((r) => ({ id: r.id, title: r.name, sub: r.linked ? 'Linked to a child' : 'No child linked', at: r.at }))} icon={Users} tone="blue" />
      </DashboardSection>
    </div>
  )
}

function FilterSelect({ icon: Icon, value, onChange, placeholder, options }: { icon: any; value: string; onChange: (v: string) => void; placeholder: string; options?: string[] }) {
  return (
    <div className="row gap-6" style={{ alignItems: 'center' }}>
      <Icon size={14} color="var(--faint)" />
      <select className="select" style={{ width: 'auto', padding: '6px 8px', fontSize: 12.5 }} value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder}>
        <option value="">{placeholder}</option>
        {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function ChartCard({ title, tone, loading, data, full }: { title: string; tone: any; loading: boolean; data: { label: string; value: number }[]; full?: boolean }) {
  const hasData = data.some((d) => d.value > 0)
  return (
    <Card className={full ? '' : 'grow'}>
      <SectionHead title={title} tone={tone} />
      {loading ? <Skel h={160} /> : hasData ? <LineChart series={data} tone={tone} height={full ? 200 : 160} /> : <EmptyState icon={Activity} title="No data in this window" />}
    </Card>
  )
}

function BarsSkel() { return <div className="col gap-12">{[0, 1, 2, 3].map((i) => <div key={i}><Skel h={10} w={`${80 - i * 8}%`} style={{ marginBottom: 6 }} /><Skel h={8} /></div>)}</div> }

function Feed({ title, items, loading, icon: Icon, tone }: { title: string; items: { id: string; title: string; sub: string; at: string }[]; loading: boolean; icon: any; tone: any }) {
  return (
    <Card>
      <SectionHead title={title} tone={tone} right={<Icon size={14} color="var(--faint)" />} />
      {loading ? <div className="col gap-8">{[0, 1, 2, 3].map((i) => <Skel key={i} h={34} />)}</div>
        : items.length ? (
          <div className="col" style={{ gap: 1 }}>
            {items.slice(0, 8).map((it) => (
              <div key={it.id} className="feed-row" style={{ padding: '8px 6px' }}>
                <div className="feed-body"><div className="feed-title truncate">{it.title}</div><div className="feed-sub truncate">{it.sub}</div></div>
                <span className="faint nowrap" style={{ fontSize: 11, fontWeight: 700 }}>{timeAgo(it.at)}</span>
              </div>
            ))}
          </div>
        ) : <EmptyState icon={Icon} title="Nothing yet" />}
    </Card>
  )
}
