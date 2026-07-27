'use strict'

// CMS content hierarchy (Phase 1). Board→Class→Subject→Chapter→Topic→Lesson as one
// normalized UUID tree with status workflow, immutable publish versions, soft delete,
// optimistic locking and audit. Parallel to the legacy catalog — touches nothing there.

const db = require('../../config/database')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')
const { hasPermission } = require('../../services/admin/permissions')

const LEVELS = ['board', 'class', 'subject', 'chapter', 'topic', 'lesson']
const STATUSES = ['draft', 'review', 'published', 'archived', 'rejected']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const SORTABLE = { position: 'position', name: 'name', updatedAt: '"updated_at"', createdAt: '"created_at"', status: 'status' }

// Postgres unique_violation. A partial/functional unique index is reported by its key
// expression (not the index name), so match the SQLSTATE, not a constraint name.
const isUniqueViolation = (e) => String(e && e.message || '').includes('23505')
const childLevel = (parentLevel) => LEVELS[LEVELS.indexOf(parentLevel) + 1] || null
const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item'
const num = (v) => Number(v) || 0

const NODE_COLS = `id::text AS id, parent_id::text AS "parentId", level, name, slug, description, position,
  status, icon, cover_image AS "coverImage", estimated_duration AS "estimatedDuration", difficulty, tags,
  visibility, version, lock_version AS "lockVersion", created_by_name AS "createdByName",
  updated_by_name AS "updatedByName", published_at AS "publishedAt", created_at AS "createdAt", updated_at AS "updatedAt"`

async function loadOr404(id) {
  const rows = await db.$queryRawUnsafe(`SELECT * FROM "cms_nodes" WHERE id = $1::uuid AND deleted_at IS NULL LIMIT 1`, id)
  const n = rows && rows[0]
  if (!n) throw new AppError('Content node not found', 404)
  return n
}

// ─── GET /api/admin/cms/nodes ─────────────────────────────────────────────────
async function list(req, res, next) {
  try {
    const { level, status, parentId, difficulty, tag, search, sort = 'position', dir = 'asc' } = req.query
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 25, 1), 100)
    const conds = ['deleted_at IS NULL']
    const params = []
    const bind = (v) => { params.push(v); return `$${params.length}` }

    if (level && LEVELS.includes(level)) conds.push(`level = ${bind(level)}`)
    if (status && STATUSES.includes(status)) conds.push(`status = ${bind(status)}`)
    if (parentId === 'root') conds.push('parent_id IS NULL')
    else if (parentId) conds.push(`parent_id = ${bind(parentId)}::uuid`)
    if (difficulty && DIFFICULTIES.includes(difficulty)) conds.push(`difficulty = ${bind(difficulty)}`)
    if (tag) conds.push(`${bind(tag)} = ANY(tags)`)
    if (search) {
      const p = bind(`%${String(search).trim()}%`)
      conds.push(`(name ILIKE ${p} OR slug ILIKE ${p} OR description ILIKE ${p} OR array_to_string(tags, ' ') ILIKE ${p})`)
    }
    const where = 'WHERE ' + conds.join(' AND ')
    const orderCol = SORTABLE[sort] || 'position'
    const orderDir = String(dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC'
    const offset = (page - 1) * pageSize

    const countRow = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "cms_nodes" ${where}`, ...params)
    const total = num(countRow && countRow[0] && countRow[0].n)
    const rows = await db.$queryRawUnsafe(
      `SELECT ${NODE_COLS},
              (SELECT COUNT(*) FROM "cms_nodes" c WHERE c.parent_id = "cms_nodes".id AND c.deleted_at IS NULL)::int AS "childCount"
         FROM "cms_nodes" ${where}
        ORDER BY ${orderCol} ${orderDir} NULLS LAST, name ASC
        LIMIT ${pageSize} OFFSET ${offset}`,
      ...params,
    )
    return ApiResponse.success(res, { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) })
  } catch (err) { next(err) }
}

// ─── GET /api/admin/cms/nodes/:id (+ breadcrumb + child count) ─────────────────
async function get(req, res, next) {
  try {
    const node = await loadOr404(req.params.id)
    const [breadcrumb, kids] = await Promise.all([
      db.$queryRawUnsafe(
        `WITH RECURSIVE anc AS (
           SELECT id, parent_id, name, level, slug, 0 AS depth FROM "cms_nodes" WHERE id = $1::uuid
           UNION ALL
           SELECT n.id, n.parent_id, n.name, n.level, n.slug, anc.depth + 1
             FROM "cms_nodes" n JOIN anc ON n.id = anc.parent_id)
         SELECT id::text AS id, name, level, slug FROM anc WHERE id <> $1::uuid ORDER BY depth DESC`,
        req.params.id,
      ).catch(() => []),
      db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "cms_nodes" WHERE parent_id = $1::uuid AND deleted_at IS NULL`, req.params.id),
    ])
    const one = await db.$queryRawUnsafe(`SELECT ${NODE_COLS} FROM "cms_nodes" WHERE id = $1::uuid`, req.params.id)
    return ApiResponse.success(res, { node: one[0], breadcrumb, childCount: num(kids[0] && kids[0].n) })
  } catch (err) { next(err) }
}

