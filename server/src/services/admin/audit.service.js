'use strict'

const db = require('../../config/database')

// Central audit trail. Every admin mutation calls record() with a before/after pair.
// Best-effort by design: an audit write must never fail the underlying action, so
// errors are swallowed (and logged) rather than propagated.
async function record(req, { module, action, targetType, targetId, targetLabel, before, after }) {
  try {
    const actor = req.admin || {}
    await db.$executeRawUnsafe(
      `INSERT INTO "audit_logs"
         (actor_id, actor_name, actor_email, actor_role, module, action,
          target_type, target_id, target_label, before, after, ip, user_agent)
       VALUES ($1::uuid,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13)`,
      actor.id || null,
      actor.name || null,
      actor.email || null,
      actor.role || null,
      module,
      action,
      targetType || null,
      targetId != null ? String(targetId) : null,
      targetLabel || null,
      before != null ? JSON.stringify(before) : null,
      after != null ? JSON.stringify(after) : null,
      (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim() || null,
      (req.headers['user-agent'] || '').toString().slice(0, 400) || null,
    )
  } catch (err) {
    console.error('[audit] failed to record entry:', err && err.message)
  }
}

// Read side — filtered + paginated feed for the Audit Logs module.
async function list({ page = 1, pageSize = 25, module, action, actorId, search }) {
  let whereSql = ''
  const finalParams = []
  const conds = []
  if (module) { finalParams.push(module); conds.push(`module = $${finalParams.length}`) }
  if (action) { finalParams.push(action); conds.push(`action = $${finalParams.length}`) }
  if (actorId) { finalParams.push(actorId); conds.push(`actor_id = $${finalParams.length}::uuid`) }
  if (search) {
    finalParams.push(`%${search}%`)
    const i = finalParams.length
    conds.push(`(actor_name ILIKE $${i} OR actor_email ILIKE $${i} OR target_label ILIKE $${i} OR action ILIKE $${i})`)
  }
  if (conds.length) whereSql = 'WHERE ' + conds.join(' AND ')

  const size = Math.min(Math.max(parseInt(pageSize, 10) || 25, 1), 100)
  const pg = Math.max(parseInt(page, 10) || 1, 1)
  const offset = (pg - 1) * size

  const countRows = await db.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM "audit_logs" ${whereSql}`, ...finalParams)
  const total = (countRows && countRows[0] && countRows[0].n) || 0

  const rows = await db.$queryRawUnsafe(
    `SELECT id::text AS id, actor_id::text AS "actorId", actor_name AS "actorName",
            actor_email AS "actorEmail", actor_role AS "actorRole", module, action,
            target_type AS "targetType", target_id AS "targetId", target_label AS "targetLabel",
            before, after, ip, created_at AS "createdAt"
       FROM "audit_logs" ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${size} OFFSET ${offset}`,
    ...finalParams,
  )

  return { rows, total, page: pg, pageSize: size, totalPages: Math.max(1, Math.ceil(total / size)) }
}

// Distinct modules/actions for filter dropdowns.
async function facets() {
  const [mods, acts] = await Promise.all([
    db.$queryRawUnsafe(`SELECT DISTINCT module FROM "audit_logs" ORDER BY module`).catch(() => []),
    db.$queryRawUnsafe(`SELECT DISTINCT action FROM "audit_logs" ORDER BY action`).catch(() => []),
  ])
  return { modules: mods.map((m) => m.module), actions: acts.map((a) => a.action) }
}

module.exports = { record, list, facets }
