'use client'

import { useState } from 'react'
import { FolderTree, Plus, Search, ChevronRight, Home, Layers, PanelRightOpen } from 'lucide-react'
import { useApi, useDebounced } from '@/components/useApi'
import { DataTable, type Column } from '@/components/DataTable'
import { Card, Badge, Skel } from '@/components/ui'
import { Modal } from '@/components/Modal'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'
import { api, ApiError } from '@/lib/api'
import type { CmsNode, CmsLevel, Paged } from '@/lib/types'
import type { AccentKey } from '@/lib/theme'
import { timeAgo } from '@/lib/format'
import { CmsDetail } from './CmsDetail'

const LEVEL_TONE: Record<CmsLevel, AccentKey> = { board: 'indigo', class: 'blue', subject: 'emerald', chapter: 'purple', topic: 'cyan', lesson: 'orange' }
const DIFFICULTIES = ['easy', 'medium', 'hard']

interface Crumb { id: string; name: string; level: CmsLevel }

export default function CmsPage() {
  const { can } = useAuth()
  const toast = useToast()
  const [path, setPath] = useState<Crumb[]>([])
  const [search, setSearch] = useState('')
  const debounced = useDebounced(search, 350)
  const [status, setStatus] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [sort, setSort] = useState('position')
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const parent = path[path.length - 1] || null
  const parentId = parent ? parent.id : 'root'
  const params = { parentId, status, difficulty, search: debounced, page, pageSize: 25, sort, dir }
  const { data, loading, error, reload } = useApi<Paged<CmsNode>>('/cms/nodes', params)

  function drill(node: CmsNode) {
    if (node.level === 'lesson') { setOpenId(node.id); return } // leaf → details
    setPath((p) => [...p, { id: node.id, name: node.name, level: node.level }])
    setPage(1); setSearch('')
  }
  function goTo(idx: number) { setPath((p) => p.slice(0, idx)); setPage(1); setSearch('') }
  function onSort(key: string) { if (sort === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc')); else { setSort(key); setDir('asc') } ; setPage(1) }

  const editable = can('content.edit')

  const columns: Column<CmsNode>[] = [
    {
      key: 'name', header: 'Name', sortable: true, render: (n) => (
        <div className="row gap-10">
          <Badge tone={LEVEL_TONE[n.level]} dot={false}>{n.level}</Badge>
          <div className="col" style={{ gap: 0, minWidth: 0 }}>
            <button className="strong" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'var(--ink)' }}
              onClick={(e) => { e.stopPropagation(); drill(n) }}>{n.name}</button>
            <span className="faint truncate" style={{ fontSize: 11 }}>/{n.slug}</span>
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (n) => <Badge>{n.status}</Badge> },
    { key: 'difficulty', header: 'Difficulty', render: (n) => n.difficulty ? <Badge tone={n.difficulty === 'hard' ? 'red' : n.difficulty === 'medium' ? 'gold' : 'emerald'} dot={false}>{n.difficulty}</Badge> : <span className="faint">—</span> },
    { key: 'tags', header: 'Tags', render: (n) => n.tags?.length ? <span className="faint" style={{ fontSize: 12 }}>{n.tags.slice(0, 3).join(', ')}{n.tags.length > 3 ? '…' : ''}</span> : <span className="faint">—</span> },
    { key: 'children', header: 'Children', align: 'right', render: (n) => n.level === 'lesson' ? <span className="faint">—</span> : <span className="tnum">{n.childCount ?? 0}</span> },
    { key: 'version', header: 'Ver', align: 'right', render: (n) => <span className="tnum faint">v{n.version}</span> },
    { key: 'updatedAt', header: 'Updated', sortable: true, render: (n) => <span className="nowrap">{timeAgo(n.updatedAt)}</span> },
    { key: 'actions', header: '', align: 'right', render: (n) => <button className="btn btn-ghost sm" onClick={(e) => { e.stopPropagation(); setOpenId(n.id) }} title="Details"><PanelRightOpen size={15} /></button> },
  ]

  return (
    <div className="col gap-16">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="h1">Content CMS</h1>
          <div className="sub">Manage the Board → Class → Subject → Chapter → Topic → Lesson hierarchy. Only Published content reaches students.</div>
        </div>
        {editable && (
          <div className="actions">
            <button className="btn btn-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> New {parent ? childLevelLabel(parent.level) : 'Board'}</button>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      <Card style={{ padding: '10px 14px' }}>
        <div className="row gap-6 wrap" style={{ alignItems: 'center' }}>
          <button className="btn btn-ghost sm" onClick={() => goTo(0)} disabled={!path.length}><Home size={14} /> Root</button>
          {path.map((c, i) => (
            <span key={c.id} className="row gap-6" style={{ alignItems: 'center' }}>
              <ChevronRight size={14} color="var(--faint)" />
              <button className="btn btn-ghost sm" onClick={() => goTo(i + 1)} disabled={i === path.length - 1}>
                <Badge tone={LEVEL_TONE[c.level]} dot={false}>{c.level}</Badge> {c.name}
              </button>
            </span>
          ))}
        </div>
      </Card>

      {/* Filters */}
      <div className="row gap-12 wrap">
        <div className="search grow" style={{ minWidth: 220, maxWidth: 360 }}>
          <Search size={16} />
          <input className="input" placeholder="Search name, slug, description, tags…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">Any status</option>
          {['draft', 'review', 'published', 'archived', 'rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="select" style={{ width: 'auto' }} value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1) }}>
          <option value="">Any difficulty</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.rows || []}
        rowId={(n) => n.id}
        loading={loading}
        error={error}
        onRetry={reload}
        sort={sort} dir={dir} onSort={onSort}
        page={data?.page} totalPages={data?.totalPages} total={data?.total} onPage={setPage}
        onRowClick={drill}
        emptyIcon={FolderTree}
        emptyTitle={parent ? `No ${childLevelLabel(parent.level)}s yet` : 'No boards yet'}
        emptyMessage={editable ? 'Create your first content node to build the hierarchy.' : 'No content at this level.'}
      />

      {openId && (
        <CmsDetail id={openId} onClose={() => setOpenId(null)} onChanged={reload} onDrill={(n) => { setOpenId(null); if (n.level !== 'lesson') { setPath((p) => [...p, { id: n.id, name: n.name, level: n.level }]); setPage(1) } }} />
      )}

      {createOpen && (
        <CreateModal
          parent={parent}
          onClose={() => setCreateOpen(false)}
          onCreated={() => { setCreateOpen(false); reload(); toast('Created', 'ok') }}
        />
      )}
    </div>
  )
}

const ORDER: CmsLevel[] = ['board', 'class', 'subject', 'chapter', 'topic', 'lesson']
function childLevelLabel(parentLevel: CmsLevel): string {
  const next = ORDER[ORDER.indexOf(parentLevel) + 1]
  return next ? next.charAt(0).toUpperCase() + next.slice(1) : 'Item'
}

function CreateModal({ parent, onClose, onCreated }: { parent: Crumb | null; onClose: () => void; onCreated: () => void }) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [tags, setTags] = useState('')
  const [duration, setDuration] = useState('')
  const [busy, setBusy] = useState(false)
  const label = parent ? childLevelLabel(parent.level) : 'Board'

  async function submit() {
    if (!name.trim()) { toast('Name is required', 'err'); return }
    setBusy(true)
    try {
      await api('/cms/nodes', { method: 'POST', body: {
        name: name.trim(), parentId: parent?.id ?? null, description,
        difficulty: difficulty || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        estimatedDuration: duration ? parseInt(duration, 10) : undefined,
      } })
      onCreated()
    } catch (e) { toast((e as ApiError)?.message || 'Create failed', 'err') } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={`New ${label}${parent ? ` in ${parent.name}` : ''}`} width={480}
      footer={<><button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button><button className="btn btn-primary" onClick={submit} disabled={busy}>{busy ? 'Creating…' : `Create ${label}`}</button></>}>
      <div className="col gap-14">
        <div className="field"><label>Name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={`e.g. ${label} name`} autoFocus /></div>
        <div className="field"><label>Description</label><textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" /></div>
        <div className="row gap-12 wrap">
          <div className="field grow"><label>Difficulty</label><select className="select" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="">—</option>{DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
          <div className="field" style={{ width: 140 }}><label>Duration (min)</label><input className="input" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 30" /></div>
        </div>
        <div className="field"><label>Tags (comma-separated)</label><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="algebra, ncert" /></div>
      </div>
    </Modal>
  )
}
