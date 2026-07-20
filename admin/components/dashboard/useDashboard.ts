'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/components/useApi'
import type { DashboardData } from '@/lib/types'

// Single source of truth for the dashboard. Wraps the fetch hook and tracks a
// `lastUpdated` timestamp for the "updated Xs ago" pill + manual refresh.
export function useDashboard() {
  const { data, loading, error, reload } = useApi<DashboardData>('/dashboard')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => { if (data) setLastUpdated(new Date()) }, [data])

  return { data, loading, error, reload, lastUpdated }
}
