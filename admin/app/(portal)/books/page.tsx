'use client'

/**
 * Uploaded books — the admin side of the PDF pipeline.
 *
 * Upload a PDF, the server extracts it and splits it into chapters, then each
 * chapter can generate four kinds of content into its own sub-section: Notes,
 * Quiz, Practice questions and Resources.
 *
 * Nothing reaches a student until an admin decides twice: each piece of content
 * is published individually (so notes can go out while a quiz is still being
 * reviewed), and the book itself has its own visibility switch on top. Both
 * default to closed.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  BookUp, UploadCloud, FileText, Sparkles, Eye, EyeOff, Trash2, RefreshCw,
  CheckCircle2, CircleDashed, AlertTriangle, ChevronRight, Loader2, X,
  NotebookPen, ListChecks, PencilRuler, Library,
} from 'lucide-react'
import { useApi } from '@/components/useApi'
import { Card, PageHero, EmptyState, ErrorState, Badge, Skel } from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api, upload as uploadFile, ApiError } from '@/lib/api'
import { timeAgo } from '@/lib/format'

type Kind = 'notes' | 'quiz' | 'practice' | 'resource'

interface ContentRow { id: string; kind: Kind; title: string | null; status: 'draft' | 'published'; source: string }
interface Chapter { id: string; position: number; title: string; page_from: number | null; page_to: number | null; char_count: number | null; content: ContentRow[] }
interface Book {
  id: string; title: string; class_level: number | null; subject: string | null
  status: 'uploaded' | 'extracting' | 'ready' | 'failed'; error: string | null
  published: boolean; page_count: number | null; original_filename: string | null
  uploaded_by_name: string | null; created_at: string
  chapters: number; content_total: number; content_published: number
}

/** The four sub-sections. Order is the order an admin works in: read, then test. */
const SECTIONS: { kind: Kind; label: string; icon: typeof NotebookPen; tone: string; blurb: string }[] = [
  { kind: 'notes', label: 'Notes', icon: NotebookPen, tone: 'indigo', blurb: 'Summary, sections and key terms' },
  { kind: 'resource', label: 'Resources', icon: Library, tone: 'emerald', blurb: 'Formulae, diagrams, definitions' },
  { kind: 'practice', label: 'Practice', icon: PencilRuler, tone: 'purple', blurb: 'Written questions with answers' },
  { kind: 'quiz', label: 'Quiz', icon: ListChecks, tone: 'orange', blurb: 'Multiple choice, auto-graded' },
]

