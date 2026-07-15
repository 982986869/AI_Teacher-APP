'use client'

import { useState } from 'react'
import { CircleCheck, Repeat, Activity, Users, Target, Dumbbell, ClipboardList } from 'lucide-react'
import { useApi } from '@/components/useApi'
import { Card, SectionHead, ErrorState, Skel, EmptyState } from '@/components/ui'
import { LineChart, BarList, ColumnChart, Donut } from '@/components/charts'
import { S } from '@/lib/theme'

const WINDOWS = [{ d: 7, l: '7 days' }, { d: 30, l: '30 days' }, { d: 90, l: '90 days' }]

export default function ReportsPage() {
  const [days, setDays] = useState(30)
  const { data, loading, error, reload } = useApi<any>('/reports', { days })

  const acc = (data?.accuracyOverTime || []).map((r: any) => ({ label: r.date.slice(5), value: r.accuracy }))
  const usage = (data?.activeUsersOverTime || []).map((r: any) => ({ label: r.date.slice(5), value: r.users }))

  return (
    <div className="col gap-16">
      <div className="page-head">
        <div>
          <h1 className="h1">Reports</h1>
          <div className="sub">Learning analytics across the platform — completion, retention, accuracy and weak areas.</div>
        </div>
        <div className="actions">
          <div className="tabs">
            {WINDOWS.map((w) => <button key={w.d} className={`tab ${days === w.d ? 'active' : ''}`} onClick={() => setDays(w.d)}>{w.l}</button>)}
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={reload} />}

      {/* Rate cards */}
      <div className="grid cols-4">
        <Card className="col" style={{ alignItems: 'center', gap: 8 }}>
          <SectionHead title="Lesson completion" tone="emerald" />
          {loading ? <Skel h={120} w={120} r={60} /> : <Donut value={data?.completion?.rate ?? null} tone="emerald" label={`${data?.completion?.completed ?? 0} of ${data?.completion?.started ?? 0}`} />}
        </Card>
        <Card className="col" style={{ alignItems: 'center', gap: 8 }}>
          <SectionHead title="Weekly retention" tone="blue" />
          {loading ? <Skel h={120} w={120} r={60} /> : <Donut value={data?.retention?.rate ?? null} tone="blue" label={`${data?.retention?.returned ?? 0} returned`} />}
        </Card>
        <Card className="grow">
          <SectionHead title="Active users" tone="indigo" />
          {loading ? <Skel h={140} /> : usage.some((u: any) => u.value) ? <LineChart series={usage} tone="indigo" height={150} /> : <EmptyState icon={Users} title="No activity" message="No active users in this window." />}
        </Card>
      </div>

      {/* Accuracy trend */}
      <Card>
        <SectionHead title="Average accuracy over time" tone="gold" />
        {loading ? <Skel h={200} /> : acc.some((a: any) => a.value !== null) ? <LineChart series={acc} tone="gold" height={220} yMax={100} /> : <EmptyState icon={Activity} title="No accuracy data" message="Accuracy appears once students complete Brain Gym sessions." />}
      </Card>

      <div className="grid cols-2">
        <Card>
          <SectionHead title="Weak topics" tone="orange" />
          {loading ? <BarsSkel /> : data?.weakTopics?.length
            ? <BarList tone="orange" valueSuffix=" mistakes" items={data.weakTopics.map((t: any) => ({ label: t.chapter, sub: `${t.subject} · ${t.students} students`, value: t.mistakes }))} />
            : <EmptyState icon={Target} title="No weak topics" message="Weak topics emerge from unresolved mistakes." />}
        </Card>
        <Card>
          <SectionHead title="Brain Gym by category" tone="purple" />
          {loading ? <Skel h={180} /> : data?.brainGym?.length
            ? <ColumnChart tone="purple" suffix="%" items={data.brainGym.map((c: any) => ({ label: c.category, value: c.accuracy }))} />
            : <EmptyState icon={Dumbbell} title="No Brain Gym data" message="Category accuracy appears with more plays." />}
        </Card>
      </div>

      <Card>
        <SectionHead title="Practice performance by subject" tone="cyan" />
        {loading ? <BarsSkel /> : data?.practiceBySubject?.length
          ? <BarList tone="cyan" valueSuffix="% avg" items={data.practiceBySubject.map((s: any) => ({ label: s.subject, sub: `${s.attempts} attempts`, value: s.avgScore }))} />
          : <EmptyState icon={ClipboardList} title="No mock attempts" message="Subject performance appears once students take mock tests." />}
      </Card>
    </div>
  )
}

function BarsSkel() { return <div className="col gap-12">{[0, 1, 2, 3, 4].map((i) => <div key={i}><Skel h={10} w={`${80 - i * 8}%`} style={{ marginBottom: 6 }} /><Skel h={8} /></div>)}</div> }
