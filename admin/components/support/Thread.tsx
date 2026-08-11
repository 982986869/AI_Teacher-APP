'use client'

import { useEffect, useRef, useState } from 'react'
import { Phone, Send, CheckCircle2, Paperclip } from 'lucide-react'
import { Badge, EmptyState, Spinner } from '@/components/ui'
import { S } from '@/lib/theme'
import { fmtDateTime } from '@/lib/format'
import type { TicketDetail } from '@/lib/types'

const OUTCOME_LABEL: Record<string, string> = {
  talked: 'Baat hui', no_answer: 'Uthaya nahi', callback: 'Callback',
}

export function Thread({
  ticket, loading, canReply, canResolve, onSend, onLogCall, onResolve,
}: {
  ticket: TicketDetail | null
  loading: boolean
  canReply: boolean
  canResolve: boolean
  onSend: (text: string) => Promise<void>
  onLogCall: () => void
  onResolve: () => void
}) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ticket?.messages.length])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
  if (!ticket) return <EmptyState title="Koi ticket chunein" message="Left se ek ticket select karein." />

  async function send() {
    const t = text.trim()
    if (!t) return
    setSending(true)
    try {
      await onSend(t)
      setText('')
    } catch {
      // The page has toasted the reason. The reply stays in the box so it can be sent
      // again rather than being cleared as though it went — and without this catch the
      // rethrow from onSend becomes an unhandled rejection, since nothing awaits send().
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${S.hair}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 14, color: S.ink }}>{ticket.ref}</strong>
          <Badge tone="purple" dot={false}>{ticket.team}</Badge>
          <Badge tone={ticket.status === 'closed' ? 'emerald' : ticket.status === 'pending_confirmation' ? 'gold' : 'orange'}>
            {ticket.status.replace('_', ' ')}
          </Badge>
        </div>
        <div style={{ fontSize: 12.5, color: S.sub, marginTop: 5 }}>
          {ticket.raisedBy?.name}
          {ticket.childName ? ` · ${ticket.childName} ke liye` : ''}
          {ticket.raisedBy?.phone && (
            <a href={`tel:${ticket.raisedBy.phone}`}
               style={{ marginLeft: 10, color: S.indigo, textDecoration: 'none', fontWeight: 600 }}>
              <Phone size={12} style={{ verticalAlign: -1 }} /> {ticket.raisedBy.phone}
            </a>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: S.canvas }}>
        {ticket.messages.map((m) => {
          if (m.kind === 'event') {
            return (
              <div key={m.id} style={{ textAlign: 'center', margin: '10px 0' }}>
                <span style={{ fontSize: 11, color: S.muted, background: S.card, padding: '4px 10px', borderRadius: 999, border: `1px solid ${S.border}` }}>
                  {m.text}
                </span>
              </div>
            )
          }
          if (m.kind === 'call') {
            return (
              <div key={m.id} style={{ textAlign: 'center', margin: '10px 0' }}>
                <span style={{ fontSize: 11.5, color: S.orange, background: S.orangeSoft, padding: '5px 12px', borderRadius: 999 }}>
                  <Phone size={11} style={{ verticalAlign: -1 }} /> {OUTCOME_LABEL[m.callOutcome || ''] || 'Call'}
                  {m.text ? ` — ${m.text}` : ''}
                </span>
              </div>
            )
          }
          const mine = m.authorRole === 'agent'
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
              <div style={{
                maxWidth: '68%', padding: '9px 12px', borderRadius: 14, fontSize: 13,
                background: mine ? S.indigo : S.card,
                color: mine ? '#fff' : S.ink,
                border: mine ? 'none' : `1px solid ${S.border}`,
              }}>
                {!mine && m.authorName && (
                  <div style={{ fontSize: 11, color: S.muted, marginBottom: 2 }}>{m.authorName}</div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3 }}>{fmtDateTime(m.createdAt)}</div>
              </div>
            </div>
          )
        })}

        {/* The user's screenshot of the broken link. The app has always uploaded these
            and the API has always returned them, but nothing rendered them — so the one
            piece of evidence on the ticket reached nobody who could act on it.
            Grouped rather than interleaved: the API does not expose an attachment's
            createdAt, so there is no honest way to slot them between messages, and a
            made-up position would be worse than a labelled shelf. Chips, not a gallery —
            the filename plus a click is the whole job. */}
        {ticket.attachments.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${S.border}` }}>
            <div style={{ fontSize: 11, color: S.muted, marginBottom: 7, letterSpacing: 0.4 }}>
              ATTACHMENTS ({ticket.attachments.length})
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ticket.attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={a.name}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: 240,
                    padding: '6px 10px', borderRadius: 999, fontSize: 12,
                    border: `1px solid ${S.border}`, background: S.card,
                    color: S.indigo, textDecoration: 'none',
                  }}
                >
                  <Paperclip size={12} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div style={{ borderTop: `1px solid ${S.hair}`, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={!canReply || ticket.status === 'closed'}
            placeholder={ticket.status === 'closed' ? 'Ticket band hai' : 'Reply likhein…'}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: `1px solid ${S.border}`, fontSize: 13 }}
          />
          <button
            onClick={send}
            disabled={!canReply || sending || !text.trim()}
            style={{
              padding: '0 14px', borderRadius: 10, border: 'none', background: S.indigo,
              color: '#fff', cursor: 'pointer',
            }}
          >
            <Send size={15} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onLogCall} disabled={!canReply}
            style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${S.border}`, background: S.card, fontSize: 12.5, cursor: 'pointer', color: S.sub }}>
            <Phone size={13} style={{ verticalAlign: -2 }} /> Log a call
          </button>
          {ticket.status !== 'closed' && ticket.status !== 'pending_confirmation' && (
            <button onClick={onResolve} disabled={!canResolve}
              style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${S.emerald}`, background: S.emeraldSoft, fontSize: 12.5, cursor: 'pointer', color: S.emerald, fontWeight: 600 }}>
              <CheckCircle2 size={13} style={{ verticalAlign: -2 }} /> Mark Resolved
            </button>
          )}
          {ticket.status === 'pending_confirmation' && (
            <span style={{ fontSize: 12, color: S.gold, alignSelf: 'center' }}>
              User ki confirmation ka intezaar — 3 din baad apne aap band
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