const fmtSize = (b: number | null) => (b == null ? '—' : b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`)

export default function BooksPage() {
  const { can } = useAuth()
  const toast = useToast()
  const editable = can('content.edit')

  const { data, loading, error, reload } = useApi<Book[]>('/books')
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <>
      <PageHero
        eyebrow="Content"
        title="Uploaded books"
        subtitle="Upload a PDF, generate notes, resources, practice and quizzes per chapter, then choose what students see."
      />

      {editable && <UploadPanel onDone={reload} />}

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <Card><Skel h={18} /><div style={{ height: 10 }} /><Skel h={18} w="70%" /></Card>
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : !data?.length ? (
          <Card>
            <EmptyState
              icon={BookUp}
              title="No books yet"
              message={editable ? 'Upload a PDF above and it will be split into chapters automatically.' : 'Books will appear here once an admin uploads one.'}
            />
          </Card>
        ) : (
          <div className="bk-grid">
            {data.map((b, i) => (
              <BookCard
                key={b.id}
                book={b}
                index={i}
                editable={editable}
                open={openId === b.id}
                onToggle={() => setOpenId(openId === b.id ? null : b.id)}
                onChanged={reload}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        /* ── entrance: a list that arrives rather than appears ── */
        @keyframes bk-rise { from { opacity: 0; transform: translateY(10px); } }
        @keyframes bk-pop { from { transform: scale(.94); opacity: 0; } }
        @keyframes bk-sweep { 100% { transform: translateX(260%); } }
        @keyframes bk-spin { to { transform: rotate(360deg); } }
        @keyframes bk-pulse { 50% { opacity: .45; } }
        @keyframes bk-expand { from { opacity: 0; transform: translateY(-6px); } }

        .bk-grid { display: flex; flex-direction: column; gap: 12px; }
        .bk-card { animation: bk-rise .34s cubic-bezier(.22,1,.36,1) both; }

        /* ── dropzone ── */
        .bk-drop {
          position: relative; overflow: hidden;
          border: 2px dashed var(--line); border-radius: 16px;
          padding: 28px 20px; text-align: center; cursor: pointer;
          transition: border-color .18s, background .18s, transform .18s;
        }
        .bk-drop:hover { border-color: var(--accent); background: var(--surface-2); }
        .bk-drop.over { border-color: var(--accent); background: var(--surface-2); transform: scale(1.01); }
        .bk-drop.busy { cursor: progress; }
        /* A light sweeping across the zone while a file uploads — the one piece of
           motion that is genuinely load-bearing: it says "still working" during the
           seconds when a large PDF is being parsed and nothing else changes. */
        .bk-drop.busy::after {
          content: ''; position: absolute; top: 0; bottom: 0; left: -40%; width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255,186,7,.16), transparent);
          animation: bk-sweep 1.1s linear infinite;
        }
        .bk-drop-icon { display: inline-flex; animation: bk-pop .3s cubic-bezier(.22,1,.36,1) both; }
        .bk-drop.over .bk-drop-icon { animation: bk-pulse 1s ease-in-out infinite; }

        .bk-bar { height: 8px; border-radius: 6px; background: var(--line); overflow: hidden; margin-top: 14px; }
        .bk-bar i { display: block; height: 100%; border-radius: 6px; background: linear-gradient(90deg, var(--accent), #FFD75E); transition: width .28s cubic-bezier(.22,1,.36,1); }

        /* ── chapter list ── */
        .bk-chapters { animation: bk-expand .26s cubic-bezier(.22,1,.36,1) both; margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
        .bk-chapter { border: 1px solid var(--line); border-radius: 13px; padding: 12px 14px; background: var(--surface-2); animation: bk-rise .3s cubic-bezier(.22,1,.36,1) both; }
        .bk-sections { display: grid; grid-template-columns: repeat(auto-fit, minmax(168px, 1fr)); gap: 8px; margin-top: 10px; }
        .bk-sec {
          display: flex; align-items: center; gap: 9px; text-align: left;
          border: 1px solid var(--line); border-radius: 11px; padding: 9px 11px;
          background: var(--card); cursor: pointer; font: inherit; width: 100%;
          transition: transform .14s cubic-bezier(.22,1,.36,1), border-color .18s, box-shadow .18s;
        }
        .bk-sec:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--accent); box-shadow: var(--shadow-sm); }
        .bk-sec:disabled { cursor: progress; opacity: .8; }
        .bk-sec.published { border-color: #12A06A; background: rgba(18,160,106,.07); }
        .bk-sec.draft { border-color: #D97706; background: rgba(217,119,6,.07); }
        .bk-sec-ic { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center; flex: 0 0 auto; }
        .bk-spin { animation: bk-spin .9s linear infinite; }
        .bk-chev { transition: transform .22s cubic-bezier(.22,1,.36,1); }
        .bk-chev.open { transform: rotate(90deg); }

        @media (prefers-reduced-motion: reduce) {
          .bk-card, .bk-chapter, .bk-chapters, .bk-drop-icon { animation: none !important; }
          .bk-drop.busy::after { animation: none; }
          .bk-sec:hover:not(:disabled) { transform: none; }
        }
      `}</style>
    </>
  )
}

