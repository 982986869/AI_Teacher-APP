'use client'

import { Server, Database, Cog, HardDriveDownload, Clock, GitBranch, type LucideIcon } from 'lucide-react'
import { fmtDateTime } from '@/lib/format'
import type { DashboardData } from '@/lib/types'

type Status = 'ok' | 'warn' | 'down' | 'pending'
interface Row { icon: LucideIcon; label: string; value: string; status: Status }

export function PlatformHealth({ platform }: { platform: DashboardData['platform'] }) {
  const dbStatus: Status = platform.database === 'ok' ? 'ok' : 'down'
  const rows: Row[] = [
    { icon: Server, label: 'API', value: platform.api === 'ok' ? 'Operational' : 'Degraded', status: platform.api === 'ok' ? 'ok' : 'down' },
    { icon: Database, label: 'Database', value: dbStatus === 'ok' ? 'Connected' : 'Unreachable', status: dbStatus },
    { icon: Cog, label: 'Background jobs', value: platform.backgroundJobs ?? 'Not tracked yet', status: platform.backgroundJobs ? 'ok' : 'pending' },
    { icon: HardDriveDownload, label: 'Last backup', value: platform.lastBackup ? fmtDateTime(platform.lastBackup) : 'Not tracked yet', status: platform.lastBackup ? 'ok' : 'pending' },
    { icon: Clock, label: 'Server time', value: fmtDateTime(platform.serverTime), status: 'ok' },
    { icon: GitBranch, label: 'Version', value: `v${platform.version} · ${platform.environment}`, status: 'ok' },
  ]
  return (
    <div className="col">
      {rows.map((r) => (
        <div key={r.label} className="health-row">
          <span className={`status-dot ${r.status}`} />
          <r.icon size={15} color="var(--muted)" strokeWidth={2.2} />
          <span style={{ fontWeight: 800, fontSize: 13 }}>{r.label}</span>
          <span className="ml-auto row gap-8" style={{ alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 12.5, color: r.status === 'pending' ? 'var(--faint)' : 'var(--sub)' }}>{r.value}</span>
            {r.status === 'pending' && <span className="pending-tag" style={{ margin: 0 }}>Pending</span>}
          </span>
        </div>
      ))}
    </div>
  )
}