// ─── POST /api/admin/cms/nodes ────────────────────────────────────────────────
async function create(req, res, next) {
  try {
    const { name, parentId = null, description = '', icon = null, coverImage = null, estimatedDuration = null, difficulty = null, tags = [], visibility = 'visible' } = req.body
    if (!name || !String(name).trim()) throw new AppError('name is required', 422)
    if (difficulty && !DIFFICULTIES.includes(difficulty)) throw new AppError('invalid difficulty', 422)
    if (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string')) throw new AppError('tags must be an array of strings', 422)

    // Derive + validate the level from the parent.
    let level
    let parent = null
    if (!parentId) {
      level = 'board'
    } else {
      parent = await loadOr404(parentId)
      level = childLevel(parent.level)
      if (!level) throw new AppError(`A ${parent.level} cannot have child nodes`, 422)
    }
    const slug = slugify(req.body.slug || name)

    // Append at the end of the sibling list.
    const posRow = await db.$queryRawUnsafe(
      `SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM "cms_nodes"
        WHERE ${parentId ? 'parent_id = $1::uuid' : 'parent_id IS NULL'} AND deleted_at IS NULL`,
      ...(parentId ? [parentId] : []),
    )
    const position = num(posRow[0] && posRow[0].pos)

    let rows
    try {
      rows = await db.$queryRawUnsafe(
        `INSERT INTO "cms_nodes" (parent_id, level, name, slug, description, position, icon, cover_image,
                                  estimated_duration, difficulty, tags, visibility, created_by, created_by_name, updated_by, updated_by_name)
         VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::text[],$12,$13::uuid,$14,$13::uuid,$14)
         RETURNING ${NODE_COLS}`,
        parentId, level, String(name).trim(), slug, description, position, icon, coverImage,
        estimatedDuration != null ? parseInt(estimatedDuration, 10) : null, difficulty, tags, visibility,
        req.admin.id, req.admin.name,
      )
    } catch (e) {
      if (isUniqueViolation(e)) throw new AppError(`A ${level} with slug "${slug}" already exists here`, 409, 'DUPLICATE_SLUG')
      throw e
    }
    const created = rows[0]
    await audit.record(req, { module: 'cms', action: 'node.create', targetType: 'cms_node', targetId: created.id, targetLabel: `${level}:${created.name}`, after: created })
    return ApiResponse.created(res, { node: created })
  } catch (err) { next(err) }
}

// ─── PATCH /api/admin/cms/nodes/:id (optimistic lock) ─────────────────────────
async function update(req, res, next) {
  try {
    const cur = await loadOr404(req.params.id)
    if (req.body.expectedLockVersion !== undefined && Number(req.body.expectedLockVersion) !== cur.lock_version) {
      throw new AppError('This item was changed by someone else. Reload and try again.', 409, 'VERSION_CONFLICT')
    }
    const fields = { name: 'name', description: 'description', icon: 'icon', coverImage: 'cover_image', estimatedDuration: 'estimated_duration', difficulty: 'difficulty', visibility: 'visibility' }
    const sets = []
    const params = []
    const bind = (v) => { params.push(v); return `$${params.length}` }
    for (const [key, col] of Object.entries(fields)) {
      if (req.body[key] !== undefined) {
        let v = req.body[key]
        if (col === 'difficulty' && v && !DIFFICULTIES.includes(v)) throw new AppError('invalid difficulty', 422)
        if (col === 'estimated_duration') v = v != null && v !== '' ? parseInt(v, 10) : null
        sets.push(`${col} = ${bind(v)}`)
      }
    }
    if (Array.isArray(req.body.tags)) sets.push(`tags = ${bind(req.body.tags)}::text[]`)
    if (req.body.slug !== undefined) sets.push(`slug = ${bind(slugify(req.body.slug))}`)
    if (req.body.name !== undefined && !String(req.body.name).trim()) throw new AppError('name cannot be empty', 422)
    if (!sets.length) throw new AppError('Nothing to update', 400)

    sets.push(`lock_version = lock_version + 1`, `updated_at = now()`, `updated_by = ${bind(req.admin.id)}::uuid`, `updated_by_name = ${bind(req.admin.name)}`)
    const idBind = bind(req.params.id)
    const verBind = bind(cur.lock_version)
    let rows
    try {
      rows = await db.$queryRawUnsafe(
        `UPDATE "cms_nodes" SET ${sets.join(', ')} WHERE id = ${idBind}::uuid AND lock_version = ${verBind} RETURNING ${NODE_COLS}`,
        ...params,
      )
    } catch (e) {
      if (isUniqueViolation(e)) throw new AppError('That slug is already used by a sibling', 409, 'DUPLICATE_SLUG')
      throw e
    }
    if (!rows || !rows[0]) throw new AppError('This item was changed by someone else. Reload and try again.', 409, 'VERSION_CONFLICT')
    await audit.record(req, { module: 'cms', action: 'node.update', targetType: 'cms_node', targetId: cur.id, targetLabel: `${cur.level}:${cur.name}`, before: { name: cur.name, status: cur.status }, after: rows[0] })
    return ApiResponse.success(res, { node: rows[0] })
  } catch (err) { next(err) }
}

// ─── POST /api/admin/cms/nodes/reorder  { parentId, orderedIds:[] } ───────────
async function reorder(req, res, next) {
  try {
    const { parentId = null, orderedIds } = req.body
    if (!Array.isArray(orderedIds) || !orderedIds.length) throw new AppError('orderedIds must be a non-empty array', 422)
    await db.$transaction(orderedIds.map((id, i) =>
      db.$executeRawUnsafe(
        `UPDATE "cms_nodes" SET position = $2, updated_at = now() WHERE id = $1::uuid AND deleted_at IS NULL
           AND ${parentId ? 'parent_id = $3::uuid' : 'parent_id IS NULL'}`,
        ...(parentId ? [id, i, parentId] : [id, i]),
      )))
    await audit.record(req, { module: 'cms', action: 'node.reorder', targetType: 'cms_node', targetId: parentId || 'root', targetLabel: `reordered ${orderedIds.length}` })
    return ApiResponse.success(res, { reordered: orderedIds.length }, 'Order updated')
  } catch (err) { next(err) }
}

// ─── POST /api/admin/cms/nodes/:id/status  { status, changeSummary } ──────────
async function transition(req, res, next) {
  try {
    const cur = await loadOr404(req.params.id)
    const status = String(req.body.status || '')
    if (!STATUSES.includes(status)) throw new AppError(`status must be one of ${STATUSES.join(', ')}`, 422)

    // Publishing needs the dedicated permission — editors can move to review but not publish.
    if (status === 'published' && !hasPermission(req.admin.role, 'content.publish')) {
      throw new AppError('You do not have permission to publish content', 403)
    }

    if (status === 'published') {
      // Every publish creates a new immutable version snapshot.
      const newVersion = cur.version + 1
      const snapshot = { ...cur }
      delete snapshot.snapshot
      await db.$executeRawUnsafe(
        `INSERT INTO "cms_versions" (node_id, version, status, editor_id, editor_name, change_summary, snapshot, published_at)
         VALUES ($1::uuid, $2, 'published', $3::uuid, $4, $5, $6::jsonb, now())`,
        cur.id, newVersion, req.admin.id, req.admin.name, String(req.body.changeSummary || '').slice(0, 500),
        JSON.stringify({ ...serializeNode(cur), version: newVersion }),
      )
      await db.$executeRawUnsafe(
        `UPDATE "cms_nodes" SET status='published', published_at=now(), version=$2, lock_version=lock_version+1, updated_at=now(), updated_by=$3::uuid, updated_by_name=$4 WHERE id=$1::uuid`,
        cur.id, newVersion, req.admin.id, req.admin.name,
      )
    } else {
      await db.$executeRawUnsafe(
        `UPDATE "cms_nodes" SET status=$2, lock_version=lock_version+1, updated_at=now(), updated_by=$3::uuid, updated_by_name=$4 WHERE id=$1::uuid`,
        cur.id, status, req.admin.id, req.admin.name,
      )
    }
    await audit.record(req, { module: 'cms', action: `node.status.${status}`, targetType: 'cms_node', targetId: cur.id, targetLabel: `${cur.level}:${cur.name}`, before: { status: cur.status }, after: { status } })
    const rows = await db.$queryRawUnsafe(`SELECT ${NODE_COLS} FROM "cms_nodes" WHERE id=$1::uuid`, cur.id)
    return ApiResponse.success(res, { node: rows[0] }, `Moved to ${status}`)
  } catch (err) { next(err) }
}

// ─── DELETE /api/admin/cms/nodes/:id?cascade=true (soft delete + dep guard) ────
async function remove(req, res, next) {
  try {
    const cur = await loadOr404(req.params.id)
    const cascade = req.query.cascade === 'true'
    const kids = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "cms_nodes" WHERE parent_id=$1::uuid AND deleted_at IS NULL`, cur.id)
    const childCount = num(kids[0] && kids[0].n)
    if (childCount > 0 && !cascade) {
      throw new AppError(`This ${cur.level} has ${childCount} child item${childCount > 1 ? 's' : ''}. Deleting it will remove them too — confirm cascade delete.`, 409, 'HAS_CHILDREN')
    }
    // Soft-delete the node (and its whole subtree when cascading).
    await db.$executeRawUnsafe(
      `WITH RECURSIVE sub AS (
         SELECT id FROM "cms_nodes" WHERE id=$1::uuid
         UNION ALL SELECT n.id FROM "cms_nodes" n JOIN sub ON n.parent_id = sub.id WHERE n.deleted_at IS NULL)
       UPDATE "cms_nodes" SET deleted_at = now() WHERE id IN (SELECT id FROM sub) AND deleted_at IS NULL`,
      cur.id,
    )
    await audit.record(req, { module: 'cms', action: 'node.delete', targetType: 'cms_node', targetId: cur.id, targetLabel: `${cur.level}:${cur.name}`, before: { name: cur.name, childCount } })
    return ApiResponse.success(res, { id: cur.id, cascaded: cascade, childCount }, 'Deleted')
  } catch (err) { next(err) }
}

// ─── GET /api/admin/cms/nodes/:id/versions ────────────────────────────────────
async function versions(req, res, next) {
  try {
    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, version, status, editor_name AS "editorName", change_summary AS "changeSummary",
              published_at AS "publishedAt", created_at AS "createdAt"
         FROM "cms_versions" WHERE node_id = $1::uuid ORDER BY version DESC`,
      req.params.id,
    )
    return ApiResponse.success(res, { rows })
  } catch (err) { next(err) }
}

