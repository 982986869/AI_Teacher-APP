'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { Spinner } from '@/components/ui'
import { S } from '@/lib/theme'

export default function LoginPage() {
  const { admin, loading, login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (!loading && admin) router.replace('/dashboard') }, [admin, loading, router])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      await login(email.trim(), password)
      router.replace('/dashboard')
    } catch (e: any) {
      setErr(e?.message || 'Sign in failed')
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20, background: 'radial-gradient(circle at 20% 10%, #EEF0FC, var(--canvas))' }}>
      <div style={{ width: 'min(420px, 100%)' }}>
        <div className="col" style={{ alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <span className="sidebar-logo" style={{ width: 52, height: 52, borderRadius: 16 }}><GraduationCap size={26} /></span>
          <div className="col" style={{ alignItems: 'center', gap: 2 }}>
            <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: -0.5 }}>Ailernova Admin</span>
            <span style={{ color: S.muted, fontWeight: 600, fontSize: 13 }}>Sign in to the operations console</span>
          </div>
        </div>

        <form onSubmit={submit} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="field">
            <label>Email</label>
            <div className="search">
              <Mail size={16} />
              <input className="input" type="email" autoComplete="username" placeholder="you@ailernova.com"
                value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
            </div>
          </div>
          <div className="field">
            <label>Password</label>
            <div className="search">
              <Lock size={16} />
              <input className="input" type="password" autoComplete="current-password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          {err && (
            <div style={{ background: S.redSoft, color: S.red, padding: '10px 12px', borderRadius: 12, fontWeight: 700, fontSize: 13 }}>
              {err}
            </div>
          )}

          <button className="btn btn-primary block" type="submit" disabled={busy} style={{ padding: '13px 16px' }}>
            {busy ? <Spinner /> : <>Sign in <ArrowRight size={17} /></>}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: S.faint, fontSize: 12, fontWeight: 600, marginTop: 16 }}>
          Access is restricted to authorised administrators.
        </p>
      </div>
    </div>
  )
}
