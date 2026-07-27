'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api, setToken, clearToken, getToken, setUnauthorizedHandler } from './api'
import type { Admin, Permission } from './types'

interface AuthCtx {
  admin: Admin | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  can: (perm: Permission) => boolean
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAdmin(null)
      router.replace('/login')
    })
  }, [router])

  useEffect(() => {
    let alive = true
    async function boot() {
      if (!getToken()) { setLoading(false); return }
      try {
        const data = await api<{ admin: Admin }>('/auth/me')
        if (alive) setAdmin(data.admin)
      } catch {
        clearToken()
      } finally {
        if (alive) setLoading(false)
      }
    }
    boot()
    return () => { alive = false }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ token: string; admin: Admin }>('/auth/login', { method: 'POST', body: { email, password } })
    setToken(data.token)
    setAdmin(data.admin)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setAdmin(null)
    router.replace('/login')
  }, [router])

  const can = useCallback((perm: Permission) => !!admin && admin.permissions.includes(perm), [admin])

  return <Ctx.Provider value={{ admin, loading, login, logout, can }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
