'use client'

import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { S } from '@/lib/theme'

export function ResolveModal({ open, onClose, onSubmit }: {
  open: boolean
  onClose: () => void
  onSubmit: (summary: string) => Promise<void>
}) {
  const [summary, setSummary] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!summary.trim()) return
    setBusy(true)
    try {
      await onSubmit(summary.trim())
      setSummary('')
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Issue resolved mark karein">
      <p style={{ fontSize: 12.5, color: S.muted, marginBottom: 10 }}>
        Ye summary user ko dikhegi. Ticket abhi band nahi hoga — user confirm karega,
        ya 3 din baad apne aap band ho jayega.
      </p>
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder="Kya kiya? e.g. Refund process kar diya, 3-4 din mein aa jayega."
        rows={4}
        style={{ width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 13 }}
      />
      <button
        onClick={submit}
        disabled={busy || !summary.trim()}
        style={{
          marginTop: 12, padding: '9px 16px', borderRadius: 8, border: 'none',
          cursor: !summary.trim() ? 'not-allowed' : busy ? 'wait' : 'pointer',
          background: !summary.trim() ? S.border : S.emerald,
          color: '#fff', fontSize: 13, fontWeight: 600,
        }}
      >
        {busy ? 'Save ho raha…' : 'Mark resolved'}
      </button>
    </Modal>
  )
}
