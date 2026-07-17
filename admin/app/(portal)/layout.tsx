'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Shell } from '@/components/Shell'
import { Spinner } from '@/components/ui'

// Auth gate for every portal page. Unauthenticated → /login. While auth is resolving
// we show a centered spinner so protected content never flashes.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !admin) router.replace('/login')
  }, [admin, loading, router])

  if (loading || !admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner size={26} />
      </div>
    )
  }

  return <Shell>{children}</Shell>
}
