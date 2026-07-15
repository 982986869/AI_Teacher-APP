'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Spinner } from '@/components/ui'

// Entry point: bounce to the dashboard or the login screen once auth is resolved.
export default function Home() {
  const { admin, loading } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (loading) return
    router.replace(admin ? '/dashboard' : '/login')
  }, [admin, loading, router])
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <Spinner size={26} />
    </div>
  )
}
