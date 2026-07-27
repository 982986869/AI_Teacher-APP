'use client'

import Link from 'next/link'
import { ArrowRight, Users, UserPlus, Repeat } from 'lucide-react'
import { useApi } from '@/components/useApi'
import { PageHero, SectionLabel, MiniStat, Card, SectionHead, Skel, ErrorState } from '@/components/ui'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { PEOPLE_AREAS } from '@/components/nav'
import { accent } from '@/lib/theme'
import type { DashboardData } from '@/lib/types'

export default function PeoplePage() {
  const { data, loading, error, reload } = useApi<DashboardData>('/dashboard')

  const counts: Record<string, number | null> = {
    students: data?.overview.totalStudents ?? null,
    parents: data?.overview.parents ?? null,
    team: data?.overview.admins ?? null,
  }
  const signups = (data?.activity || []).filter((a) => a.type === 'signup').slice(0, 6)

  return (
    <>
      <PageHero
        eyebrow="People"
        title="People"
        subtitle="Students, parents and your admin team — search anyone, open a full profile, and manage access."
      />

      {/* Area cards — each opens a complete flow (list → profile). */}
      <div className="flow three">
        {PEOPLE_AREAS.map((area) => {
          const a = accent(area.tone)
          return (
            <Link key={area.key} href={area.href} className="hub-card">
              <div className="row between">
                <span className="hub-icon" style={{ background: a.soft }}><area.icon size={22} color={a.color} strokeWidth={2.3} /></span>
                <span className="hub-count tnum">{loading ? <Skel w={40} h={26} /> : (counts[area.key] ?? '—')}</span>
              </div>
              <div>
                <div className="hub-name">{area.label}</div>
                <div className="hub-blurb">{area.blurb}</div>
              </div>
              <span className="hub-go">View all <ArrowRight size={14} /></span>
            </Link>
          )
        })}
      </div>

      {error && !data ? (
        <Card style={{ marginTop: 24 }}><ErrorState message={error} onRetry={reload} /></Card>
      ) : (
        <>
          <SectionLabel>This week</SectionLabel>
          <div className="flow three">
            <MiniStat icon={UserPlus} tone="indigo" label="New students this week" value={data?.overview.newRegistrationsWeek ?? null} />
            <MiniStat icon={Users} tone="blue" label="Active this week" value={data?.overview.activeThisWeek ?? null} />
            <MiniStat icon={Repeat} tone="emerald" label="Returning users" value={data?.overview.returningUsers ?? null} />
          </div>

          <SectionLabel>Recent signups</SectionLabel>
          <Card>
            <SectionHead title="Newest accounts" tone="indigo" right={<Link href="/people/students" className="crumb-link">All students</Link>} />
            {loading && !data
              ? <div className="col gap-12" style={{ padding: '4px 0' }}>{[0, 1, 2, 3].map((i) => <Skel key={i} h={40} r={10} />)}</div>
              : <ActivityFeed items={signups} />}
          </Card>
        </>
      )}
    </>
  )
}
