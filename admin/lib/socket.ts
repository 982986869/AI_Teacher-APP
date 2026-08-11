'use client'

import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'
import { getToken } from './api'

export interface SupportSocketHandlers {
  onTicketNew?: (ticket: unknown) => void
  onTicketTouched?: (payload: { id: string }) => void
  onMessage?: (payload: { ticketId: string }) => void
  onStatus?: (payload: { id: string }) => void
  // THE SOCKET IS NOT THE SOURCE OF TRUTH. Everything that happened while this tab was
  // disconnected — a sleeping laptop, a dropped VPN — arrived at a socket that was not
  // listening, and no event will ever be re-sent. Only a REST refetch recovers it, which
  // is why every consumer gets a reconnect hook (the app has the same one, see
  // src/realtime/supportSocket.js). Fires on the first connect too; refetching data you
  // already have is the cheap half of this trade.
  onReconnect?: () => void
}

// One connection for the console. Every handler is read through a ref so a re-render
// never tears the socket down and reconnects — that would drop the staff:queue room and
// silently stop live updates.
export function useSupportSocket(handlers: SupportSocketHandlers, ticketId?: string | null) {
  const ref = useRef(handlers)
  ref.current = handlers
  const sockRef = useRef<Socket | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'
    const socket = io(url, { auth: { token }, path: '/socket.io', transports: ['websocket', 'polling'] })
    sockRef.current = socket

    socket.on('ticket:new', (t) => ref.current.onTicketNew?.(t))
    socket.on('ticket:touched', (p) => ref.current.onTicketTouched?.(p))
    socket.on('message', (p) => ref.current.onMessage?.(p))
    socket.on('status', (p) => ref.current.onStatus?.(p))
    // Registered here, not in the room effect below, because a console with no ticket
    // selected still has a queue that went stale while the connection was down.
    socket.on('connect', () => ref.current.onReconnect?.())

    return () => { socket.close(); sockRef.current = null }
  }, [])

  // Rejoining on every reconnect is what makes the thread survive a dropped connection.
  useEffect(() => {
    const socket = sockRef.current
    if (!socket || !ticketId) return
    const join = () => socket.emit('ticket:join', ticketId)
    join()
    socket.on('connect', join)
    return () => { socket.emit('ticket:leave', ticketId); socket.off('connect', join) }
  }, [ticketId])
}
