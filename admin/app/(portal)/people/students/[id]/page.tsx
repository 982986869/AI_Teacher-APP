'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { UserDetail } from '@/app/(portal)/users/UserDetail'
import { ProfileFrame } from '@/components/people/ProfileFrame'

// Student profile as a full page — reuses the existing UserDetail body (all its data +
// mutations), so there is zero duplicated logic. Remounting on change forces a refresh.
export default function StudentProfilePage() {
  const id = String(useParams().id)
  const router = useRouter()
  const [nonce, setNonce] = useState(0)
  return (
    <ProfileFrame backHref="/people/students" backLabel="Students">
      <UserDetail key={nonce} id={id} onChanged={() => setNonce((n) => n + 1)} onClose={() => router.push('/people/students')} />
    </ProfileFrame>
  )
}
