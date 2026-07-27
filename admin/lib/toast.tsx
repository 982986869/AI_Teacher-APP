'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Check, TriangleAlert, Info } from 'lucide-react'

type Kind = 'ok' | 'err' | 'info'
interface Toast { id: number; kind: Kind; msg: string }

const Ctx = createContext<{ toast: (msg: string, kind?: Kind) => void } | null>(null)

let counter = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((msg: string, kind: Kind = 'info') => {
    const id = counter++
    setToasts((t) => [...t, { id, kind, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'ok' ? 'ok' : t.kind === 'err' ? 'err' : ''}`}>
            {t.kind === 'ok' ? <Check size={16} /> : t.kind === 'err' ? <TriangleAlert size={16} /> : <Info size={16} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
