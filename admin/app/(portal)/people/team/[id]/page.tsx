'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { UserDetail } from '@/app/(portal)/users/UserDetail'
import { ProfileFrame } from '@/components/people/ProfileFrame'

// Team member profile — same reusable UserDetail body as students (identity, role,
// access actions). Zero duplicated logic; remount on change forces a refresh.
export default function TeamProfilePage() {
  const id = String(useParams().id)
  const router = useRouter()
  const [nonce, setNonce] = useState(0)
  return (
    <ProfileFrame backHref="/people/team" backLabel="Team">
      <UserDetail key={nonce} id={id} onChanged={() => setNonce((n) => n + 1)} onClose={() => router.push('/people/team')} />
    </ProfileFrame>
  )
}
