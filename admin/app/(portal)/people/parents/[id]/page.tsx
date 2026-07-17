'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { ParentDetail } from '@/app/(portal)/parents/ParentDetail'
import { ProfileFrame } from '@/components/people/ProfileFrame'

// Parent profile as a full page — reuses the existing ParentDetail body (linked child,
// snapshot, link/unlink), zero duplicated logic. Remount on change forces a refresh.
export default function ParentProfilePage() {
  const id = String(useParams().id)
  const [nonce, setNonce] = useState(0)
  return (
    <ProfileFrame backHref="/people/parents" backLabel="Parents">
      <ParentDetail key={nonce} id={id} onChanged={() => setNonce((n) => n + 1)} />
    </ProfileFrame>
  )
}