// ─── POST /api/admin/cms/nodes/:id/versions/:version/restore ──────────────────
async function restore(req, res, next) {
  try {
    const cur = await loadOr404(req.params.id)
    const v = parseInt(req.params.version, 10)
    const vr = await db.$queryRawUnsafe(`SELECT snapshot FROM "cms_versions" WHERE node_id=$1::uuid AND version=$2 LIMIT 1`, cur.id, v)
    if (!vr[0]) throw new AppError('Version not found', 404)
    const s = vr[0].snapshot || {}
    // Restore the editable fields as a new DRAFT (never silently overwrites the live version).
    const rows = await db.$queryRawUnsafe(
      `UPDATE "cms_nodes" SET name=$2, description=$3, icon=$4, cover_image=$5, estimated_duration=$6,
              difficulty=$7, tags=$8::text[], visibility=$9, status='draft', lock_version=lock_version+1,
              updated_at=now(), updated_by=$10::uuid, updated_by_name=$11
         WHERE id=$1::uuid RETURNING ${NODE_COLS}`,
      cur.id, s.name || cur.name, s.description || '', s.icon || null, s.coverImage || null,
      s.estimatedDuration != null ? s.estimatedDuration : null, s.difficulty || null,
      Array.isArray(s.tags) ? s.tags : [], s.visibility || 'visible', req.admin.id, req.admin.name,
    )
    await audit.record(req, { module: 'cms', action: 'node.restore', targetType: 'cms_node', targetId: cur.id, targetLabel: `${cur.level}:${cur.name}`, after: { restoredFrom: v } })
    return ApiResponse.success(res, { node: rows[0] }, `Restored version ${v} as a draft`)
  } catch (err) { next(err) }
}

