'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const KEY = 'ailernova_admin_theme'

// Toggles the explicit data-theme on <html> and persists it. The initial value is
// already applied pre-paint by the inline script in layout.tsx; here we just read it
// back so the icon matches, then flip on click.
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const current = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light'
    setTheme(current)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem(KEY, next) } catch { /* ignore */ }
    setTheme(next)
  }

  return (
    <button className="btn btn-ghost icon-btn" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title="Toggle theme">
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
