'use client'

import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { S } from '@/lib/theme'
import type { CallOutcome } from '@/lib/types'

const OUTCOMES: { k: CallOutcome; l: string }[] = [
  { k: 'talked', l: 'Baat hui' },
  { k: 'no_answer', l: 'Uthaya nahi' },
  { k: 'callback', l: 'Baad mein call karna hai' },
]

export function CallLogModal({ open, onClose, onSubmit }: {
  open: boolean
  onClose: () => void
  onSubmit: (outcome: CallOutcome, note: string) => Promise<void>
}) {
  const [outcome, setOutcome] = useState<CallOutcome>('talked')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      await onSubmit(outcome, note)
      setNote('')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Call log karein">
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {OUTCOMES.map((o) => (
          <button
            key={o.k}
            onClick={() => setOutcome(o.k)}
            style={{
              padding: '6px 12px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer',
              border: `1px solid ${outcome === o.k ? S.indigo : S.border}`,
              background: outcome === o.k ? S.indigoSoft : S.card,
              color: outcome === o.k ? S.indigo : S.muted,
            }}
          >
            {o.l}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Call mein kya hua? (sirf team dekhegi)"
        rows={4}
        style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 13 }}
      />
      <p style={{ fontSize: 11.5, color: S.muted, margin: '6px 0 12px' }}>
        Ye note user ko nahi dikhega — sirf team ke record ke liye hai.
      </p>
      <button
        onClick={submit}
        disabled={busy}
        style={{
          padding: '9px 16px', borderRadius: 8, border: 'none', cursor: busy ? 'wait' : 'pointer',
          background: S.indigo, color: '#fff', fontSize: 13, fontWeight: 600,
        }}
      >
        {busy ? 'Save ho raha…' : 'Save call'}
      </button>
    </Modal>
  )
}
