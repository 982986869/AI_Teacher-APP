'use client'

/**
 * Personalized section — the admin side of the PDF pipeline.
 *
 * Upload a PDF, the server extracts it and splits it into chapters, then each
 * chapter generates four kinds of content into its own sub-section: Notes,
 * Resources, Practice Questions and Quiz.
 *
 * THREE gates stand between generated content and a student, and all three
 * default closed:
 *   1. the book's Global Student Visibility switch
 *   2. the chapter's Chapter Visible switch
 *   3. each section's own Visible to Students switch
 * The server checks all three in one query (books.service visibleContent), so a
 * gate shown here is a gate that actually holds.
 *
 * Publishing is never a single click on a tile: a section is opened, read, and
 * released from inside the review window. Generated material is occasionally
 * wrong, and once students have it, it is the platform's content, not the model's.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BookUp, FileText, Sparkles, Eye, EyeOff, Trash2, RefreshCw,
  CheckCircle2, CircleDashed, AlertTriangle, ChevronRight, Loader2, Copy, Check,
  NotebookPen, ListChecks, PencilRuler, Library, MoreVertical, Clock, Zap,
} from 'lucide-react'
import { useApi } from '@/components/useApi'
import { Modal } from '@/components/Modal'
import { Card, PageHero, EmptyState, ErrorState, Badge, Skel } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api, upload as uploadFile, ApiError } from '@/lib/api'
import { timeAgo } from '@/lib/format'

type Kind = 'notes' | 'quiz' | 'practice' | 'resource'

/** What one sub-section is doing right now, during a generation run. */
type SecState = 'idle' | 'queued' | 'working' | 'done' | 'failed'

interface ContentRow {
  id: string; kind: Kind; title: string | null
  status: 'draft' | 'published'; source: string; model?: string | null
  units?: number; chars?: number; updated_at?: string
}
/** What GET /books/content/:id returns — the row plus the generated payload. */
interface FullContent extends ContentRow { chapter_id: string; payload: any }
interface Chapter {
  id: string; position: number; title: string
  page_from: number | null; page_to: number | null; char_count: number | null
  visible: boolean; content: ContentRow[]
}
interface Book {
  id: string; title: string; class_level: number | null; subject: string | null
  status: 'uploaded' | 'extracting' | 'ready' | 'failed'; error: string | null
  published: boolean; page_count: number | null; original_filename: string | null
  uploaded_by_name: string | null; created_at: string
  chapters: number; content_total: number; content_published: number
}

/**
 * The four sub-sections, in the order an admin works through them: read the
 * material, then collect what to keep, then practise, then test.
 *
 * `unit` names what the count counts. It is the real shape of the payload —
 * notes are sections, a resource list is items — so the number on screen can
 * never claim something the content does not contain.
 */
const SECTIONS: {
  kind: Kind; label: string; icon: typeof NotebookPen; blurb: string
  unit: string; tint: string
}[] = [
  { kind: 'notes', label: 'Notes', icon: NotebookPen, blurb: 'Summary, sections and key terms', unit: 'sections', tint: '#4F6DF5' },
  { kind: 'resource', label: 'Resources', icon: Library, blurb: 'Formulae, diagrams, definitions', unit: 'items', tint: '#12A06A' },
  { kind: 'practice', label: 'Practice Questions', icon: PencilRuler, blurb: 'Written questions with answers', unit: 'questions', tint: '#E8833A' },
  { kind: 'quiz', label: 'Quiz', icon: ListChecks, blurb: 'Multiple choice, auto-graded', unit: 'questions', tint: '#8B5CF6' },
]

const kChars = (n?: number | null) =>
  n == null ? '' : n >= 1000 ? `${Math.round(n / 1000)}k chars` : `${n} chars`

/* ═══════════════════════════ small pieces ═══════════════════════════ */

/** The pill switch used by all three gates, so they read as one mechanism. */
function Sw({ on, onChange, disabled, label }: {
  on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      className={`bk-sw${on ? ' on' : ''}`}
      onClick={(e) => { e.stopPropagation(); onChange(!on) }}
    >
      <i />
    </button>
  )
}

/** "● Live" / "● Not Live" — the dot breathes only when something is actually live. */
function LiveTag({ on, onText = 'Live', offText = 'Not Live' }: { on: boolean; onText?: string; offText?: string }) {
  return (
    <span className={`bk-live${on ? ' on' : ''}`}>
      <span className="bk-dot" />{on ? onText : offText}
    </span>
  )
}

function StatusChip({ row, busy }: { row?: ContentRow; busy?: SecState }) {
  if (busy === 'working') return <span className="bk-chip working"><Loader2 size={12} className="bk-spin" /> Generating</span>
  if (busy === 'queued') return <span className="bk-chip"><Clock size={12} /> Queued</span>
  if (busy === 'failed') return <span className="bk-chip failed"><AlertTriangle size={12} /> Failed</span>
  if (!row) return <span className="bk-chip"><Clock size={12} /> Not Generated</span>
  if (row.status === 'published') return <span className="bk-chip live"><CheckCircle2 size={12} /> Live</span>
  return <span className="bk-chip draft"><CircleDashed size={12} /> Draft</span>
}