// ─── POST /api/admin/cms/nodes/:id/duplicate — deep-copy the subtree as a draft ──
// The whole subtree is copied under the same parent as a fresh DRAFT (version 0), so a
// duplicate never accidentally goes live. Runs in a transaction; the copy's root gets a
// unique "-copy" slug among its siblings, descendants keep their (already-unique) slugs.
async function duplicate(req, res, next) {
  try {
    const cur = await loadOr404(req.params.id)
    const parentCond = cur.parent_id ? 'parent_id = $1::uuid' : 'parent_id IS NULL'
    const base = slugify(`${cur.name}-copy`)
    const sibs = await db.$queryRawUnsafe(
      `SELECT slug FROM "cms_nodes" WHERE ${parentCond} AND deleted_at IS NULL AND slug LIKE ${cur.parent_id ? '$2' : '$1'}`,
      ...(cur.parent_id ? [cur.parent_id, `${base}%`] : [`${base}%`]),
    )
    const taken = new Set(sibs.map((r) => r.slug))
    let slug = base; let i = 2
    while (taken.has(slug)) slug = `${base}-${i++}`
    const posRow = await db.$queryRawUnsafe(
      `SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM "cms_nodes" WHERE ${parentCond} AND deleted_at IS NULL`,
      ...(cur.parent_id ? [cur.parent_id] : []),
    )
    const rootPos = num(posRow[0] && posRow[0].pos)

    const newRootId = await db.$transaction(async (tx) => {
      const insert = (parentId, n) => tx.$queryRawUnsafe(
        `INSERT INTO "cms_nodes" (parent_id, level, name, slug, description, position, icon, cover_image,
                                  estimated_duration, difficulty, tags, visibility, status, version, lock_version,
                                  created_by, created_by_name, updated_by, updated_by_name)
         VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::text[],$12,'draft',0,1,$13::uuid,$14,$13::uuid,$14)
         RETURNING id::text AS id`,
        parentId, n.level, n.name, n.slug, n.description, n.position, n.icon, n.coverImage,
        n.estimatedDuration, n.difficulty, n.tags || [], n.visibility, req.admin.id, req.admin.name,
      )
      const rootRows = await insert(cur.parent_id, {
        level: cur.level, name: `${cur.name} (copy)`, slug, description: cur.description, position: rootPos,
        icon: cur.icon, coverImage: cur.cover_image, estimatedDuration: cur.estimated_duration,
        difficulty: cur.difficulty, tags: cur.tags, visibility: cur.visibility,
      })
      const rootId = rootRows[0].id
      const desc = await tx.$queryRawUnsafe(
        `WITH RECURSIVE sub AS (
           SELECT *, 0 AS depth FROM "cms_nodes" WHERE parent_id = $1::uuid AND deleted_at IS NULL
           UNION ALL SELECT n.*, sub.depth + 1 FROM "cms_nodes" n JOIN sub ON n.parent_id = sub.id WHERE n.deleted_at IS NULL)
         SELECT id::text AS id, parent_id::text AS "parentId", level, name, slug, description, position,
                icon, cover_image AS "coverImage", estimated_duration AS "estimatedDuration", difficulty, tags, visibility, depth
           FROM sub ORDER BY depth ASC, position ASC`,
        cur.id,
      )
      const idMap = { [cur.id]: rootId }
      for (const d of desc) {
        const np = idMap[d.parentId]
        if (!np) continue
        const r = await insert(np, d)
        idMap[d.id] = r[0].id
      }
      return rootId
    })

    const rows = await db.$queryRawUnsafe(`SELECT ${NODE_COLS} FROM "cms_nodes" WHERE id=$1::uuid`, newRootId)
    await audit.record(req, { module: 'cms', action: 'node.duplicate', targetType: 'cms_node', targetId: newRootId, targetLabel: `${cur.level}:${cur.name} (copy)`, before: { source: cur.id } })
    return ApiResponse.created(res, { node: rows[0] })
  } catch (err) {
    if (isUniqueViolation(err)) return next(new AppError('Could not create a uniquely-named copy — rename the original and try again', 409, 'DUPLICATE_SLUG'))
    next(err)
  }
}

