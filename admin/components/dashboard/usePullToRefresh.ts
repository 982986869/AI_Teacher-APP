'use client'

import { useEffect, useRef, useState } from 'react'

// Touch pull-to-refresh for mobile/tablet. Only engages when the page is scrolled to
// the top; drags past the threshold trigger onRefresh. A no-op on desktop (no touch).
export function usePullToRefresh(onRefresh: () => void, threshold = 70) {
  const [pull, setPull] = useState(0)
  const startY = useRef<number | null>(null)
  const armed = useRef(false)

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) { startY.current = e.touches[0].clientY; armed.current = true }
      else armed.current = false
    }
    const onMove = (e: TouchEvent) => {
      if (!armed.current || startY.current == null) return
      const dy = e.touches[0].clientY - startY.current
      if (dy > 0 && window.scrollY <= 0) {
        // Resistance curve so the pull feels elastic, capped well past the threshold.
        setPull(Math.min(threshold * 1.5, dy * 0.5))
      }
    }
    const onEnd = () => {
      if (pull >= threshold) onRefresh()
      setPull(0)
      startY.current = null
      armed.current = false
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  }, [pull, threshold, onRefresh])

  return { pull, ready: pull >= threshold }
}