/** Kebab menu. Closes on outside click and on Escape, like every other menu. */
function Kebab({ items }: { items: { label: string; icon: typeof Trash2; danger?: boolean; onClick: () => void; disabled?: boolean }[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc) }
  }, [open])
  if (!items.length) return null
  return (
    <div className="bk-kebab-wrap" ref={ref}>
      <button className="bk-icon-btn" aria-label="More actions" aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="bk-menu" role="menu">
          {items.map((it) => (
            <button key={it.label} role="menuitem" disabled={it.disabled}
              className={it.danger ? 'danger' : ''}
              onClick={(e) => { e.stopPropagation(); setOpen(false); it.onClick() }}>
              <it.icon size={14} /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════ page ═══════════════════════════ */

export default function BooksPage() {
  const { can } = useAuth()
  const editable = can('content.edit')
  const { data, loading, error, reload } = useApi<Book[]>('/books')

  return (
    <>
      <PageHero
        eyebrow="Content"
        title="Personalized section"
        subtitle="Upload a PDF, generate notes, resources, practice and quizzes per chapter, then choose exactly what students see."
      />

      {editable && <UploadPanel onDone={reload} />}

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <Card><Skel h={20} /><div style={{ height: 12 }} /><Skel h={16} w="62%" /></Card>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data?.length ? (
          <Card>
            <EmptyState
              icon={BookUp}
              title="No books yet"
              message={editable
                ? 'Upload a PDF above and it will be split into chapters automatically.'
                : 'Books will appear here once an admin uploads one.'}
            />
          </Card>
        ) : (
          <div className="bk-list">
            {data.map((b, i) => (
              <BookCard key={b.id} book={b} index={i} editable={editable} onChanged={reload} />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        /* ── motion ──────────────────────────────────────────────────────── */
        @keyframes bk-rise   { from { opacity: 0; transform: translateY(12px); } }
        @keyframes bk-expand { from { opacity: 0; transform: translateY(-8px); } }
        @keyframes bk-spin   { to   { transform: rotate(360deg); } }
        @keyframes bk-sweep  { 100% { transform: translateX(260%); } }
        @keyframes bk-breath { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .45; transform: scale(.82); } }
        @keyframes bk-landed { 0% { transform: scale(.985); } 55% { transform: scale(1.012); } 100% { transform: scale(1); } }
        @keyframes bk-menu   { from { opacity: 0; transform: translateY(-5px) scale(.97); } }

        .bk-list { display: flex; flex-direction: column; gap: 14px; }

        /* ── upload ──────────────────────────────────────────────────────── */
        .bk-drop {
          display: flex; align-items: center; gap: 18px;
          border: 1.5px dashed var(--line); border-radius: 15px;
          padding: 18px 22px; cursor: pointer; position: relative; overflow: hidden;
          background: var(--surface-2);
          transition: border-color .2s, background .2s, transform .2s cubic-bezier(.22,1,.36,1);
        }
        .bk-drop:hover { border-color: var(--accent); transform: translateY(-1px); }
        .bk-drop.over  { border-color: var(--accent); background: rgba(79,109,245,.07); transform: scale(1.005); }
        .bk-drop.busy  { cursor: progress; }
        /* A sweep across the panel while the server parses — the one stretch with
           no progress events to report, and silence there reads as a hang. */
        .bk-drop.busy::after {
          content: ''; position: absolute; inset: 0 auto 0 -42%; width: 42%;
          background: linear-gradient(90deg, transparent, rgba(79,109,245,.14), transparent);
          animation: bk-sweep 1.25s ease-in-out infinite;
        }
        .bk-drop-icon {
          width: 62px; height: 62px; border-radius: 13px; flex: 0 0 auto;
          display: grid; place-items: center;
          background: var(--card); border: 1.5px dashed var(--line);
        }
        .bk-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--line); }
        .bk-bar > i { display: block; height: 100%; background: var(--accent); transition: width .22s; }

        /* ── book card ───────────────────────────────────────────────────── */
        .bk-book {
          border: 1px solid var(--line); border-radius: 16px; background: var(--card);
          animation: bk-rise .34s cubic-bezier(.22,1,.36,1) both; overflow: hidden;
        }
        .bk-book-head { display: flex; align-items: center; gap: 14px; padding: 16px 18px; flex-wrap: wrap; }
        .bk-book-ic {
          width: 44px; height: 44px; border-radius: 12px; flex: 0 0 auto; display: grid; place-items: center;
          background: rgba(79,109,245,.12); color: #4F6DF5;
        }
        .bk-title-row { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .bk-book-title { font-size: 16px; font-weight: 700; letter-spacing: -.01em; }
        .bk-meta { font-size: 12.5px; color: var(--muted); margin-top: 3px; }

        /* the book-level gate, given its own tinted field so it reads as the master */
        .bk-gate {
          display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 11px;
          border: 1px solid var(--line); background: var(--surface-2);
          transition: background .25s, border-color .25s;
        }
        .bk-gate.on { border-color: rgba(18,160,106,.45); background: rgba(18,160,106,.08); }

        /* ── chapters ────────────────────────────────────────────────────── */
        .bk-chapters { border-top: 1px solid var(--hair); display: flex; flex-direction: column; }
        .bk-chapter { border-bottom: 1px solid var(--hair); }
        .bk-chapter:last-child { border-bottom: 0; }
        .bk-ch-head {
          display: flex; align-items: center; gap: 12px; padding: 14px 18px; cursor: pointer;
          flex-wrap: wrap; transition: background .18s;
        }
        .bk-ch-head:hover { background: var(--surface-2); }
        .bk-chev { transition: transform .24s cubic-bezier(.22,1,.36,1); flex: 0 0 auto; color: var(--muted); }
        .bk-chev.open { transform: rotate(90deg); }
        .bk-ch-title { font-size: 14.5px; font-weight: 650; }
        .bk-ch-body { animation: bk-expand .26s cubic-bezier(.22,1,.36,1) both; padding: 0 18px 16px; }

        /* ── section rows ────────────────────────────────────────────────── */
        .bk-sec {
          display: flex; align-items: center; gap: 13px;
          padding: 12px 14px; border: 1px solid var(--line); border-radius: 13px;
          background: var(--card); margin-top: 9px;
          animation: bk-rise .3s cubic-bezier(.22,1,.36,1) both;
          transition: border-color .2s, box-shadow .2s, transform .2s cubic-bezier(.22,1,.36,1);
        }
        .bk-sec:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .bk-sec.working { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(79,109,245,.14); }
        .bk-sec.queued  { opacity: .55; }
        .bk-sec.done    { animation: bk-landed .5s cubic-bezier(.22,1,.36,1) both; }
        .bk-sec.failed  { border-color: #DC2626; background: rgba(220,38,38,.05); }
        .bk-sec-ic { width: 38px; height: 38px; border-radius: 11px; flex: 0 0 auto; display: grid; place-items: center; }
        .bk-sec-name { font-size: 13.5px; font-weight: 650; }
        .bk-sec-blurb { font-size: 11.5px; color: var(--muted); margin-top: 2px; }
        .bk-sec-stat { font-size: 12px; color: var(--muted); white-space: nowrap; }
        .bk-vline { width: 1px; align-self: stretch; background: var(--hair); margin: 0 3px; }

        /* ── chips, switches, dots ───────────────────────────────────────── */
        .bk-chip {
          display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
          padding: 4px 10px; border-radius: 99px; font-size: 11.5px; font-weight: 600;
          border: 1px solid var(--line); background: var(--surface-2); color: var(--muted);
        }
        .bk-chip.live    { border-color: rgba(18,160,106,.4);  background: rgba(18,160,106,.1);  color: #0E8A5B; }
        .bk-chip.draft   { border-color: rgba(217,119,6,.4);   background: rgba(217,119,6,.1);   color: #B45309; }
        .bk-chip.failed  { border-color: rgba(220,38,38,.4);   background: rgba(220,38,38,.1);   color: #DC2626; }
        .bk-chip.working { border-color: rgba(79,109,245,.4);  background: rgba(79,109,245,.1);  color: #4F6DF5; }

        .bk-sw {
          width: 42px; height: 24px; border-radius: 99px; border: 0; padding: 3px; flex: 0 0 auto;
          background: var(--line); cursor: pointer; position: relative;
          transition: background .24s cubic-bezier(.22,1,.36,1);
        }
        .bk-sw > i {
          display: block; width: 18px; height: 18px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,.28);
          transition: transform .24s cubic-bezier(.22,1,.36,1);
        }
        .bk-sw.on { background: #12A06A; }
        .bk-sw.on > i { transform: translateX(18px); }
        .bk-sw:disabled { opacity: .5; cursor: not-allowed; }
        .bk-sw:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

        .bk-live { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); white-space: nowrap; }
        .bk-live .bk-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
        .bk-live.on { color: #0E8A5B; font-weight: 600; }
        .bk-live.on .bk-dot { background: #12A06A; animation: bk-breath 2.1s ease-in-out infinite; }

        /* ── buttons & menus ─────────────────────────────────────────────── */
        .bk-icon-btn {
          width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; flex: 0 0 auto;
          border: 1px solid var(--line); background: var(--card); color: var(--muted); cursor: pointer;
          transition: background .18s, color .18s, border-color .18s;
        }
        .bk-icon-btn:hover { background: var(--surface-2); color: var(--ink); border-color: var(--accent); }
        .bk-kebab-wrap { position: relative; flex: 0 0 auto; }
        .bk-menu {
          position: absolute; right: 0; top: calc(100% + 6px); z-index: 30; min-width: 196px;
          background: var(--card); border: 1px solid var(--line); border-radius: 11px;
          box-shadow: var(--shadow-lg); padding: 5px; display: flex; flex-direction: column;
          animation: bk-menu .16s cubic-bezier(.22,1,.36,1) both;
        }
        .bk-menu button {
          display: flex; align-items: center; gap: 9px; padding: 8px 10px; border: 0; border-radius: 8px;
          background: transparent; cursor: pointer; font-size: 13px; text-align: left; color: var(--ink);
        }
        .bk-menu button:hover:not(:disabled) { background: var(--surface-2); }
        .bk-menu button.danger { color: #DC2626; }
        .bk-menu button:disabled { opacity: .45; cursor: not-allowed; }

        .bk-prog { height: 4px; border-radius: 99px; background: var(--line); overflow: hidden; margin-top: 11px; }
        .bk-prog > i { display: block; height: 100%; background: var(--accent); border-radius: 99px; transition: width .4s cubic-bezier(.22,1,.36,1); }
        .bk-spin { animation: bk-spin .9s linear infinite; }

        /* ── review window ───────────────────────────────────────────────── */
        .bk-rv { display: flex; flex-direction: column; gap: 14px; font-size: 13.5px; line-height: 1.55; }
        .bk-rv-sum { margin: 0; padding: 11px 13px; border-radius: 10px; background: var(--surface-2); border-left: 3px solid var(--accent); }
        .bk-rv-block { padding-bottom: 12px; border-bottom: 1px solid var(--hair); }
        .bk-rv-block:last-child { border-bottom: 0; padding-bottom: 0; }
        .bk-rv-block ul { margin: 6px 0 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; }
        .bk-rv-opts { list-style: none; padding-left: 0 !important; }
        .bk-rv-opts li { display: flex; align-items: center; gap: 7px; padding: 5px 9px; border-radius: 8px; background: var(--surface-2); }
        .bk-rv-opts li.right { background: rgba(18,160,106,.1); font-weight: 600; }

        @media (max-width: 860px) {
          .bk-sec { flex-wrap: wrap; }
          .bk-vline { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bk-book, .bk-sec, .bk-ch-body, .bk-menu { animation: none !important; }
          .bk-drop.busy::after, .bk-live.on .bk-dot { animation: none; }
          .bk-sec:hover, .bk-drop:hover { transform: none; }
          .bk-prog > i, .bk-sw, .bk-sw > i, .bk-chev { transition: none; }
        }
      `}</style>
    </>
  )
}

/* ═══════════════════════════ upload ═══════════════════════════ */

function UploadPanel({ onDone }: { onDone: () => void }) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [pct, setPct] = useState(0)
  const [stage, setStage] = useState('')
  const [title, setTitle] = useState('')
  const [klass, setKlass] = useState('')

  const send = useCallback(async (file: File) => {
    if (!/\.pdf$/i.test(file.name)) { toast('Only PDF files can be uploaded.', 'err'); return }
    if (file.size > 40 * 1024 * 1024) { toast('That PDF is over 40 MB. Split it or compress it first.', 'err'); return }

    const form = new FormData()
    form.append('file', file)
    form.append('title', (title || file.name.replace(/\.pdf$/i, '')).trim())
    if (klass) form.append('classLevel', klass)

    setBusy(true); setPct(0); setStage('Uploading…')
    try {
      const out: any = await uploadFile('/books', form, (p) => {
        setPct(p)
        // Once the bytes are sent the server is parsing, and no further progress
        // event will arrive. Saying so beats a bar frozen at 100%.
        if (p >= 100) setStage('Reading the PDF and finding chapters…')
      })
      if (out?.duplicate) {
        toast(`Already uploaded as "${out.book.title}" — nothing was re-processed.`, 'ok')
      } else {
        toast(`Extracted ${out.pages} pages into ${out.chapters} chapter${out.chapters === 1 ? '' : 's'}.`, 'ok')
      }
      setTitle(''); setKlass('')
      onDone()
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'Upload failed.', 'err')
    } finally {
      setBusy(false); setPct(0); setStage('')
    }
  }, [title, klass, toast, onDone])

  return (
    <Card>
      <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          className="input" placeholder="Title (defaults to the filename)"
          value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy}
          style={{ flex: '1 1 240px' }}
        />
        <select className="select" value={klass} onChange={(e) => setKlass(e.target.value)} disabled={busy} style={{ width: 'auto' }}>
          <option value="">All classes</option>
          {[6, 7, 8, 9, 10, 11, 12].map((c) => <option key={c} value={c}>Class {c}</option>)}
        </select>
      </div>

      <div
        className={`bk-drop${over ? ' over' : ''}${busy ? ' busy' : ''}`}
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!busy) setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f && !busy) send(f)
        }}
        role="button" tabIndex={0} aria-label="Choose a PDF to upload"
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) inputRef.current?.click() }}
      >
        <div className="bk-drop-icon">
          {busy
            ? <Loader2 size={26} className="bk-spin" style={{ color: 'var(--accent-ink)' }} />
            : <FileText size={26} style={{ color: over ? 'var(--accent-ink)' : 'var(--muted)' }} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="strong" style={{ fontSize: 15 }}>
            {busy ? stage : over ? 'Drop it here' : 'Drag a PDF here, or click to choose'}
          </div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 3 }}>
            PDF up to 40 MB · chapters are detected automatically · the file is not stored after extraction
          </div>
        </div>
        {busy && <div className="bk-bar"><i style={{ width: `${pct}%` }} /></div>}
      </div>

      <input
        ref={inputRef} type="file" accept="application/pdf,.pdf" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); e.target.value = '' }}
      />
    </Card>
  )
}

/* ═══════════════════════════ book ═══════════════════════════ */

function BookCard({ book, index, editable, onChanged }: {
  book: Book; index: number; editable: boolean; onChanged: () => void
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const { data: chapters, loading, reload } = useApi<Chapter[]>(`/books/${book.id}/chapters`)

  const refresh = () => { reload(); onChanged() }

  const setPublished = async (published: boolean) => {
    // The master gate. Releasing a book whose sections are all still draft would
    // show students an empty shelf, so say so rather than letting it look broken.
    if (published && book.content_published === 0) {
      toast('Nothing is published inside this book yet — release a section first.', 'err')
      return
    }
    setBusy(true)
    try {
      await api(`/books/${book.id}/publish`, { method: 'POST', body: { published } })
      toast(published ? 'Book is visible to students' : 'Book hidden from students', 'ok')
      onChanged()
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Could not update', 'err') } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!window.confirm(`Delete "${book.title}" and everything generated from it? This cannot be undone.`)) return
    setBusy(true)
    try {
      await api(`/books/${book.id}`, { method: 'DELETE' })
      toast('Book deleted', 'ok'); onChanged()
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Could not delete', 'err') } finally { setBusy(false) }
  }

  const copyTitle = () => {
    navigator.clipboard?.writeText(book.title).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1400)
    }).catch(() => toast('Could not copy', 'err'))
  }

  const meta = [
    book.class_level ? `Class ${book.class_level}` : 'All classes',
    book.subject,
    book.page_count ? `${book.page_count} pages` : null,
    `${book.chapters} chapter${book.chapters === 1 ? '' : 's'}`,
    `${book.content_published} published`,
    timeAgo(book.created_at),
  ].filter(Boolean).join(' · ')

  return (
    <div className="bk-book" style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}>
      <div className="bk-book-head">
        <span className="bk-book-ic"><BookUp size={21} /></span>

        <div style={{ minWidth: 0, flex: '1 1 260px' }}>
          <div className="bk-title-row">
            <span className="bk-book-title">{book.title}</span>
            <button className="bk-icon-btn" style={{ width: 26, height: 26 }} onClick={copyTitle}
              aria-label="Copy book title" title="Copy title">
              {copied ? <Check size={13} style={{ color: '#12A06A' }} /> : <Copy size={13} />}
            </button>
            {book.status === 'ready'
              ? <span className="bk-chip live"><CheckCircle2 size={12} /> Ready</span>
              : book.status === 'failed'
                ? <span className="bk-chip failed"><AlertTriangle size={12} /> Failed</span>
                : <span className="bk-chip working"><Loader2 size={12} className="bk-spin" /> {book.status}</span>}
            <span className={`bk-chip${book.published ? ' live' : ''}`}>
              {book.published ? <Eye size={12} /> : <EyeOff size={12} />} {book.published ? 'Visible' : 'Hidden'}
            </span>
          </div>
          <div className="bk-meta">{meta}</div>
          {book.error && <div className="bk-meta" style={{ color: '#DC2626' }}>{book.error}</div>}
        </div>

        <div className={`bk-gate${book.published ? ' on' : ''}`}>
          <Sw on={book.published} disabled={!editable || busy || book.status !== 'ready'}
            onChange={setPublished} label="Global student visibility" />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>Global Student Visibility:</span>
          <LiveTag on={book.published} offText="Hidden" />
        </div>

        <Kebab items={editable ? [{ label: 'Delete book', icon: Trash2, danger: true, onClick: remove, disabled: busy }] : []} />
      </div>

      <div className="bk-chapters">
        {loading
          ? <div style={{ padding: 16 }}><Skel h={44} /><div style={{ height: 8 }} /><Skel h={44} /></div>
          : !chapters?.length
            ? <div style={{ padding: 16 }} className="faint">No chapters were detected in this PDF.</div>
            : chapters.map((c, i) => (
              <ChapterBlock key={c.id} chapter={c} index={i} editable={editable}
                defaultOpen={i === 0} onChanged={refresh} />
            ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════ chapter ═══════════════════════════ */

function ChapterBlock({ chapter, index, editable, defaultOpen, onChanged }: {
  chapter: Chapter; index: number; editable: boolean; defaultOpen: boolean; onChanged: () => void
}) {
  const toast = useToast()
  const [open, setOpen] = useState(defaultOpen)
  const [busy, setBusy] = useState(false)
  // Per-section live state. A whole-chapter run touches four sub-sections one at a
  // time, so a single "which kind is busy" flag cannot say what the others are
  // doing — the admin needs to see the queue, not just the current call.
  const [state, setState] = useState<Partial<Record<Kind, SecState>>>({})
  const [errs, setErrs] = useState<Partial<Record<Kind, string>>>({})
  const [running, setRunning] = useState(false)
  const [preview, setPreview] = useState<ContentRow | null>(null)

  const byKind = (k: Kind) => chapter.content.find((c) => c.kind === k)
  const mark = (kind: Kind, s: SecState) => setState((p) => ({ ...p, [kind]: s }))

  const filled = SECTIONS.filter((s) => byKind(s.kind)).length
  const settled = SECTIONS.filter((s) => byKind(s.kind) || state[s.kind] === 'done').length

  // One sub-section. Shared by the single-tile click and the whole-chapter run, so
  // both paths report progress and store into the same place.
  const runOne = async (kind: Kind) => {
    mark(kind, 'working')
    setErrs((p) => ({ ...p, [kind]: undefined }))
    try {
      await api(`/books/chapter/${chapter.id}/generate`, { method: 'POST', body: { kind } })
      mark(kind, 'done')
      return true
    } catch (e) {
      mark(kind, 'failed')
      setErrs((p) => ({ ...p, [kind]: e instanceof ApiError ? e.message : 'Generation failed' }))
      return false
    }
  }

  const generateOne = async (kind: Kind) => {
    setRunning(true)
    const ok = await runOne(kind)
    toast(ok ? 'Generated — review it before publishing.' : (errs[kind] || 'Generation failed'), ok ? 'ok' : 'err')
    setRunning(false); onChanged()
  }

  // Generate every sub-section this chapter is missing, one after another.
  // Sequential on purpose: four parallel calls on a 15-chapter book is a burst of
  // model spend and a rate-limit risk, and the admin cannot read four spinners at
  // once anyway. A failure marks its own row and the run continues — one bad
  // section should not cost the other three.
  const generateAll = async (regenerate = false) => {
    const todo = regenerate
      ? SECTIONS.map((s) => s.kind)
      : SECTIONS.map((s) => s.kind).filter((k) => !byKind(k))
    if (!todo.length) return
    if (regenerate && !window.confirm('Regenerate every section of this chapter? Existing content is overwritten, including anything already reviewed.')) return

    setRunning(true)
    setState(Object.fromEntries(todo.map((k) => [k, 'queued'])) as Partial<Record<Kind, SecState>>)
    let made = 0
    for (const kind of todo) { if (await runOne(kind)) made += 1 }
    setRunning(false)

    const failed = todo.length - made
    toast(
      failed ? `${made} of ${todo.length} generated — ${failed} failed. Check the red rows.`
        : `All ${made} sections generated — review each before publishing.`,
      failed ? 'err' : 'ok',
    )
    onChanged()
  }

  const setVisible = async (visible: boolean) => {
    setBusy(true)
    try {
      await api(`/books/chapter/${chapter.id}/visible`, { method: 'POST', body: { visible } })
      toast(visible ? 'Chapter is visible to students' : 'Chapter hidden from students', 'ok')
      onChanged()
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Could not update', 'err') } finally { setBusy(false) }
  }

  const pages = chapter.page_from && chapter.page_to ? `pages ${chapter.page_from}–${chapter.page_to}` : ''
  const chars = chapter.char_count ? kChars(chapter.char_count) : ''

  return (
    <div className="bk-chapter">
      <div className="bk-ch-head" onClick={() => setOpen((o) => !o)} role="button" tabIndex={0}
        aria-expanded={open}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o) } }}>
        <ChevronRight size={17} className={`bk-chev${open ? ' open' : ''}`} />

        <div style={{ minWidth: 0, flex: '1 1 220px' }}>
          <span className="bk-ch-title">{chapter.position}. {chapter.title}</span>
          <span className="faint" style={{ fontSize: 12, marginLeft: 9 }}>
            {[pages, chars].filter(Boolean).join(' · ')}
          </span>
        </div>

        <div className="row gap-8" style={{ alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <Sw on={chapter.visible} disabled={!editable || busy} onChange={setVisible}
            label={`Chapter ${chapter.position} visible to students`} />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>
            {chapter.visible ? 'Chapter Visible' : 'Chapter Hidden'}
          </span>
          <LiveTag on={chapter.visible} offText="" />
        </div>

        {editable && (
          <div onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost sm" disabled={running} onClick={() => generateAll(filled === SECTIONS.length)}>
              {running
                ? <><Loader2 size={14} className="bk-spin" /> Generating {settled}/{SECTIONS.length}…</>
                : filled === SECTIONS.length
                  ? <><RefreshCw size={14} /> Regenerate All Content</>
                  : <><Sparkles size={14} /> Generate All</>}
            </button>
          </div>
        )}

        <div onClick={(e) => e.stopPropagation()}>
          <Kebab items={editable ? [
            { label: 'Regenerate all content', icon: RefreshCw, onClick: () => generateAll(true), disabled: running || !filled },
            { label: chapter.visible ? 'Hide from students' : 'Show to students', icon: chapter.visible ? EyeOff : Eye, onClick: () => setVisible(!chapter.visible), disabled: busy },
          ] : []} />
        </div>
      </div>

      {running && (
        <div style={{ padding: '0 18px' }}>
          <div className="bk-prog" role="progressbar" aria-valuemin={0} aria-valuemax={SECTIONS.length} aria-valuenow={settled}>
            <i style={{ width: `${(settled / SECTIONS.length) * 100}%` }} />
          </div>
        </div>
      )}

      {open && (
        <div className="bk-ch-body">
          {SECTIONS.map((meta, i) => (
            <SectionRow
              key={meta.kind}
              meta={meta}
              row={byKind(meta.kind)}
              state={state[meta.kind] || 'idle'}
              err={errs[meta.kind]}
              index={i}
              editable={editable}
              chapterVisible={chapter.visible}
              onGenerate={() => generateOne(meta.kind)}
              onPreview={(r) => setPreview(r)}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}

      <ContentPreview row={preview} open={!!preview} onClose={() => setPreview(null)}
        editable={editable} onChanged={onChanged} />
    </div>
  )
}

/* ═══════════════════════════ one sub-section ═══════════════════════════ */

function SectionRow({ meta, row, state, err, index, editable, chapterVisible, onGenerate, onPreview, onChanged }: {
  meta: typeof SECTIONS[number]
  row?: ContentRow
  state: SecState
  err?: string
  index: number
  editable: boolean
  chapterVisible: boolean
  onGenerate: () => void
  onPreview: (r: ContentRow) => void
  onChanged: () => void
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const Icon = meta.icon
  const live = row?.status === 'published'

  const setStatus = async (published: boolean) => {
    if (!row) return
    setBusy(true)
    try {
      await api(`/books/content/${row.id}/status`, { method: 'POST', body: { status: published ? 'published' : 'draft' } })
      toast(published ? 'Visible to students' : 'Moved back to draft', 'ok')
      onChanged()
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Could not update', 'err') } finally { setBusy(false) }
  }

  const stat = row
    ? [row.units ? `${row.units} ${meta.unit}` : null, kChars(row.chars)].filter(Boolean).join(' · ')
    : '0 chars'

  return (
    <div className={`bk-sec${state === 'idle' ? '' : ' ' + state}`} style={{ animationDelay: `${index * 45}ms` }}>
      <span className="bk-sec-ic" style={{ background: `${meta.tint}1A`, color: meta.tint }}>
        {state === 'working' ? <Loader2 size={17} className="bk-spin" /> : <Icon size={17} />}
      </span>

      <div style={{ minWidth: 0, flex: '1 1 180px' }}>
        <div className="bk-sec-name">{meta.label}</div>
        <div className="bk-sec-blurb">
          {state === 'failed' ? (err || 'Failed — try again')
            : state === 'queued' ? 'Waiting its turn'
            : state === 'working' ? 'Writing this section…'
            : row ? 'Click Preview to review it'
            : meta.blurb}
        </div>
      </div>

      <StatusChip row={row} busy={state === 'idle' ? undefined : state} />
      <span className="bk-sec-stat">· {stat}</span>

      <span className="bk-vline" />

      {/* The section's own gate. Disabled until there is something to release, and
          marked when the chapter above it is closed — a section switched on inside
          a hidden chapter still reaches nobody, and the UI should not imply it does. */}
      <span style={{ color: 'var(--muted)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
        {live ? <Eye size={16} /> : <EyeOff size={16} />}
      </span>
      <Sw on={live} disabled={!editable || !row || busy} onChange={setStatus}
        label={`${meta.label} visible to students`} />
      <span style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap' }}>Visible to Students</span>
      <LiveTag on={live && chapterVisible} />

      {row ? (
        <button className="btn btn-ghost sm" onClick={() => onPreview(row)}>
          <Eye size={14} /> Preview <ChevronRight size={13} />
        </button>
      ) : (
        <button className="btn btn-primary sm" disabled={!editable || state === 'working' || state === 'queued'} onClick={onGenerate}>
          <Zap size={14} /> Generate <ChevronRight size={13} />
        </button>
      )}

      <Kebab items={editable && row ? [
        { label: 'Preview content', icon: Eye, onClick: () => onPreview(row) },
        { label: 'Regenerate this section', icon: RefreshCw, onClick: onGenerate, disabled: state === 'working' },
        { label: live ? 'Hide from students' : 'Show to students', icon: live ? EyeOff : Eye, onClick: () => setStatus(!live), disabled: busy },
      ] : []} />
    </div>
  )
}

/* ═══════════════════════════ review window ═══════════════════════════ */

/**
 * What the model actually wrote, before any student sees it.
 *
 * Publishing lives in here as well as on the row, because a one-click publish
 * with nothing read is how wrong content reaches a class. Generated material is
 * occasionally wrong — an OCR'd page makes a confident, wrong quiz answer — and
 * once it is in front of students it is the platform's content, not the model's.
 */
function ContentPreview({ row, open, onClose, editable, onChanged }: {
  row: ContentRow | null; open: boolean; onClose: () => void; editable: boolean; onChanged: () => void
}) {
  const toast = useToast()
  const [data, setData] = useState<FullContent | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !row) { setData(null); setErr(null); return }
    let alive = true
    setLoading(true); setErr(null)
    api<FullContent>(`/books/content/${row.id}`)
      .then((d) => { if (alive) setData(d) })
      .catch((e) => { if (alive) setErr(e instanceof ApiError ? e.message : 'Could not load this content') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [open, row])

  const setStatus = async (status: 'draft' | 'published') => {
    if (!row) return
    setSaving(true)
    try {
      await api(`/books/content/${row.id}/status`, { method: 'POST', body: { status } })
      toast(status === 'published' ? 'Published — students can see this now' : 'Moved back to draft', 'ok')
      onChanged(); onClose()
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Could not update', 'err') } finally { setSaving(false) }
  }

  const meta = SECTIONS.find((s) => s.kind === row?.kind)
  const live = row?.status === 'published'

  return (
    <Modal
      open={open} onClose={onClose} width={740}
      title={meta ? `${meta.label} — review before publishing` : 'Review'}
      footer={
        <>
          <span className="faint" style={{ marginRight: 'auto', fontSize: 12 }}>
            {live ? 'Live for students' : 'Draft — not visible to students'}
            {data?.model ? ` · ${data.model}` : ''}
          </span>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          {editable && (live
            ? <button className="btn" onClick={() => setStatus('draft')} disabled={saving}><EyeOff size={15} /> Unpublish</button>
            : <button className="btn btn-primary" onClick={() => setStatus('published')} disabled={saving || loading || !!err}><Eye size={15} /> Publish to students</button>
          )}
        </>
      }
    >
      {loading && <><Skel h={18} /><Skel h={14} style={{ marginTop: 10 }} /><Skel h={14} style={{ marginTop: 6 }} /></>}
      {err && <ErrorState message={err} />}
      {data && !loading && !err && <PayloadView kind={data.kind} payload={data.payload} />}
    </Modal>
  )
}

/** Renders each kind in the shape the student app will show it. */
function PayloadView({ kind, payload }: { kind: Kind; payload: any }) {
  if (!payload) return <span className="faint">This section is empty.</span>

  if (kind === 'notes') return (
    <div className="bk-rv">
      {payload.summary && <p className="bk-rv-sum">{payload.summary}</p>}
      {(payload.sections || []).map((s: any, i: number) => (
        <div key={i} className="bk-rv-block">
          <span className="strong">{s.heading}</span>
          <ul>{(s.points || []).map((p: string, j: number) => <li key={j}>{p}</li>)}</ul>
        </div>
      ))}
      {!!(payload.keyTerms || []).length && (
        <div className="bk-rv-block">
          <span className="strong">Key terms</span>
          <ul>{payload.keyTerms.map((t: any, i: number) => <li key={i}><b>{t.term}</b> — {t.meaning}</li>)}</ul>
        </div>
      )}
    </div>
  )

  if (kind === 'resource') return (
    <div className="bk-rv">
      {(payload.items || []).map((it: any, i: number) => (
        <div key={i} className="bk-rv-block">
          <span className="row gap-8" style={{ alignItems: 'center' }}>
            <span className="strong">{it.title}</span>
            {it.type && <Badge tone="emerald" dot={false}>{it.type}</Badge>}
          </span>
          <p style={{ margin: '4px 0 0' }}>{it.body}</p>
        </div>
      ))}
    </div>
  )

  if (kind === 'practice') return (
    <div className="bk-rv">
      {(payload.questions || []).map((q: any, i: number) => (
        <div key={i} className="bk-rv-block">
          <span className="strong">{i + 1}. {q.q}</span>
          <div className="faint" style={{ fontSize: 12, marginTop: 3 }}>
            {q.marks ? `${q.marks} marks` : ''}{q.marks && q.difficulty ? ' · ' : ''}{q.difficulty || ''}
          </div>
          <p style={{ margin: '6px 0 0' }}><b>Answer:</b> {q.answer}</p>
        </div>
      ))}
    </div>
  )

  // quiz — the correct option is marked, because a wrong answer key is the single
  // most damaging thing that can reach a student, and it is invisible otherwise.
  return (
    <div className="bk-rv">
      {(payload.questions || []).map((q: any, i: number) => (
        <div key={i} className="bk-rv-block">
          <span className="strong">{i + 1}. {q.q}</span>
          <ul className="bk-rv-opts">
            {(q.options || []).map((o: string, j: number) => (
              <li key={j} className={j === q.answer ? 'right' : ''}>
                {j === q.answer && <CheckCircle2 size={13} style={{ color: '#12A06A', flex: '0 0 auto' }} />}
                <span>{o}</span>
              </li>
            ))}
          </ul>
          {q.explanation && <p className="faint" style={{ margin: '6px 0 0', fontSize: 12.5 }}>{q.explanation}</p>}
        </div>
      ))}
    </div>
  )
}
