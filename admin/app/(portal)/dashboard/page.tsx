'use client'

/**
 * Admin dashboard — what is happening across Ailernova today.
 *
 * Every number on this page comes from the dashboard endpoint. Where the API has
 * nothing to say, the tile says so ("No data yet") rather than showing a
 * confident zero: a dashboard that invents a figure is worse than one that
 * admits a gap, because nobody can tell which is which afterwards.
 */

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  RefreshCw, ArrowRight, GraduationCap, Users, BookOpenCheck, FileClock, FilePlus2,
  ClipboardCheck, CircleCheck, Activity as ActivityIcon, Clock, TrendingUp, TrendingDown,
  AlertTriangle,
} from 'lucide-react'
import { useDashboard } from '@/components/dashboard/useDashboard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { AreaChart, SegmentDonut, MetricBar, Num, PROGRESS_RAMP, METRIC_HUES } from '@/components/dashboardCharts'
import { PageHero, SectionLabel, Card, SectionHead, Skel, ErrorState, EmptyState } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { fmtDate } from '@/lib/format'
import { S } from '@/lib/theme'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/**
 * One headline number. `delta` is only rendered when the API actually gave one —
 * a trend arrow with nothing behind it is the most quietly misleading thing a
 * dashboard can show.
 */
function Stat({ icon: Icon, tint, label, value, suffix, note, decimals = 0, index = 0, delta }: {
  icon: any; tint: string; label: string
  value: number | null; suffix?: string; note?: string; decimals?: number; index?: number
  delta?: { pct: number; label: string } | null
}) {
  const empty = value === null || value === undefined
  const up = delta ? delta.pct >= 0 : false
  return (
    <div className="dash-stat" style={{ animationDelay: index * 70 + 'ms' }}>
      <span className="dash-stat-ic" style={{ background: tint + '1a', color: tint }}>
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="row" style={{ alignItems: 'baseline', gap: 7, flexWrap: 'wrap' }}>
          <span className="dash-stat-val">
            {empty ? '—' : <><Num value={value as number} decimals={decimals} />{suffix || ''}</>}
          </span>
          {delta && (
            <span className={'dash-delta' + (up ? ' up' : ' down')}>
              {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(delta.pct)}%
            </span>
          )}
        </div>
        <div className="dash-stat-label">{label}</div>
        {note && <div className="dash-stat-note">{empty ? 'No data yet' : note}</div>}
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

  const spark = useMemo(
    () => (data?.trends.activeUsers || []).map((p) => ({ label: p.date.slice(5), value: p.count })),
    [data],
  )

  if (loading && !data) {
    return (
      <>
        <PageHero eyebrow={fmtDate(new Date().toISOString())} title={greeting() + ', ' + firstName} subtitle="Here's what's happening across Ailernova today." />
        <Skel h={118} r={20} style={{ marginBottom: 18 }} />
        <div className="dash-stats">{[0, 1, 2, 3].map((i) => <Skel key={i} h={86} r={16} />)}</div>
        <div style={{ height: 18 }} />
        <Skel h={300} r={20} />
      </>
    )
  }
  if (error && !data) {
    return (
      <>
        <PageHero title={greeting() + ', ' + firstName} />
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      </>
    )
  }
  if (!data) return null

  const { overview, aiTeacher, brainGym, practice, content, activity } = data
  const split = aiTeacher.progressSplit

  // Attention queue — built ONLY from real fields, only shown when > 0.
  const attn = [
    content.missingContent > 0
      ? { icon: FilePlus2, tone: S.orange, count: content.missingContent, title: 'Chapters missing content', sub: 'No notes or questions yet', href: '/cms' } : null,
    aiTeacher.pendingReview > 0
      ? { icon: ClipboardCheck, tone: S.purple, count: aiTeacher.pendingReview, title: 'AI lessons failed', sub: 'Generation did not complete', href: '/ai-teacher' } : null,
    content.draftContent != null && content.draftContent > 0
      ? { icon: FileClock, tone: S.gold, count: content.draftContent, title: 'Drafts awaiting review', sub: 'Saved but not published', href: '/cms' } : null,
  ].filter(Boolean) as { icon: any; tone: string; count: number; title: string; sub: string; href: string }[]

  const primary = attn[0]

  // Names from the live feed — real people who did something, not placeholders.
  const faces = Array.from(new Set((activity || []).map((a: any) => a.actor).filter(Boolean))).slice(0, 6) as string[]

  return (
    <>
      <PageHero
        eyebrow={fmtDate(new Date().toISOString())}
        title={greeting() + ', ' + firstName + '!'}
        subtitle="Here's what's happening with your classes and learners today."
        actions={
          <div className="row gap-10" style={{ alignItems: 'center' }}>
            {lastUpdated && (
              <span style={{ fontSize: 11.5, color: S.faint }}>
                Updated {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button className="btn btn-ghost sm" onClick={reload} title="Refresh (R)">
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        }
      />

      {/* ── the one thing that needs you, with the trend behind it ───────────── */}
      <div className="dash-hero">
        <div style={{ minWidth: 0, flex: '1 1 280px' }}>
          <span className="dash-hero-eyebrow">
            {primary ? 'Needs attention' : 'All clear'}
          </span>
          <div className="row" style={{ alignItems: 'baseline', gap: 12, marginTop: 6 }}>
            <span className="dash-hero-num tnum">
              {primary ? <Num value={primary.count} duration={1100} /> : '✓'}
            </span>
            <span className="dash-hero-title">
              {primary ? primary.title : 'Nothing needs your attention'}
            </span>
          </div>
          <div className="dash-hero-sub">
            {primary ? primary.sub : 'No content gaps or failed generations are open.'}
          </div>
          {primary && (
            <Link href={primary.href} className="btn btn-primary sm" style={{ marginTop: 14 }}>
              View details <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {spark.length > 1 && (
          <div className="dash-hero-spark" aria-hidden="true">
            <AreaChart series={spark} height={104} color="#2a78d6" />
          </div>
        )}
      </div>

      {/* ── headline numbers ─────────────────────────────────────────────────── */}
      <div className="dash-stats">
        <Stat index={0} icon={GraduationCap} tint="#2a78d6" label="Total students" value={overview.totalStudents}
          note={overview.newRegistrationsWeek + ' new this week'} />
        <Stat index={1} icon={Users} tint="#1baf7a" label="Active this week" value={overview.activeThisWeek}
          note={'out of ' + overview.totalStudents} />
        <Stat index={2} icon={BookOpenCheck} tint="#8B5CF6" label="Lessons completed" value={aiTeacher.lessonsCompleted}
          note={aiTeacher.lessonsCompletedToday + ' today'} />
        {/* One decimal: average study time is a fraction of an hour at this scale,
            and rounding it prints a confident "0" for a number that is not zero. */}
        <Stat index={3} icon={Clock} tint="#eda100" label="Avg. learning time"
          value={aiTeacher.avgStudyHoursWeek} suffix="h" decimals={1}
          note={'per learner · ' + aiTeacher.studyLearnersWeek + ' studied this week'} />
      </div>

      {/* ── activity + progress ──────────────────────────────────────────────── */}
      <div className="dash-row" style={{ marginTop: 20 }}>
        <Card>
          <SectionHead title="Learning activity" tone="indigo"
            right={<span style={{ fontSize: 12, color: S.faint, fontWeight: 600 }}>Last {spark.length} days</span>} />
          {spark.some((p) => (p.value || 0) > 0)
            ? <AreaChart series={spark} height={236} color="#2a78d6" suffix=" active"
                ariaLabel="Active learners per day over the last two weeks" />
            : <EmptyState icon={ActivityIcon} title="No activity in this window"
                message="Daily active learners will chart here as students return." />}
        </Card>

        <Card>
          <SectionHead title="Overall progress" tone="emerald" />
          {split.completed + split.inProgress + split.notStarted > 0 ? (
            <SegmentDonut
              size={168}
              centerValue={(aiTeacher.averageCompletion != null ? aiTeacher.averageCompletion + '%' : '—')}
              centerLabel="completion"
              segments={[
                { label: 'Completed', value: split.completed, color: PROGRESS_RAMP.completed },
                { label: 'In progress', value: split.inProgress, color: PROGRESS_RAMP.inProgress },
                { label: 'Not started', value: split.notStarted, color: PROGRESS_RAMP.notStarted },
              ]}
            />
          ) : (
            <EmptyState icon={BookOpenCheck} title="No lessons opened yet"
              message="Progress appears once students begin a lesson." />
          )}
        </Card>
      </div>

      {/* ── feed + the right rail ────────────────────────────────────────────── */}
      <div className="dash-row wide" style={{ marginTop: 20 }}>
        <Card>
          <SectionHead title="Recent activity" tone="indigo"
            right={<Link href="/reports" className="crumb-link">View all</Link>} />
          <ActivityFeed items={activity} />
        </Card>

        <div className="col gap-16">
          <Card>
            <SectionHead title="Learning progress" tone="emerald" />
            <MetricBar index={0} label="Lesson completion" value={aiTeacher.averageCompletion} color={METRIC_HUES[0]} />
            <MetricBar index={1} label="Brain Gym accuracy" value={brainGym.averageAccuracy} color={METRIC_HUES[1]} />
            <MetricBar index={2} label="Practice average score" value={practice.averageScore} color={METRIC_HUES[2]} />
          </Card>

          <Card>
            <SectionHead title="Active learners" tone="blue"
              right={<Link href="/people/students" className="crumb-link">View all</Link>} />
            {faces.length ? (
              <>
                <div className="dash-faces">
                  {faces.map((n) => (
                    <span key={n} className="dash-face" title={n}>{n.slice(0, 1).toUpperCase()}</span>
                  ))}
                </div>
                <div style={{ fontSize: 12.5, color: S.muted, marginTop: 10, fontWeight: 600 }}>
                  {overview.activeThisWeek} active this week
                </div>
              </>
            ) : <span className="faint" style={{ fontSize: 13 }}>No recent activity.</span>}
          </Card>

          <Card>
            <SectionHead title="Attention required" tone="gold"
              right={attn.length ? <AlertTriangle size={15} color={S.gold} /> : <CircleCheck size={15} color={S.emerald} />} />
            {attn.length ? attn.map((a) => (
              <Link key={a.title} href={a.href} className="attn-row" style={{ textDecoration: 'none' }}>
                <span className="attn-icon" style={{ background: a.tone + '1f' }}>
                  <a.icon size={18} color={a.tone} strokeWidth={2.3} />
                </span>
                <div className="attn-body">
                  <div className="attn-title">{a.title}</div>
                  <div className="attn-sub">{a.sub}</div>
                </div>
                <span className="attn-count tnum">{a.count}</span>
              </Link>
            )) : (
              <div className="row gap-10" style={{ padding: '8px 4px', color: S.muted, fontWeight: 700, fontSize: 13 }}>
                <CircleCheck size={17} color={S.emerald} /> Everything&apos;s in order.
              </div>
            )}
          </Card>
        </div>
      </div>

      <SectionLabel>Quick actions</SectionLabel>
      <Card><QuickActions /></Card>

      <style jsx global>{`
        /* Everything enters the same way — up and in, decelerating — so the page
           assembles as one movement rather than several competing ones. */
        @keyframes dash-rise  { from { opacity: 0; transform: translateY(14px); } }
        @keyframes dash-sheen { to   { transform: translateX(260%); } }

        /* ── hero ─────────────────────────────────────────────────────────── */
        .dash-hero {
          position: relative; overflow: hidden;
          display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
          padding: 20px 24px; border-radius: 18px; margin-bottom: 18px;
          border: 1px solid var(--line);
          background: linear-gradient(118deg, rgba(42,120,214,.10), rgba(139,92,246,.07) 62%, transparent);
          animation: dash-rise .42s cubic-bezier(.22,1,.36,1) both;
        }
        /* A single light sweep as the page arrives, then never again. It reads as
           the surface catching the light once, not as something still loading. */
        .dash-hero::after {
          content: ''; position: absolute; inset: 0 auto 0 -38%; width: 38%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.26), transparent);
          transform: translateX(0);
          animation: dash-sheen 1.5s cubic-bezier(.22,1,.36,1) .25s 1 both;
          pointer-events: none;
        }
        .dash-hero-eyebrow {
          font-size: 11px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; color: var(--muted);
        }
        .dash-hero-num { font-size: 42px; font-weight: 900; line-height: 1; letter-spacing: -.03em; color: var(--ink); }
        .dash-hero-title { font-size: 15.5px; font-weight: 750; color: var(--ink); }
        .dash-hero-sub { font-size: 13px; color: var(--muted); margin-top: 5px; }
        .dash-hero-spark { flex: 1 1 260px; min-width: 220px; opacity: .85; }

        /* ── stat row ─────────────────────────────────────────────────────── */
        .dash-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(214px, 1fr)); gap: 14px; }
        .dash-stat {
          display: flex; align-items: flex-start; gap: 13px; padding: 16px;
          border: 1px solid var(--line); border-radius: 15px; background: var(--card);
          animation: dash-rise .42s cubic-bezier(.22,1,.36,1) both;
          transition: transform .24s cubic-bezier(.22,1,.36,1), box-shadow .24s, border-color .24s;
        }
        .dash-stat:hover { transform: translateY(-3px); box-shadow: var(--shadow-md, var(--shadow-sm)); border-color: var(--accent); }
        .dash-stat:hover .dash-stat-ic { transform: scale(1.08) rotate(-4deg); }
        .dash-stat-ic {
          width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; flex: 0 0 auto;
          transition: transform .28s cubic-bezier(.34,1.56,.64,1);
        }
        .dash-stat-val { font-size: 25px; font-weight: 900; letter-spacing: -.025em; color: var(--ink); line-height: 1.1; }
        .dash-stat-label { font-size: 12.5px; font-weight: 650; color: var(--sub, var(--muted)); margin-top: 3px; }
        .dash-stat-note { font-size: 11.5px; color: var(--muted); margin-top: 3px; }
        .dash-delta {
          display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 99px;
          font-size: 11px; font-weight: 800;
        }
        .dash-delta.up { background: rgba(18,160,106,.12); color: #0E8A5B; }
        .dash-delta.down { background: rgba(220,38,38,.1); color: #DC2626; }

        /* ── two-column rows ──────────────────────────────────────────────── */
        .dash-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
        .dash-row.wide { grid-template-columns: 1.6fr 1fr; }
        @media (max-width: 1040px) {
          .dash-row, .dash-row.wide { grid-template-columns: 1fr; }
        }

        /* ── learner faces ────────────────────────────────────────────────── */
        .dash-faces { display: flex; align-items: center; }
        .dash-face {
          width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center;
          font-size: 13px; font-weight: 800; color: #fff; background: #2a78d6;
          border: 2px solid var(--card); margin-left: -9px; flex: 0 0 auto;
          transition: transform .18s cubic-bezier(.22,1,.36,1);
        }
        .dash-face:first-child { margin-left: 0; }
        .dash-legend { transition: opacity .2s cubic-bezier(.22,1,.36,1); }

        /* The two content rows arrive after the stats, in order, so the eye is
           led down the page instead of everything landing at once. */
        .dash-row > * { animation: dash-rise .44s cubic-bezier(.22,1,.36,1) both; }
        .dash-row > *:nth-child(1) { animation-delay: 240ms; }
        .dash-row > *:nth-child(2) { animation-delay: 320ms; }
        .dash-row.wide > *:nth-child(1) { animation-delay: 300ms; }
        .dash-row.wide > *:nth-child(2) { animation-delay: 380ms; }

        /* The refresh icon spins while a reload is in flight. */
        .spin { animation: dash-spin .9s linear infinite; }
        @keyframes dash-spin { to { transform: rotate(360deg); } }

        .attn-row { transition: background .2s, transform .2s cubic-bezier(.22,1,.36,1); }
        .attn-row:hover { transform: translateX(3px); }
        .dash-face:nth-child(2) { background: #1baf7a; }
        .dash-face:nth-child(3) { background: #8B5CF6; }
        .dash-face:nth-child(4) { background: #eda100; }
        .dash-face:nth-child(5) { background: #e87ba4; }
        .dash-face:nth-child(6) { background: #4a3aa7; }
        .dash-face:hover { transform: translateY(-3px) scale(1.06); z-index: 2; }

        /* One switch turns all of it off. The charts check the same setting in JS
           and render their finished state directly rather than animating to it. */
        @media (prefers-reduced-motion: reduce) {
          .dash-hero, .dash-stat, .dash-row > * { animation: none !important; }
          .dash-hero::after, .spin { animation: none !important; }
          .dash-stat:hover, .dash-face:hover, .attn-row:hover { transform: none; }
          .dash-stat:hover .dash-stat-ic { transform: none; }
        }
      `}</style>
    </>
  )
}
