'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QueueList } from '@/components/support/QueueList'
import { Thread } from '@/components/support/Thread'
import { CallLogModal } from '@/components/support/CallLogModal'
import { ResolveModal } from '@/components/support/ResolveModal'
import { useDebounced } from '@/components/useApi'
import { useSupportSocket } from '@/lib/socket'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { apiRoot } from '@/lib/api'
import { S } from '@/lib/theme'
import type { CallOutcome, Ticket, TicketDetail, TicketStatus } from '@/lib/types'

export default function SupportPage() {
  const { can } = useAuth()
  const toast = useToast()

  // 'open' is the SERVER's word for work-not-yet-resolved — it matches both `open` and
  // `assigned` (see queue in server/src/controllers/support.controller.js). Tickets are
  // born `assigned` whenever their team has anyone on it, so a literal match here showed
  // an empty console. There is deliberately no separate Assigned tab: "somebody's name is
  // on it" is not a different pile of work, it is the same pile.
  const [status, setStatus] = useState<TicketStatus | 'all'>('open')
  const [team, setTeam] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 300)

  const [rawTickets, setRawTickets] = useState<Ticket[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // Mirrors selectedId so async responses (detail fetch, read receipt) can check — after
  // they land — whether the user has since clicked a different ticket. State alone can't
  // do this: a callback closes over the selectedId value from when it started, not the
  // latest one, so a stale response has no way to know it arrived too late without a ref.
  const selectedIdRef = useRef<string | null>(null)
  selectedIdRef.current = selectedId
  const [detail, setDetail] = useState<TicketDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)

  // Search is filtered client-side over tickets already in hand (below) — the server
  // takes no search param, so debounced keystrokes must not trigger a refetch here.
  const loadQueue = useCallback(async () => {
    try {
      const d = await apiRoot<{ tickets: Ticket[]; unreadCount: number }>('/support/queue', {
        params: { status, team: team || undefined },
      })
      setRawTickets(d.tickets)
    } catch (e: any) {
      toast(e.message || 'Queue load nahi hui', 'err')
    } finally {
      setListLoading(false)
    }
  }, [status, team, toast])

  const tickets = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    if (!q) return rawTickets
    return rawTickets.filter((t) =>
      t.ref.toLowerCase().includes(q) ||
      (t.raisedBy?.name || '').toLowerCase().includes(q) ||
      (t.raisedBy?.phone || '').includes(q))
  }, [rawTickets, debounced])

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const d = await apiRoot<TicketDetail>(`/support/tickets/${id}`)
      // The user may have selected a different ticket while this was in flight. Applying
      // a stale response here would show one customer's thread and phone number under
      // another customer's highlighted queue row — bail out instead.
      if (selectedIdRef.current !== id) return
      setDetail(d)
      await apiRoot(`/support/tickets/${id}/read`, { method: 'POST' })
    } catch (e: any) {
      if (selectedIdRef.current === id) toast(e.message || 'Ticket load nahi hua', 'err')
    } finally {
      if (selectedIdRef.current === id) setDetailLoading(false)
    }
  }, [toast])

  useEffect(() => { setListLoading(true); loadQueue() }, [loadQueue])
  useEffect(() => { if (selectedId) loadDetail(selectedId) }, [selectedId, loadDetail])

  // Sockets keep this live; the reloads above are what make it CORRECT. Every socket
  // event triggers a refetch rather than patching local state, so a missed event can
  // never leave the console showing something the server disagrees with.
  useSupportSocket({
    onTicketNew: () => loadQueue(),
    onTicketTouched: () => loadQueue(),
    onMessage: (p) => { if (p.ticketId === selectedId) loadDetail(p.ticketId) },
    onStatus: () => { loadQueue(); if (selectedId) loadDetail(selectedId) },
    // A laptop that slept through twenty minutes of replies reconnects to a socket that
    // heard none of them, and nothing will replay them. Rejoining the room was never
    // enough on its own — without this the console sat on its pre-sleep state until
    // somebody happened to change a filter.
    onReconnect: () => { loadQueue(); if (selectedId) loadDetail(selectedId) },
  }, selectedId)

  // Every write below surfaces its own failure and then RETHROWS. The caller (Thread's
  // composer, the two modals) is what owns the text the user typed, so it — not this
  // file — decides whether to keep the box open. Swallowing the error here is what left
  // a modal sitting open and inert after a rejected PATCH, with the user's summary
  // still in it and no explanation on screen.
  async function send(text: string) {
    if (!selectedId) return
    try {
      await apiRoot(`/support/tickets/${selectedId}/messages`, { method: 'POST', body: { text } })
    } catch (e: any) {
      toast(e.message || 'Reply nahi bheja gaya', 'err')
      throw e
    }
    await loadDetail(selectedId)
  }

  async function logCall(outcome: CallOutcome, note: string) {
    if (!selectedId) return
    try {
      await apiRoot(`/support/tickets/${selectedId}/call-log`, { method: 'POST', body: { outcome, note } })
    } catch (e: any) {
      toast(e.message || 'Call log nahi hua', 'err')
      throw e
    }
    await loadDetail(selectedId)
    toast('Call log ho gaya', 'ok')
  }

  async function resolve(summary: string) {
    if (!selectedId) return
    try {
      await apiRoot(`/support/tickets/${selectedId}/resolve`, { method: 'PATCH', body: { summary } })
    } catch (e: any) {
      toast(e.message || 'Resolve nahi hua', 'err')
      throw e
    }
    await loadDetail(selectedId)
    await loadQueue()
    toast('User ko confirmation ke liye bhej diya', 'ok')
  }

  if (!can('support.view')) {
    return <div style={{ padding: 24, color: S.muted }}>Aapke paas support access nahi hai.</div>
  }

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr',
      height: 'calc(100vh - 120px)', background: S.card,
      border: `1px solid ${S.border}`, borderRadius: 12, overflow: 'hidden',
    }}>
      <QueueList
        tickets={tickets} loading={listLoading}
        status={status} onStatus={setStatus}
        team={team} onTeam={setTeam}
        search={search} onSearch={setSearch}
        selectedId={selectedId} onSelect={setSelectedId}
      />
      <Thread
        ticket={detail} loading={detailLoading}
        canReply={can('support.reply')} canResolve={can('support.resolve')}
        onSend={send} onLogCall={() => setCallOpen(true)} onResolve={() => setResolveOpen(true)}
      />
      <CallLogModal open={callOpen} onClose={() => setCallOpen(false)} onSubmit={logCall} />
      <ResolveModal open={resolveOpen} onClose={() => setResolveOpen(false)} onSubmit={resolve} />
    </div>
  )
}
