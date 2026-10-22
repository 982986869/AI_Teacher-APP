'use client'

/**
 * Analytics — platform intelligence across engagement, learning and performance.
 *
 * Every number is served by /analytics/* and respects the filter bar; nothing on
 * this page is computed in the browser except the merged activity table, which
 * interleaves the four realtime feeds the API already returns.
 *
 * Where a measure has no data the tile shows an em dash rather than a zero. A
 * dashboard that prints 0% for "no lessons were completed because none exist"
 * and 0% for "lessons exist and all were abandoned" has made those two states
 * indistinguishable, which is the one thing it must not do.
 */

import { useMemo, useState } from 'react'
import {
  GraduationCap, Users, Zap, CalendarDays, UserPlus, CircleCheck, Dumbbell, Target, Bot, Timer,
  Activity as ActivityIcon, Gauge, Trophy, TriangleAlert, BookOpen, Sparkles, School,
  RotateCcw, ArrowRight, Clock, ChevronDown, LogIn, Eye, Brain,
} from 'lucide-react'
import { useApi } from '@/components/useApi'
import { AreaChart, Num, METRIC_HUES } from '@/components/dashboardCharts'
import { BarList } from '@/components/charts'
import { Card, SectionHead, Skel, EmptyState, ErrorState, Badge } from '@/components/ui'
import { S, type AccentKey } from '@/lib/theme'
import { fmtNum, timeAgo, initials, colorFor } from '@/lib/format'
import type { AnalyticsSummary, AnalyticsTrends, AnalyticsTop, AnalyticsActivity, AnalyticsFacets, TrendPointV } from '@/lib/types'

