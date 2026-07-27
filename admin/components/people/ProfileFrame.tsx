'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Full-page detail frame — the detail is now its OWN route (not a permanent side drawer).
// A clear back link sits above the reused detail body, which stays in a readable column.
export function ProfileFrame({ backHref, backLabel, children }: { backHref: string; backLabel: string; children: ReactNode }) {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <Link href={backHref} className="btn btn-ghost sm" style={{ marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to {backLabel}
      </Link>
      {children}
    </div>
  )
}