// ─── GET /api/admin/cms/nodes/:id/subtree — descendant counts by level + status ──
// Powers the cascade-delete breakdown ("12 chapters, 68 lessons, …") and the detail
// screen's coverage counts. Excludes the node itself.
async function subtree(req, res, next) {
  try {
    await loadOr404(req.params.id)
    const rows = await db.$queryRawUnsafe(
      `WITH RECURSIVE sub AS (
         SELECT id, level, status FROM "cms_nodes" WHERE parent_id = $1::uuid AND deleted_at IS NULL
         UNION ALL SELECT n.id, n.level, n.status FROM "cms_nodes" n JOIN sub ON n.parent_id = sub.id WHERE n.deleted_at IS NULL)
       SELECT level, status, COUNT(*)::int AS n FROM sub GROUP BY level, status`,
      req.params.id,
    )
    const byLevel = {}; const byStatus = {}; let total = 0
    for (const r of rows) {
      byLevel[r.level] = (byLevel[r.level] || 0) + r.n
      byStatus[r.status] = (byStatus[r.status] || 0) + r.n
      total += r.n
    }
    return ApiResponse.success(res, { counts: rows, byLevel, byStatus, total })
  } catch (err) { next(err) }
}

// ─── GET /api/admin/cms/meta (filter facets) ──────────────────────────────────
async function meta(req, res, next) {
  try {
    const tagRows = await db.$queryRawUnsafe(`SELECT DISTINCT unnest(tags) AS tag FROM "cms_nodes" WHERE deleted_at IS NULL ORDER BY tag LIMIT 200`).catch(() => [])
    const counts = await db.$queryRawUnsafe(`SELECT level, status, COUNT(*)::int AS n FROM "cms_nodes" WHERE deleted_at IS NULL GROUP BY level, status`).catch(() => [])
    return ApiResponse.success(res, {
      levels: LEVELS, statuses: STATUSES, difficulties: DIFFICULTIES,
      tags: tagRows.map((t) => t.tag), counts,
    })
  } catch (err) { next(err) }
}

