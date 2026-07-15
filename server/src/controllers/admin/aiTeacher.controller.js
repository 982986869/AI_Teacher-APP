'use strict'

// AI Teacher — MONITOR + CONFIGURE only. This module never touches the runtime lesson/
// doubt flow (prompts stay in code; generation stays server-side). It surfaces what the
// AI Teacher is doing (lessons, quality, failures) and lets an admin store non-runtime
// configuration (model preferences, review notes) in app_settings.

const fs = require('fs')
const path = require('path')
const db = require('../../config/database')
const { config } = require('../../config/env')
const ApiResponse = require('../../utils/ApiResponse')
const { AppError } = require('../../middleware/errorHandler')
const audit = require('../../services/admin/audit.service')

// Per-widget resilience, but failures are LOGGED (never silently swallowed) so a real
// schema/query error surfaces in the backend logs instead of masquerading as empty data.
const q = (sql, ...p) => db.$queryRawUnsafe(sql, ...p).catch((err) => {
  console.error('[ai-teacher] query failed:', err && err.message ? err.message : err,
    '\n  SQL:', String(sql).replace(/\s+/g, ' ').trim().slice(0, 160))
  return []
})
const one = async (sql, ...p) => { const r = await q(sql, ...p); return (r && r[0]) || {} }
const num = (v) => Number(v) || 0

const PROMPTS_DIR = path.join(__dirname, '..', '..', 'prompts')

// Read the on-disk prompt inventory (name + size + mtime). We intentionally do NOT edit
// these here — prompt *editing/versioning* would change runtime behaviour, so it is
// reported as a monitored, read-only inventory. A versioned prompt store is a future,
// clearly-pending capability (needs its own table + a safe activation path).
function readPromptInventory() {
  try {
    return fs.readdirSync(PROMPTS_DIR)
      .filter((f) => f.endsWith('.prompt.js'))
      .map((f) => {
        const st = fs.statSync(path.join(PROMPTS_DIR, f))
        return { name: f.replace('.prompt.js', ''), file: f, bytes: st.size, updatedAt: st.mtime }
      })
  } catch { return [] }
}

// GET /api/admin/ai-teacher/overview
async function overview(req, res, next) {
  try {
    const [lessons, doubts, models] = await Promise.all([
      one(`SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE status='READY')::int AS ready,
                  COUNT(*) FILTER (WHERE status='GENERATING')::int AS generating,
                  COUNT(*) FILTER (WHERE status='FAILED')::int AS failed,
                  COUNT(*) FILTER (WHERE "createdAt" >= now() - interval '7 days')::int AS this_week,
                  COALESCE(AVG("generationTimeMs"),0)::int AS avg_gen_ms
             FROM "lessons"`),
      one(`SELECT COUNT(*)::int AS total FROM "doubt_sessions"`).catch(() => ({ total: 0 })),
      q(`SELECT "generationModel" AS model, COUNT(*)::int AS n FROM "lessons"
          WHERE "generationModel" IS NOT NULL GROUP BY "generationModel" ORDER BY n DESC`),
    ])

    // Editable, non-runtime config lives in app_settings under aiteacher_config.
    const cfgRow = await q(`SELECT value FROM "app_settings" WHERE key = 'aiteacher_config' LIMIT 1`)
    const storedConfig = (cfgRow && cfgRow[0] && cfgRow[0].value) || {}

    return ApiResponse.success(res, {
      lessons: {
        total: num(lessons.total), ready: num(lessons.ready), generating: num(lessons.generating),
        failed: num(lessons.failed), thisWeek: num(lessons.this_week), avgGenMs: num(lessons.avg_gen_ms),
      },
      doubts: num(doubts.total),
      // Runtime model config is read from the server env (source of truth, read-only here).
      runtime: {
        provider: config.ai.provider,
        lessonModel: config.ai.lessonModel || null,
        doubtModel: config.ai.doubtModel || null,
        knowledgeModel: config.ai.knowledgeModel || null,
        mockMode: config.ai.mockMode,
        ttsEnabled: config.tts.enabled,
        ttsModel: config.tts.model,
      },
      modelsInUse: models.map((m) => ({ model: m.model, lessons: num(m.n) })),
      prompts: readPromptInventory(),
      config: storedConfig,
      // Honestly signal what is not yet backed by a real store.
      pending: {
        promptVersioning: 'Prompt editing/versioning is not enabled — prompts live in server code. A versioned, safely-activatable store is planned.',
        lessonTemplates: 'Lesson templates are generated at runtime; a template library is not yet stored.',
        topicGeneration: 'Batch topic generation is not exposed as an admin job yet.',
      },
    })
  } catch (err) { next(err) }
}

// GET /api/admin/ai-teacher/lessons?status=&search=&page= — quality review feed.
async function lessons(req, res, next) {
  try {
    const { status, search } = req.query
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 100)
    const conds = []
    const params = []
    const bind = (v) => { params.push(v); return `$${params.length}` }
    // status is the "LessonStatus" enum; cast the column to text so a bound text
    // parameter compares correctly (a bound param is text-typed, so `enum = $1`
    // raises 42883 "operator does not exist"). ::text also makes an unknown status
    // simply match nothing instead of erroring.
    if (status) conds.push(`l.status::text = ${bind(String(status).toUpperCase())}`)
    if (search) conds.push(`(l."lessonTitle" ILIKE ${bind(`%${search}%`)} OR l.topic ILIKE ${bind(`%${search}%`)})`)
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
    const offset = (page - 1) * pageSize

    const countRow = await q(`SELECT COUNT(*)::int AS n FROM "lessons" l ${where}`, ...params)
    const total = num(countRow && countRow[0] && countRow[0].n)
    const rows = await q(
      `SELECT l.id::text AS id, l."lessonTitle" AS title, l.topic, l.subject, l."gradeLevel" AS grade,
              l.status, l."generationModel" AS model, l."generationTimeMs" AS "genMs", l."createdAt",
              (SELECT COUNT(*) FROM "slides" s WHERE s."lessonId" = l.id)::int AS slides
         FROM "lessons" l ${where}
        ORDER BY l."createdAt" DESC LIMIT ${pageSize} OFFSET ${offset}`,
      ...params,
    )
    return ApiResponse.success(res, {
      rows: rows.map((r) => ({ ...r, slides: num(r.slides), genMs: num(r.genMs) })),
      total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch (err) { next(err) }
}

// PATCH /api/admin/ai-teacher/config  { value }  (aiteacher.edit) — non-runtime config only.
async function saveConfig(req, res, next) {
  try {
    if (req.body.value === undefined) throw new AppError('value is required', 422)
    const existing = await q(`SELECT value FROM "app_settings" WHERE key = 'aiteacher_config' LIMIT 1`)
    const before = existing && existing[0] ? existing[0].value : null
    await db.$executeRawUnsafe(
      `INSERT INTO "app_settings" (key, value, category, label, description, updated_by, updated_at)
       VALUES ('aiteacher_config', $1::jsonb, 'aiteacher', 'AI Teacher configuration', 'Non-runtime AI Teacher preferences', $2::uuid, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      JSON.stringify(req.body.value), req.admin.id,
    )
    await audit.record(req, { module: 'aiteacher', action: 'config.update', targetType: 'setting', targetId: 'aiteacher_config', before, after: req.body.value })
    return ApiResponse.success(res, { config: req.body.value }, 'AI Teacher configuration saved')
  } catch (err) { next(err) }
}

module.exports = { overview, lessons, saveConfig }
