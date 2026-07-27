'use client'

import { ReactNode, useRef, useCallback, KeyboardEvent } from 'react'
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { TableSkeleton, EmptyState, ErrorState } from './ui'
import type { LucideIcon } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  width?: number | string
  align?: 'left' | 'right' | 'center'
  render: (row: T) => ReactNode
}

interface Props<T> {
  columns: Column<T>[]
  rows: T[]
  rowId: (row: T) => string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  // sorting (server-side)
  sort?: string
  dir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  // pagination (server-side)
  page?: number
  totalPages?: number
  total?: number
  onPage?: (page: number) => void
  // selection
  selectable?: boolean
  selected?: Set<string>
  onSelect?: (next: Set<string>) => void
  bulkActions?: ReactNode
  // interactions
  onRowClick?: (row: T) => void
  // empty
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyMessage?: string
}

export function DataTable<T>(p: Props<T>) {
  const bodyRef = useRef<HTMLTableSectionElement>(null)
  const allSelected = p.selectable && p.rows.length > 0 && p.rows.every((r) => p.selected?.has(p.rowId(r)))

  const toggleAll = useCallback(() => {
    if (!p.onSelect) return
    const next = new Set(p.selected)
    if (allSelected) p.rows.forEach((r) => next.delete(p.rowId(r)))
    else p.rows.forEach((r) => next.add(p.rowId(r)))
    p.onSelect(next)
  }, [allSelected, p])

  const toggleOne = useCallback((id: string) => {
    if (!p.onSelect) return
    const next = new Set(p.selected)
    next.has(id) ? next.delete(id) : next.add(id)
    p.onSelect(next)
  }, [p])

  // Keyboard nav: ↑/↓ move focus between rows, Enter opens, Space toggles selection.
  const onRowKey = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    const rows = Array.from(bodyRef.current?.querySelectorAll('tr[data-row]') || [])
    const idx = rows.indexOf(e.currentTarget)
    if (e.key === 'ArrowDown') { e.preventDefault(); (rows[idx + 1] as HTMLElement)?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (rows[idx - 1] as HTMLElement)?.focus() }
    else if (e.key === 'Enter' && p.onRowClick) { e.preventDefault(); p.onRowClick(row) }
    else if (e.key === ' ' && p.selectable) { e.preventDefault(); toggleOne(p.rowId(row)) }
  }

  const selCount = p.selected?.size || 0

  return (
    <div className="card flush">
      {p.selectable && selCount > 0 && (
        <div className="bulk-bar">
          <span>{selCount} selected</span>
          <span className="ml-auto row gap-8">{p.bulkActions}</span>
          <button className="btn btn-ghost sm" onClick={() => p.onSelect?.(new Set())}>Clear</button>
        </div>
      )}
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {p.selectable && (
                <th className="checkbox-cell">
                  <span className={`checkbox ${allSelected ? 'checked' : ''}`} onClick={toggleAll} role="checkbox" aria-checked={!!allSelected}>
                    {allSelected && <Check size={13} strokeWidth={3} />}
                  </span>
                </th>
              )}
              {p.columns.map((c) => {
                const active = p.sort === c.key
                return (
                  <th key={c.key} className={c.sortable ? 'sortable' : ''} style={{ width: c.width, textAlign: c.align }}
                    onClick={() => c.sortable && p.onSort?.(c.key)}>
                    {c.header}
                    {c.sortable && (
                      <span className="sort-ind">
                        {active ? (p.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} />}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          {!p.loading && !p.error && (
            <tbody ref={bodyRef}>
              {p.rows.map((row) => {
                const id = p.rowId(row)
                const sel = p.selected?.has(id)
                return (
                  <tr key={id} data-row tabIndex={0} className={sel ? 'selected' : ''}
                    onKeyDown={(e) => onRowKey(e, row)}
                    onClick={() => p.onRowClick?.(row)}
                    style={{ cursor: p.onRowClick ? 'pointer' : 'default', outlineOffset: -2 }}>
                    {p.selectable && (
                      <td className="checkbox-cell" onClick={(e) => { e.stopPropagation(); toggleOne(id) }}>
                        <span className={`checkbox ${sel ? 'checked' : ''}`} role="checkbox" aria-checked={!!sel}>
                          {sel && <Check size={13} strokeWidth={3} />}
                        </span>
                      </td>
                    )}
                    {p.columns.map((c) => (
                      <td key={c.key} style={{ textAlign: c.align }}>{c.render(row)}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          )}
        </table>
      </div>

      {p.loading && <TableSkeleton rows={8} cols={p.columns.length + (p.selectable ? 1 : 0)} />}
      {p.error && !p.loading && <ErrorState message={p.error} onRetry={p.onRetry} />}
      {!p.loading && !p.error && p.rows.length === 0 && (
        <EmptyState icon={p.emptyIcon} title={p.emptyTitle || 'Nothing here yet'} message={p.emptyMessage} />
      )}

      {!p.error && (p.totalPages ?? 1) > 0 && p.rows.length > 0 && (
        <div className="pagination">
          <span className="info">
            {p.total !== undefined ? `${p.total.toLocaleString('en-IN')} total · ` : ''}Page {p.page || 1} of {p.totalPages || 1}
          </span>
          <span className="ml-auto row gap-6">
            <button className="btn btn-ghost sm" disabled={(p.page || 1) <= 1} onClick={() => p.onPage?.((p.page || 1) - 1)}>
              <ChevronLeft size={15} /> Prev
            </button>
            <button className="btn btn-ghost sm" disabled={(p.page || 1) >= (p.totalPages || 1)} onClick={() => p.onPage?.((p.page || 1) + 1)}>
              Next <ChevronRight size={15} />
            </button>
          </span>
        </div>
      )}
    </div>
  )
}