/* ─────────────────────────── upload ─────────────────────────── */

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
      <div className="row gap-8" style={{ marginBottom: 12, alignItems: 'center' }}>
        <BookUp size={17} style={{ color: 'var(--accent-ink)' }} />
        <span className="h2">Upload a book</span>
      </div>

      <div className="row gap-8" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
        <input
          id="bk-title" className="input" placeholder="Title (defaults to the filename)"
          value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy}
          style={{ flex: '1 1 240px' }}
        />
        <select id="bk-class" className="select" value={klass} onChange={(e) => setKlass(e.target.value)} disabled={busy} style={{ width: 'auto' }}>
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
        role="button"
        tabIndex={0}
        aria-label="Choose a PDF to upload"
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !busy) inputRef.current?.click() }}
      >
        <div className="bk-drop-icon">
          {busy
            ? <Loader2 size={30} className="bk-spin" style={{ color: 'var(--accent-ink)' }} />
            : <UploadCloud size={30} style={{ color: over ? 'var(--accent-ink)' : 'var(--muted)' }} />}
        </div>
        <div className="strong" style={{ marginTop: 10 }}>
          {busy ? stage : over ? 'Drop it here' : 'Drag a PDF here, or click to choose'}
        </div>
        <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>
          PDF up to 40 MB · chapters are detected automatically · the file is not stored after extraction
        </div>
        {busy && <div className="bk-bar"><i style={{ width: `${pct}%` }} /></div>}
      </div>

      <input
        ref={inputRef} id="bk-file" type="file" accept="application/pdf,.pdf" hidden
        onChange={(e) => { const f = e.target.files?.[0]; if (f) send(f); e.target.value = '' }}
      />
    </Card>
  )
}

/* ─────────────────────────── one book ─────────────────────────── */