// ─── PUBLIC: GET /api/cms/published?parentId= ─────────────────────────────────
// The Student app read path. Returns ONLY published + visible + non-deleted nodes, so a
// draft can never leak. Level-by-level (parentId) so the app lazy-loads the tree.
async function published(req, res, next) {
  try {
    const parentId = req.query.parentId
    const level = req.query.level
    const conds = [`status = 'published'`, `visibility = 'visible'`, 'deleted_at IS NULL']
    const params = []
    const bind = (v) => { params.push(v); return `$${params.length}` }
    if (parentId) conds.push(`parent_id = ${bind(parentId)}::uuid`)
    else if (!level) conds.push('parent_id IS NULL')
    if (level && LEVELS.includes(level)) conds.push(`level = ${bind(level)}`)
    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, parent_id::text AS "parentId", level, name, slug, description, position,
              icon, cover_image AS "coverImage", estimated_duration AS "estimatedDuration", difficulty, tags,
              version, published_at AS "publishedAt",
              (SELECT COUNT(*) FROM "cms_nodes" c WHERE c.parent_id = "cms_nodes".id
                 AND c.status='published' AND c.visibility='visible' AND c.deleted_at IS NULL)::int AS "childCount"
         FROM "cms_nodes" WHERE ${conds.join(' AND ')}
        ORDER BY position ASC, name ASC LIMIT 500`,
      ...params,
    )
    res.set('Cache-Control', 'public, max-age=30')
    return ApiResponse.success(res, { nodes: rows })
  } catch (err) { next(err) }
}

function serializeNode(n) {
  return {
    id: n.id, parentId: n.parent_id, level: n.level, name: n.name, slug: n.slug, description: n.description,
    position: n.position, status: n.status, icon: n.icon, coverImage: n.cover_image,
    estimatedDuration: n.estimated_duration, difficulty: n.difficulty, tags: n.tags, visibility: n.visibility,
  }
}

module.exports = { list, get, create, update, reorder, transition, remove, versions, restore, meta, published, duplicate, subtree }
