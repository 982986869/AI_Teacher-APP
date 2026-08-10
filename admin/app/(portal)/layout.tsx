'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { apiRoot } from '@/lib/api'
import { useSupportSocket } from '@/lib/socket'
import { Shell } from '@/components/Shell'
import { Spinner } from '@/components/ui'

// Auth gate for every portal page. Unauthenticated → /login. While auth is resolving
// we show a centered spinner so protected content never flashes.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { admin, loading, can } = useAuth()
  const router = useRouter()
  const [supportUnread, setSupportUnread] = useState(0)

  useEffect(() => {
    if (!loading && !admin) router.replace('/login')
  }, [admin, loading, router])

  // The unread count rides along with the queue response — there is no separate count
  // endpoint on purpose. Gated on the permission so a content manager never fires a 403
  // on every page load.
  const refreshUnread = useCallback(() => {
    if (!can('support.view')) return
    apiRoot<{ unreadCount: number }>('/support/queue', { params: { status: 'open' } })
      .then((data) => setSupportUnread(data.unreadCount))
      .catch(() => {})
  }, [can])

  useEffect(() => {
    refreshUnread()
  }, [refreshUnread])

  useSupportSocket({
    onTicketNew: refreshUnread,
    onTicketTouched: refreshUnread,
  })

  if (loading || !admin) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner size={26} />
      </div>
    )
  }

  return <Shell supportUnread={supportUnread}>{children}</Shell>
}