const RANGES = [{ d: 7, l: '7d' }, { d: 30, l: '30d' }, { d: 90, l: '90d' }]
const fmtDur = (sec: number) => (!sec ? '—' : sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`)
const series = (arr?: TrendPointV[]) =>
  (arr || []).map((p) => ({ label: new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), value: p.value }))

/** One headline measure. Icon left, label above the number, like the rest of the console. */
function Tile({ icon: Icon, tint, label, value, suffix, hint, decimals = 0 }: {
  icon: any; tint: string; label: string
  value: number | string | null; suffix?: string; hint?: string; decimals?: number
}) {
  const empty = value === null || value === undefined
  const numeric = typeof value === 'number'
  return (
    <div className="an-tile">
      <span className="an-tile-ic" style={{ background: tint + '1a', color: tint }}>
        <Icon size={17} strokeWidth={2.2} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div className="an-tile-label">{label}</div>
        <div className="an-tile-val">
          {empty ? '—' : numeric ? <><Num value={value as number} decimals={decimals} />{suffix || ''}</> : value}
        </div>
        {hint && <div className="an-tile-hint">{hint}</div>}
      </div>
    </div>
  )
}

function TileSkel() {
  return <div className="an-tile"><Skel w={38} h={38} r={11} /><div style={{ flex: 1 }}><Skel h={10} w="62%" /><Skel h={18} w="40%" style={{ marginTop: 8 }} /></div></div>
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [klass, setKlass] = useState('')
  const [board, setBoard] = useState('')
  const [school, setSchool] = useState('')
  const [subject, setSubject] = useState('')
  const [tab, setTab] = useState(0)

  const facets = useApi<AnalyticsFacets>('/analytics/facets')
  const filters = { days, class: klass, board, school, subject }
  const summary = useApi<AnalyticsSummary>('/analytics/summary', filters)
  const trends = useApi<AnalyticsTrends>('/analytics/trends', filters)
  const top = useApi<AnalyticsTop>('/analytics/top', filters)
  const activity = useApi<AnalyticsActivity>('/analytics/activity')

  const m = summary.data
  const t = trends.data
  const dirty = !!(klass || board || school || subject)

  /**
   * One table out of the four realtime feeds, newest first. The feeds are
   * separate endpoints' worth of data with different shapes, so the type is what
   * supplies the row's icon and status word — there is no status column in the
   * source, and inventing one per row would be fiction.
   */
  const recent = useMemo(() => {
    const a = activity.data
    if (!a) return []
    const rows = [
      ...(a.recentSignups || []).map((r) => ({
        id: 'su' + r.id, kind: 'Signup', icon: UserPlus, tint: METRIC_HUES[0],
        title: r.name, detail: [r.grade || 'Student', r.detail].filter(Boolean).join(' · '),
        status: 'New', tone: 'indigo' as AccentKey, at: r.at,
      })),
      ...(a.recentLessons || []).map((r) => ({
        id: 'ls' + r.id, kind: 'Lesson completed', icon: GraduationCap, tint: METRIC_HUES[1],
        title: r.title, detail: r.student, status: 'Completed', tone: 'emerald' as AccentKey, at: r.at,
      })),
      ...(a.recentAiTeacher || []).map((r) => ({
        id: 'ai' + r.id, kind: 'AI Teacher session', icon: Bot, tint: '#8B5CF6',
        title: r.title, detail: [r.subject, r.student].filter(Boolean).join(' · '),
        status: r.status === 'READY' ? 'Ready' : r.status === 'FAILED' ? 'Failed' : 'Generating',
        tone: (r.status === 'FAILED' ? 'red' : r.status === 'READY' ? 'blue' : 'gold') as AccentKey, at: r.at,
      })),
      ...(a.recentParents || []).map((r) => ({
        id: 'pa' + r.id, kind: 'Parent joined', icon: Users, tint: METRIC_HUES[2],
        title: r.name, detail: r.detail || '', status: r.linked ? 'Linked' : 'No child',
        tone: (r.linked ? 'emerald' : 'gold') as AccentKey, at: r.at,
      })),
    ]
    return rows.filter((r) => r.at).sort((x, y) => +new Date(y.at) - +new Date(x.at)).slice(0, 8)
  }, [activity.data])

  const TABS = [
    { label: 'Recent Signups', icon: UserPlus, items: (activity.data?.recentSignups || []).map((r) => ({ id: r.id, name: r.name, sub: [r.grade || 'Student', r.detail].filter(Boolean).join(' · '), at: r.at })) },
    { label: 'Recent Lesson Activity', icon: GraduationCap, items: (activity.data?.recentLessons || []).map((r) => ({ id: r.id, name: r.title, sub: r.student, at: r.at })) },
    { label: 'Recent AI Teacher Sessions', icon: Bot, items: (activity.data?.recentAiTeacher || []).map((r) => ({ id: r.id, name: r.title, sub: [r.subject, r.student].filter(Boolean).join(' · '), at: r.at })) },
    { label: 'Recent Parent Activity', icon: Users, items: (activity.data?.recentParents || []).map((r) => ({ id: r.id, name: r.name, sub: r.linked ? 'Linked to a child' : 'No child linked', at: r.at })) },
  ]

  return (
    <div className="col gap-18">
      {/* ── head ─────────────────────────────────────────────────────────── */}
      <div className="an-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="an-title">Analytics</h1>
          <div className="sub">Real-time platform intelligence across student engagement, learning activity and performance.</div>
        </div>
        <div className="row gap-10" style={{ alignItems: 'center' }}>
          <span className="an-range-label"><CalendarDays size={14} /> Last {days} days</span>
          <div className="an-seg">
            {RANGES.map((r) => (
              <button key={r.d} className={'an-seg-btn' + (days === r.d ? ' on' : '')} onClick={() => setDays(r.d)}>{r.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── filters ──────────────────────────────────────────────────────── */}
      <div className="an-filters">
        <FilterSelect icon={GraduationCap} value={klass} onChange={setKlass} placeholder="All Classes" options={facets.data?.classes} />
        <FilterSelect icon={BookOpen} value={board} onChange={setBoard} placeholder="All Boards" options={facets.data?.boards} />
        <FilterSelect icon={School} value={school} onChange={setSchool} placeholder="All Schools" options={facets.data?.schools} />
        <FilterSelect icon={Sparkles} value={subject} onChange={setSubject} placeholder="All Subjects" options={facets.data?.subjects} />
        <button className="btn btn-ghost sm an-reset" disabled={!dirty}
          onClick={() => { setKlass(''); setBoard(''); setSchool(''); setSubject('') }}>
          <RotateCcw size={14} /> Reset filters
        </button>
      </div>

      {summary.error && <ErrorState message={summary.error} onRetry={summary.reload} />}

      {/* ── headline numbers ─────────────────────────────────────────────── */}
      <div className="an-tiles">
        {summary.loading && !m ? Array.from({ length: 12 }).map((_, i) => <TileSkel key={i} />) : m ? (
          <>
            <Tile icon={GraduationCap} tint="#2a78d6" label="Total Students" value={m.totalStudents} />
            <Tile icon={Users} tint="#5598e7" label="Total Parents" value={m.totalParents} />
            <Tile icon={Zap} tint="#1baf7a" label="Active Today" value={m.activeToday} />
            <Tile icon={CalendarDays} tint="#19a0b8" label="Active This Week" value={m.activeThisWeek} />
            <Tile icon={UserPlus} tint="#8B5CF6" label="New Registrations" value={m.newRegistrations} hint={`${fmtNum(m.newToday)} today`} />
            <Tile icon={Timer} tint="#eda100" label="Avg. Session Duration" value={fmtDur(m.avgSessionDuration)} />

            <Tile icon={CircleCheck} tint="#e8699b" label="Lesson Completion" value={m.lessonCompletionRate} suffix="%" />
            <Tile icon={Dumbbell} tint="#e8833a" label="Brain Gym Sessions" value={m.brainGymSessions} />
            <Tile icon={Target} tint="#2a78d6" label="Practice Attempts" value={m.practiceAttempts} />
            <Tile icon={Bot} tint="#8B5CF6" label="AI Teacher Sessions" value={m.aiTeacherSessions} hint={`${fmtNum(m.doubtsAsked)} doubts`} />
            <Tile icon={Gauge} tint="#1baf7a" label="Weekly Engagement" value={m.weeklyEngagement} suffix="%" />
            <Tile icon={ActivityIcon} tint="#19a0b8" label="Monthly Engagement" value={m.monthlyEngagement} suffix="%" />
          </>
        ) : null}
      </div>

      {/* ── trends + leaderboard ─────────────────────────────────────────── */}
      <div className="an-row three">
        <Card>
          <SectionHead title="Daily Active Users" tone="indigo" right={<ViewAll href="/reports" />} />
          {trends.loading && !t ? <Skel h={190} />
            : series(t?.dailyActiveUsers).some((d) => d.value > 0)
              ? <AreaChart series={series(t?.dailyActiveUsers)} height={190} color="#8B5CF6" suffix=" active" variant="line"
                  ariaLabel="Daily active users over the selected window" />
              : <EmptyState icon={ActivityIcon} title="No activity in this window" />}
        </Card>

        <Card>
          <SectionHead title="Weekly Active Users" tone="blue" right={<ViewAll href="/reports" />} />
          {trends.loading && !t ? <Skel h={190} />
            : series(t?.weeklyActiveUsers).some((d) => d.value > 0)
              ? <AreaChart series={series(t?.weeklyActiveUsers)} height={190} color="#2a78d6" suffix=" active"
                  ariaLabel="Weekly active users over the selected window" />
              : <EmptyState icon={ActivityIcon} title="No activity in this window" />}
        </Card>

        <Card>
          <SectionHead title="Top Performing Students" tone="emerald" right={<ViewAll href="/people/students" />} />
          {top.loading && !top.data ? <div className="col gap-10">{[0, 1, 2].map((i) => <Skel key={i} h={40} />)}</div>
            : top.data?.topStudents.length ? (
              <div className="col" style={{ gap: 2 }}>
                {top.data.topStudents.slice(0, 5).map((s, i) => (
                  <div key={s.id} className="an-rank">
                    <span className="an-rank-n tnum">{i + 1}</span>
                    <span className="avatar" style={{ background: colorFor(s.id) }}>{initials(s.name)}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="strong truncate" style={{ fontSize: 13.5 }}>{s.name}</div>
                      <div className="faint" style={{ fontSize: 11.5 }}>
                        {s.grade || '—'}{s.sessions ? ` · ${s.sessions} sessions` : ''}
                      </div>
                    </div>
                    <div className="col" style={{ alignItems: 'flex-end', gap: 1 }}>
                      <span className="strong tnum" style={{ fontSize: 13 }}>{fmtNum(s.xp)} XP</span>
                      {s.accuracy !== null && <span className="faint" style={{ fontSize: 11 }}>{s.accuracy}% acc</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={Trophy} title="No activity yet" message="Top students appear once they earn XP." />}
        </Card>
      </div>

      {/* ── weaknesses + the merged feed ─────────────────────────────────── */}
      <div className="an-row weak">
        <Card>
          <SectionHead title="Weak Subjects" tone="orange" />
          {top.loading && !top.data ? <BarsSkel />
            : top.data?.weakSubjects.length
              ? <BarList tone="orange" valueSuffix=" mistakes"
                  items={top.data.weakSubjects.map((r) => ({ label: r.subject, sub: `${r.students} students`, value: r.mistakes }))} />
              : <EmptyState icon={Target} title="No weak subjects" message="These emerge from unresolved mistakes." />}
        </Card>

        <Card>
          <SectionHead title="Weak Chapters" tone="red" right={<ViewAll href="/reports" />} />
          {top.loading && !top.data ? <BarsSkel />
            : top.data?.weakChapters.length
              ? <BarList tone="red" valueSuffix=" mistakes"
                  items={top.data.weakChapters.map((r) => ({ label: r.chapter, sub: `${r.subject} · ${r.students} students`, value: r.mistakes }))} />
              : <EmptyState icon={Target} title="No weak chapters" message="These emerge from unresolved mistakes." />}
        </Card>

        <Card>
          <SectionHead title="Recent Activity" tone="indigo" right={<ViewAll href="/audit" />} />
          {activity.loading && !activity.data ? <div className="col gap-8">{[0, 1, 2, 3].map((i) => <Skel key={i} h={38} />)}</div>
            : recent.length ? (
              <div className="an-table-wrap">
                <table className="an-table">
                  <thead>
                    <tr><th>Activity</th><th>Student / Details</th><th>Status</th><th style={{ textAlign: 'right' }}>Date</th></tr>
                  </thead>
                  <tbody>
                    {recent.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="row gap-8" style={{ alignItems: 'center' }}>
                            <span className="an-row-ic" style={{ background: r.tint + '1a', color: r.tint }}>
                              <r.icon size={14} strokeWidth={2.3} />
                            </span>
                            <span className="strong" style={{ fontSize: 12.5 }}>{r.kind}</span>
                          </span>
                        </td>
                        <td>
                          <div className="truncate" style={{ fontSize: 12.5, fontWeight: 600 }}>{r.title}</div>
                          <div className="faint truncate" style={{ fontSize: 11 }}>{r.detail}</div>
                        </td>
                        <td><Badge tone={r.tone} dot={false}>{r.status}</Badge></td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="faint nowrap" style={{ fontSize: 11.5, fontWeight: 700 }}>{timeAgo(r.at)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState icon={Clock} title="Nothing yet" message="Signups, lessons and sessions appear here as they happen." />}
        </Card>
      </div>

      {/* ── realtime, one tab at a time ──────────────────────────────────── */}
      <Card>
        <SectionHead title="Recent Platform Activity" tone="cyan" right={<ViewAll href="/reports" />} />
        <div className="an-tabs" role="tablist">
          {TABS.map((tb, i) => (
            <button key={tb.label} role="tab" aria-selected={tab === i}
              className={'an-tab' + (tab === i ? ' on' : '')} onClick={() => setTab(i)}>
              <tb.icon size={13} /> {tb.label}
              {!!tb.items.length && <span className="an-tab-n">{tb.items.length}</span>}
            </button>
          ))}
        </div>

        {activity.loading && !activity.data
          ? <div className="an-cards">{[0, 1, 2, 3].map((i) => <Skel key={i} h={62} r={12} />)}</div>
          : TABS[tab].items.length ? (
            <div className="an-cards" key={tab}>
              {TABS[tab].items.slice(0, 8).map((it) => (
                <div key={it.id} className="an-card">
                  <span className="avatar" style={{ background: colorFor(it.id) }}>{initials(it.name)}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="strong truncate" style={{ fontSize: 13 }}>{it.name}</div>
                    <div className="faint truncate" style={{ fontSize: 11.5 }}>{it.sub}</div>
                  </div>
                  <span className="faint nowrap" style={{ fontSize: 11, fontWeight: 700 }}>{timeAgo(it.at)}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={TABS[tab].icon} title="Nothing yet" />}
      </Card>

      {/* ── kept, not discarded ──────────────────────────────────────────── */}
      <details className="an-more">
        <summary>
          <ChevronDown size={15} /> More insights
          <span className="faint" style={{ fontWeight: 500, marginLeft: 6 }}>
            students at risk, most-used lessons and Brain Gym activities
          </span>
        </summary>
        <div className="an-row three" style={{ marginTop: 14 }}>
          <Card>
            <SectionHead title="Students at Risk" tone="red" right={<TriangleAlert size={15} color={S.red} />} />
            {top.data?.studentsAtRisk.length ? (
              <div className="col" style={{ gap: 2 }}>
                {top.data.studentsAtRisk.slice(0, 5).map((s) => (
                  <div key={s.id} className="an-rank">
                    <span className="avatar" style={{ background: colorFor(s.id) }}>{initials(s.name)}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="strong truncate" style={{ fontSize: 13.5 }}>{s.name}</div>
                      <div className="faint" style={{ fontSize: 11.5 }}>{s.grade || '—'} · {s.openMistakes} open mistakes</div>
                    </div>
                    <Badge tone="red" dot={false}>{s.accuracy ?? 0}%</Badge>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={CircleCheck} title="No at-risk students" message="Students below 50% over 3+ sessions appear here." />}
          </Card>
          <Card>
            <SectionHead title="Most Used Lessons" tone="purple" />
            {top.data?.mostUsedLessons.length
              ? <BarList tone="purple" items={top.data.mostUsedLessons.map((r) => ({ label: r.title, sub: r.subject, value: r.count }))} />
              : <EmptyState icon={BookOpen} title="No lessons yet" />}
          </Card>
          <Card>
            <SectionHead title="Most Used Brain Gym" tone="orange" />
            {top.data?.mostUsedBrainGym.length
              ? <BarList tone="orange" valueSuffix=" plays" items={top.data.mostUsedBrainGym.map((r) => ({ label: r.activity, sub: `${r.accuracy}% accuracy`, value: r.count }))} />
              : <EmptyState icon={Dumbbell} title="No Brain Gym data" />}
          </Card>
        </div>
      </details>

      <style jsx global>{`
        @keyframes an-rise { from { opacity: 0; transform: translateY(10px); } }
        @keyframes an-slide { from { opacity: 0; transform: translateX(10px); } }

        .an-head { display: flex; align-items: flex-start; gap: 18px; flex-wrap: wrap; justify-content: space-between; }
        .an-title { font-size: 30px; font-weight: 900; letter-spacing: -.03em; color: var(--accent-ink); line-height: 1.1; }
        .an-range-label {
          display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 11px;
          border: 1px solid var(--line); background: var(--card); font-size: 12.5px; font-weight: 650; color: var(--sub, var(--muted));
        }
        .an-seg { display: flex; padding: 3px; border-radius: 11px; background: var(--surface-2); border: 1px solid var(--line); }
        .an-seg-btn {
          padding: 6px 15px; border: 0; border-radius: 8px; background: transparent; cursor: pointer;
          font-size: 12.5px; font-weight: 700; color: var(--muted);
          transition: background .2s, color .2s;
        }
        .an-seg-btn:hover { color: var(--ink); background: rgba(79,109,245,.08); }
        .an-seg-btn.on { background: var(--accent); color: #fff; }

        .crumb-link > svg { transition: transform .22s cubic-bezier(.22,1,.36,1); }
        .crumb-link:hover > svg { transform: translateX(3px); }

        /* The reset control turns as it is pressed — the gesture it stands for. */
        .an-reset > svg { transition: transform .45s cubic-bezier(.22,1,.36,1); }
        .an-reset:hover:not(:disabled) > svg { transform: rotate(-180deg); }

        .an-filters {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 12px 14px; border-radius: 14px; border: 1px solid var(--line); background: var(--card);
        }
        .an-reset { margin-left: auto; }
        .an-filters .select { transition: border-color .2s, box-shadow .2s; }
        .an-filters .select:hover { border-color: var(--accent); }
        .an-filters .select:focus { box-shadow: 0 0 0 3px rgba(79,109,245,.14); }
        .an-reset:disabled { opacity: .4; cursor: not-allowed; }

        /* Six across on a wide screen, folding down rather than squeezing. */
        .an-tiles { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
        @media (max-width: 1500px) { .an-tiles { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 1040px) { .an-tiles { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 720px)  { .an-tiles { grid-template-columns: repeat(2, 1fr); } }

        .an-tile {
          display: flex; align-items: center; gap: 12px; padding: 14px;
          border: 1px solid var(--line); border-radius: 14px; background: var(--card);
          animation: an-rise .36s cubic-bezier(.22,1,.36,1) both;
          transition: transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s, border-color .22s;
        }
        .an-tile::after {
          /* A soft wash that grows from the icon corner on hover, so the card
             reacts as one surface rather than just lifting. */
          content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          background: radial-gradient(130% 110% at 0% 0%, rgba(79,109,245,.1), transparent 62%);
          opacity: 0; transition: opacity .28s ease;
        }
        .an-tile { position: relative; overflow: hidden; }
        .an-tile:hover { transform: translateY(-3px); box-shadow: var(--shadow-md, var(--shadow-sm)); border-color: var(--accent); }
        .an-tile:hover::after { opacity: 1; }
        .an-tile:hover .an-tile-ic { transform: scale(1.1) rotate(-5deg); }
        .an-tile:hover .an-tile-val { transform: translateX(2px); }
        .an-tile-val { transition: transform .26s cubic-bezier(.22,1,.36,1); }
        .an-tile:nth-child(n+2)  { animation-delay: 40ms; }
        .an-tile:nth-child(n+5)  { animation-delay: 80ms; }
        .an-tile:nth-child(n+9)  { animation-delay: 120ms; }
        .an-tile-ic {
          width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; flex: 0 0 auto;
          transition: transform .3s cubic-bezier(.34,1.56,.64,1);
        }
        .an-tile-label { font-size: 11.5px; font-weight: 650; color: var(--muted); line-height: 1.3; }
        .an-tile-val { font-size: 23px; font-weight: 900; letter-spacing: -.025em; color: var(--ink); line-height: 1.15; margin-top: 2px; }
        .an-tile-hint { font-size: 10.5px; color: var(--faint); margin-top: 1px; }

        .an-row { display: grid; gap: 16px; align-items: start; }
        /* Chart and list cards answer the pointer too, so the whole page feels
           live rather than only the tiles. */
        .an-row > .card { transition: transform .24s cubic-bezier(.22,1,.36,1), box-shadow .24s, border-color .24s; }
        .an-row > .card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md, var(--shadow-sm)); }
        .an-row.three { grid-template-columns: 1fr 1fr .85fr; }
        .an-row.weak  { grid-template-columns: .9fr 1fr 1.35fr; }
        @media (max-width: 1240px) { .an-row.three, .an-row.weak { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 860px)  { .an-row.three, .an-row.weak { grid-template-columns: 1fr; } }

        .an-rank {
          display: flex; align-items: center; gap: 11px; padding: 9px 6px;
          border-bottom: 1px solid var(--hair); border-radius: 9px;
          transition: background .2s, transform .2s cubic-bezier(.22,1,.36,1);
        }
        .an-rank:hover { background: var(--surface-2); transform: translateX(3px); }
        .an-rank:hover .avatar { transform: scale(1.1); }
        .an-rank .avatar { transition: transform .26s cubic-bezier(.34,1.56,.64,1); }
        /* The leading position earns a small highlight — a leaderboard where
           first place looks like fourth is just a list. */
        .an-rank:first-child .an-rank-n { color: var(--accent); font-size: 13px; }
        .an-rank:last-child { border-bottom: 0; }
        .an-rank-n { width: 18px; font-size: 12px; font-weight: 800; color: var(--faint); flex: 0 0 auto; }

        .an-table-wrap { overflow-x: auto; }
        .an-table { width: 100%; border-collapse: collapse; }
        .an-table th {
          text-align: left; font-size: 10.5px; font-weight: 800; letter-spacing: .05em;
          text-transform: uppercase; color: var(--faint); padding: 0 10px 8px; white-space: nowrap;
        }
        .an-table td { padding: 9px 10px; border-top: 1px solid var(--hair); vertical-align: middle; }
        .an-table tbody tr { transition: background .18s; }
        .an-table tbody tr { position: relative; }
        .an-table tbody tr:hover { background: var(--surface-2); }
        .an-table tbody tr td:first-child { box-shadow: inset 2px 0 0 transparent; transition: box-shadow .2s; }
        .an-table tbody tr:hover td:first-child { box-shadow: inset 2px 0 0 var(--accent); }
        .an-table tbody tr:hover .an-row-ic { transform: scale(1.12); }
        .an-row-ic { transition: transform .26s cubic-bezier(.34,1.56,.64,1); }
        .an-row-ic { width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; flex: 0 0 auto; }

        .an-tabs { display: flex; gap: 4px; flex-wrap: wrap; border-bottom: 1px solid var(--hair); margin-bottom: 14px; }
        .an-tab {
          display: inline-flex; align-items: center; gap: 6px; padding: 9px 13px;
          border: 0; border-bottom: 2px solid transparent; background: transparent; cursor: pointer;
          font-size: 12.5px; font-weight: 650; color: var(--muted);
          transition: color .2s, border-color .2s;
        }
        .an-tab:hover { color: var(--ink); }
        .an-tab:hover .an-tab-n { background: rgba(79,109,245,.14); color: var(--accent-ink); }
        .an-tab > svg { transition: transform .26s cubic-bezier(.34,1.56,.64,1); }
        .an-tab:hover > svg { transform: scale(1.15) rotate(-6deg); }
        .an-tab-n { transition: background .2s, color .2s; }
        .an-tab.on { color: var(--accent-ink); border-bottom-color: var(--accent); }
        .an-tab-n {
          font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 99px;
          background: var(--surface-2); color: var(--muted);
        }
        .an-tab.on .an-tab-n { background: rgba(79,109,245,.14); color: var(--accent-ink); }

        .an-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(248px, 1fr)); gap: 10px; }
        .an-card {
          display: flex; align-items: center; gap: 11px; padding: 12px;
          border: 1px solid var(--line); border-radius: 12px; background: var(--surface-2);
          animation: an-slide .3s cubic-bezier(.22,1,.36,1) both;
          transition: transform .2s cubic-bezier(.22,1,.36,1), border-color .2s;
        }
        .an-card:hover { transform: translateY(-2px); border-color: var(--accent); background: var(--card); box-shadow: var(--shadow-sm); }
        .an-card:hover .avatar { transform: scale(1.08); }
        .an-card .avatar { transition: transform .26s cubic-bezier(.34,1.56,.64,1); }
        .an-cards > *:nth-child(2) { animation-delay: 45ms; }
        .an-cards > *:nth-child(3) { animation-delay: 90ms; }
        .an-cards > *:nth-child(4) { animation-delay: 135ms; }

        .an-more > summary {
          display: flex; align-items: center; gap: 7px; cursor: pointer; list-style: none;
          padding: 11px 14px; border-radius: 12px; border: 1px solid var(--line); background: var(--card);
          font-size: 13px; font-weight: 700; color: var(--sub, var(--muted));
        }
        .an-more > summary::-webkit-details-marker { display: none; }
        .an-more > summary:hover { border-color: var(--accent); }
        .an-more[open] > summary svg { transform: rotate(180deg); }
        .an-more > summary svg { transition: transform .22s cubic-bezier(.22,1,.36,1); }

        @media (prefers-reduced-motion: reduce) {
          .an-tile, .an-card { animation: none !important; }
          .an-tile:hover, .an-card:hover, .an-rank:hover, .an-row > .card:hover { transform: none; }
          .an-tile:hover .an-tile-ic, .an-tile:hover .an-tile-val,
          .an-rank:hover .avatar, .an-card:hover .avatar,
          .an-table tbody tr:hover .an-row-ic, .an-tab:hover > svg,
          .crumb-link:hover > svg, .an-reset:hover:not(:disabled) > svg { transform: none; }
          .an-tile::after { transition: none; }
          .an-more > summary svg { transition: none; }
        }
      `}</style>
    </div>
  )
}

function ViewAll({ href }: { href: string }) {
  return <a href={href} className="crumb-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={13} /></a>
}

function FilterSelect({ icon: Icon, value, onChange, placeholder, options }: {
  icon: any; value: string; onChange: (v: string) => void; placeholder: string; options?: string[]
}) {
  return (
    <div className="row gap-6" style={{ alignItems: 'center' }}>
      <Icon size={14} color="var(--faint)" />
      <select className="select" style={{ width: 'auto', padding: '7px 10px', fontSize: 12.5 }}
        value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder}>
        <option value="">{placeholder}</option>
        {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function BarsSkel() {
  return <div className="col gap-12">{[0, 1, 2, 3].map((i) => (
    <div key={i}><Skel h={10} w={`${80 - i * 8}%`} style={{ marginBottom: 6 }} /><Skel h={8} /></div>
  ))}</div>
}
