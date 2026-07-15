'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from '@/lib/api'

interface State<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

// Declarative GET hook with loading/error/retry. `deps` re-fetch on change; `key`
// (usually the path+params) is what actually changes to trigger a reload.
export function useApi<T = any>(
  path: string | null,
  params?: Record<string, string | number | undefined | null>,
): State<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!path)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)
  const paramsKey = JSON.stringify(params || {})
  const active = useRef(true)

  useEffect(() => {
    active.current = true
    if (!path) { setLoading(false); return }
    setLoading(true)
    setError(null)
    api<T>(path, { params })
      .then((d) => { if (active.current) { setData(d); setLoading(false) } })
      .catch((e: ApiError) => {
        if (!active.current) return
        // 401 is handled globally (redirect) — don't flash an inline error for it.
        if (e.status !== 401) setError(e.message)
        setLoading(false)
      })
    return () => { active.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, paramsKey, nonce])

  const reload = useCallback(() => setNonce((n) => n + 1), [])
  return { data, loading, error, reload }
}

// Debounce a rapidly-changing value (e.g. a search box) before it drives a query.
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return v
}
