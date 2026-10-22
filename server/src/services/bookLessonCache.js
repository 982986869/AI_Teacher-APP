'use strict'
// Generated textbook lessons shared across students. One row per distinct request
// shape; the student's own lessons/slides rows are COPIED from the payload so progress,
// doubts and resume keep working unchanged.
const crypto = require('crypto')
const realDb = require('../config/database')

function createBookLessonCache(db) {
  function cacheKey({ chapterId, kind, topicIds, gradeLevel, teachingMode, explanationStyle, promptVersion }) {
    const ids = [...(topicIds || [])].map(Number).sort((a, b) => a - b).join(',')
    const raw = [Number(chapterId), kind, ids, String(gradeLevel), String(teachingMode), String(explanationStyle || 'balanced'), Number(promptVersion)].join('|')
    return crypto.createHash('sha1').update(raw).digest('hex')
  }

  async function find(key) {
    const row = await db.textbook_lessons.findUnique({ where: { cache_key: key } })
    if (!row) return null
    return db.textbook_lessons.update({ where: { id: row.id }, data: { hits: { increment: 1 } } })
  }

  // Insert-if-absent, then read back: when two students generate the same lesson at
  // once, the second insert is a no-op and both share the first row.
  async function store({ key, parts, payload, generationModel, generationTimeMs }) {
    const ids = [...(parts.topicIds || [])].map(Number)
    await db.$executeRaw`
      INSERT INTO textbook_lessons (cache_key, chapter_id, kind, topic_ids, grade_level, teaching_mode, explanation_style, prompt_version, payload, generation_model, generation_time_ms)
      VALUES (${key}, ${Number(parts.chapterId)}, ${parts.kind}, ${ids}::bigint[], ${String(parts.gradeLevel)}, ${String(parts.teachingMode)}, ${String(parts.explanationStyle || 'balanced')}, ${Number(parts.promptVersion)}, ${JSON.stringify(payload)}::jsonb, ${generationModel || null}, ${generationTimeMs == null ? null : Math.round(generationTimeMs)})
      ON CONFLICT (cache_key) DO NOTHING`
    return db.textbook_lessons.findUnique({ where: { cache_key: key } })
  }

  return { cacheKey, find, store }
}

module.exports = { createBookLessonCache, bookLessonCache: createBookLessonCache(realDb) }