function BookCard({ book, index, editable, open, onToggle, onChanged }: {
  book: Book; index: number; editable: boolean; open: boolean; onToggle: () => void; onChanged: () => void
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const publish = async (next: boolean) => {
    setBusy(true)
    try {
      await api(`/books/${book.id}/publish`, { method: 'POST', body: { published: next } })
      toast(next ? 'Book is now visible to students' : 'Book hidden from students', 'ok')
      onChanged()
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Could not change visibility', 'err') } finally { setBusy(false) }
  }

  const remove = async () => {
    if (!window.confirm(`Delete "${book.title}" and everything generated from it? This cannot be undone.`)) return
    setBusy(true)
    try { await api(`/books/${book.id}`, { method: 'DELETE' }); toast('Book deleted', 'ok'); onChanged() }
    catch (e) { toast(e instanceof ApiError ? e.message : 'Could not delete', 'err') } finally { setBusy(false) }
  }

  const statusBadge =
    book.status === 'ready' ? <Badge tone="emerald">Ready</Badge>
    : book.status === 'failed' ? <Badge tone="red">Failed</Badge>
    : <Badge tone="orange">Processing</Badge>

  return (
    <Card className="bk-card" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
        <button
          className="btn-ghost sm"
          onClick={onToggle}
          aria-label={open ? 'Collapse chapters' : 'Expand chapters'}
          aria-expanded={open}
          style={{ padding: 6 }}
        >
          <ChevronRight size={17} className={`bk-chev${open ? ' open' : ''}`} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row gap-8" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="h2 truncate">{book.title}</span>
            {statusBadge}
            {book.published
              ? <Badge tone="emerald" dot={false}>Visible to students</Badge>
              : <Badge tone="gold" dot={false}>Hidden</Badge>}
          </div>
          <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>
            {[
              book.subject,
              book.class_level ? `Class ${book.class_level}` : 'All classes',
              book.page_count ? `${book.page_count} pages` : null,
              `${book.chapters} chapter${book.chapters === 1 ? '' : 's'}`,
              `${book.content_published}/${book.content_total} published`,
              book.uploaded_by_name,
              timeAgo(book.created_at),
            ].filter(Boolean).join(' · ')}
          </div>
          {book.status === 'failed' && book.error && (
            <div className="row gap-8" style={{ marginTop: 8, color: 'var(--red)', fontSize: 13, alignItems: 'flex-start' }}>
              <AlertTriangle size={15} style={{ flex: '0 0 auto', marginTop: 1 }} />
              <span>{book.error}</span>
            </div>
          )}
        </div>

        {editable && (
          <div className="row gap-8" style={{ flex: '0 0 auto' }}>
            <button
              className={`btn sm ${book.published ? '' : 'btn-primary'}`}
              onClick={() => publish(!book.published)}
              disabled={busy || book.status !== 'ready' || book.content_published === 0}
              title={book.content_published === 0 ? 'Publish at least one section first' : undefined}
            >
              {book.published ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show students</>}
            </button>
            <button className="btn-ghost sm" onClick={remove} disabled={busy} aria-label="Delete book">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {open && <Chapters bookId={book.id} editable={editable} onChanged={onChanged} />}
    </Card>
  )
}

/* ─────────────────────────── chapters + sub-sections ─────────────────────────── */

function Chapters({ bookId, editable, onChanged }: { bookId: string; editable: boolean; onChanged: () => void }) {
  const { data, loading, error, reload } = useApi<Chapter[]>(`/books/${bookId}/chapters`)

  if (loading) return <div className="bk-chapters"><Skel h={54} /><Skel h={54} /></div>
  if (error) return <div className="bk-chapters"><ErrorState message={error} onRetry={reload} /></div>
  if (!data?.length) return <div className="bk-chapters"><span className="faint">No chapters were detected in this PDF.</span></div>

  return (
    <div className="bk-chapters">
      {data.map((c, i) => (
        <ChapterRow
          key={c.id} chapter={c} index={i} editable={editable}
          onChanged={() => { reload(); onChanged() }}
        />
      ))}
    </div>
  )
}

function ChapterRow({ chapter, index, editable, onChanged }: {
  chapter: Chapter; index: number; editable: boolean; onChanged: () => void
}) {
  const toast = useToast()
  const [working, setWorking] = useState<Kind | null>(null)

  const byKind = (k: Kind) => chapter.content.find((c) => c.kind === k)

  const generate = async (kind: Kind) => {
    setWorking(kind)
    try {
      await api(`/books/chapter/${chapter.id}/generate`, { method: 'POST', body: { kind } })
      toast(`${kind} generated — review it before publishing.`, 'ok')
      onChanged()
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Generation failed', 'err') } finally { setWorking(null) }
  }

  const setStatus = async (row: ContentRow, status: 'draft' | 'published') => {
    setWorking(row.kind)
    try {
      await api(`/books/content/${row.id}/status`, { method: 'POST', body: { status } })
      toast(status === 'published' ? 'Published to students' : 'Moved back to draft', 'ok')
      onChanged()
    } catch (e) { toast(e instanceof ApiError ? e.message : 'Could not update', 'err') } finally { setWorking(null) }
  }

  return (
    <div className="bk-chapter" style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}>
      <div className="row gap-8" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="strong">{chapter.position}. {chapter.title}</span>
        <span className="faint" style={{ fontSize: 12 }}>
          {chapter.page_from && chapter.page_to ? `pages ${chapter.page_from}–${chapter.page_to}` : ''}
          {chapter.char_count ? ` · ${Math.round(chapter.char_count / 1000)}k chars` : ''}
        </span>
      </div>

      <div className="bk-sections">
        {SECTIONS.map(({ kind, label, icon: Icon, blurb }) => {
          const row = byKind(kind)
          const isBusy = working === kind
          const cls = row ? (row.status === 'published' ? 'published' : 'draft') : ''
          return (
            <button
              key={kind}
              className={`bk-sec ${cls}`}
              disabled={!editable || isBusy}
              onClick={() => {
                if (!row) return generate(kind)
                return setStatus(row, row.status === 'published' ? 'draft' : 'published')
              }}
              title={
                !row ? `Generate ${label.toLowerCase()} from this chapter`
                  : row.status === 'published' ? 'Published — click to hide from students'
                  : 'Draft — click to publish to students'
              }
            >
              <span className="bk-sec-ic" style={{ background: 'var(--surface-2)' }}>
                {isBusy
                  ? <Loader2 size={15} className="bk-spin" />
                  : <Icon size={15} style={{ color: 'var(--accent-ink)' }} />}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span className="strong" style={{ display: 'block', fontSize: 13 }}>{label}</span>
                <span className="faint" style={{ display: 'block', fontSize: 11.5 }}>
                  {isBusy ? 'Working…'
                    : !row ? blurb
                    : row.status === 'published' ? 'Live for students'
                    : 'Draft — not visible'}
                </span>
              </span>
              <span style={{ flex: '0 0 auto' }}>
                {!row ? <Sparkles size={14} style={{ color: 'var(--muted)' }} />
                  : row.status === 'published' ? <CheckCircle2 size={15} style={{ color: '#12A06A' }} />
                  : <CircleDashed size={15} style={{ color: '#D97706' }} />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
