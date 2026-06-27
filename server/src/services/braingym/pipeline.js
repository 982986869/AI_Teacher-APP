'use strict'

// ─── Pipeline orchestrator ──────────────────────────────────────────────────
// Student → category (+ adaptive difficulty) → retrieval ladder → (generate) →
// return questions. Plus attempt recording (feeds mastery + question performance)
// and a background top-up that grows the bank when a bucket runs thin.
// All DB access is injected as `db` for testability.

const { getTargetDifficulty } = require('./mastery')
const { difficultyToLevel, stepBand } = require('./difficulty')
const { recentlyAttempted, unseenGenerated, nearbyGenerated, conceptMatchedGenerated, weakConceptsFor, bucketCount } = require('./retrieval')
const { generateAndStore } = require('./generationService')
const { pickSeed } = require('./seedBank')
const { signature } = require('./dedup')
const { planSelection } = require('./selectionPolicy')
const { MIN_POOL, RECENT_WINDOW_DAYS } = require('./constants')

const BACKFILL_MIN = 12   // grow the bucket in the background when it dips below this
const BACKFILL_BATCH = 8

// In-process guard so concurrent requests for the same bucket don't all fire a
// background generation at once (thundering herd). Keyed per bucket.
const inflightBackfill = new Set()

function mapGenerated(r) {
  return {
    id: r.id, source: 'generated', category: r.category, difficulty: r.difficulty, grade: r.grade,
    q: r.questionText, questionText: r.questionText, answer: r.answer, answerValue: r.answerValue,
    options: r.options, correctOption: r.correctOption, explanation: r.explanation, hints: r.hints,
    llmModel: r.llmModel, // internal only — used for source logging, NOT exposed to the UI
  }
}

// Classify a served question's true origin for server-side observability.
//   seed | ai_generated | fallback_generated
function questionOrigin(q) {
  if (q.source !== 'generated') return 'seed'
  return q.llmModel && q.llmModel !== 'deterministic-fallback' ? 'ai_generated' : 'fallback_generated'
}

// Fire-and-forget overnight/low-load growth of a bucket. De-duplicated per bucket
// so a burst of concurrent students triggers at most one generation run.
async function maybeBackfill(db, { grade, subject = 'Mental Math', category, difficulty }) {
  const key = `${grade}|${subject}|${category}|${difficulty}`
  if (inflightBackfill.has(key)) return
  inflightBackfill.add(key)
  try {
    const have = await bucketCount(db, { grade, subject, category, difficulty })
    if (have >= BACKFILL_MIN) { inflightBackfill.delete(key); return }
    // Vary the salt so background runs don't reproduce on-demand output.
    generateAndStore(db, {
      userId: null, grade, subject, category, difficulty,
      count: BACKFILL_BATCH, trigger: 'background', salt: Date.now() % 100000,
    })
      .catch((e) => console.warn('[BrainGym] backfill failed:', e.message))
      .finally(() => inflightBackfill.delete(key))
  } catch (e) {
    inflightBackfill.delete(key)
    console.warn('[BrainGym] backfill check skipped:', e.message)
  }
}

// MAIN: get `count` MIXED adaptive questions for a wheel category. Blends
// random_general + weak_area + (optional) teacher_recommended per the selection
// policy. Difficulty is the student's mastery band; weak_area practises the growth
// edge one band above (still within the class). `teacherConcept` is an OPTIONAL
// soft boost — when absent, the round is pure random+weak. Never throws — always
// tops up to a full, playable round from the seed bank / generator.
async function getQuestions(db, { userId, grade, category, subject = 'Mental Math', count = MIN_POOL, teacherConcept = null }) {
  const difficulty = await getTargetDifficulty(db, { userId, category, subject, grade })
  const level = difficultyToLevel(difficulty)
  const weakDifficulty = stepBand(difficulty, +1) // growth edge — capped within class
  const recent = await recentlyAttempted(db, userId, RECENT_WINDOW_DAYS)

  const out = []
  const usedSigs = new Set()
  const excludeIds = new Set(recent.questionIds)
  const add = (item, mode) => {
    const sig = signature(item.q || item.questionText)
    if (usedSigs.has(sig)) return false
    usedSigs.add(sig)
    item.mode = mode
    out.push(item)
    if (item.id) excludeIds.add(item.id)
    return true
  }
  const modeCount = (m) => out.reduce((n, x) => n + (x.mode === m ? 1 : 0), 0)

  const hasTeacher = !!teacherConcept
  const plan = planSelection({ count, hasTeacherContext: hasTeacher })

  // Data-driven weak area: concepts the student has been getting wrong recently.
  // When we have that signal we target those concepts at the comfort difficulty;
  // otherwise we practise the growth edge (one band up) as a generic weak-area proxy.
  const weakConcepts = await weakConceptsFor(db, userId, { category })
  const weakModeDiff = weakConcepts.size ? difficulty : weakDifficulty

  // Fill up to `n` questions for one mode: prefer concept-matched (soft boost),
  // then unseen generated, then the offline seed bank — all at `diff`.
  const fill = async (mode, n, diff, { preferConcepts = [] } = {}) => {
    if (n <= 0) return
    const lvl = difficultyToLevel(diff)
    for (const concept of preferConcepts) {
      if (modeCount(mode) >= n) break
      for (const r of await conceptMatchedGenerated(db, { grade, subject, category, concept, difficulty: diff, limit: n * 3, excludeIds })) {
        if (modeCount(mode) >= n) break
        add(mapGenerated(r), mode)
      }
    }
    if (modeCount(mode) < n) {
      for (const r of await unseenGenerated(db, { grade, subject, category, difficulty: diff, limit: n * 3, excludeIds })) {
        if (modeCount(mode) >= n) break
        add(mapGenerated(r), mode)
      }
    }
    if (modeCount(mode) < n) {
      for (const s of pickSeed({ category, level: lvl, count: (n - modeCount(mode)) * 3, excludeSeedIds: recent.seedIds })) {
        if (modeCount(mode) >= n) break
        add(s, mode)
      }
    }
  }

  // Compose the round: teacher boost → weak-area → broad random.
  await fill('teacher_recommended', plan.teacher_recommended, difficulty, { preferConcepts: teacherConcept ? [teacherConcept] : [] })
  await fill('weak_area', plan.weak_area, weakModeDiff, { preferConcepts: [...weakConcepts] })
  await fill('random_general', plan.random_general, difficulty)

  // ── Top-up so the student ALWAYS gets a full round (tagged random_general) ──
  if (out.length < count) {
    for (const r of await nearbyGenerated(db, { grade, subject, category, difficulty, limit: count - out.length, excludeIds })) {
      if (out.length >= count) break
      add(mapGenerated(r), 'random_general')
    }
  }
  if (out.length < count) {
    const { accepted } = await generateAndStore(db, {
      userId, grade, subject, category, difficulty,
      count: count - out.length, trigger: 'on_demand', avoidTexts: out.map((x) => x.q),
    })
    for (const r of accepted) { if (out.length >= count) break; add(mapGenerated(r), 'random_general') }
  }
  if (out.length < count) {
    for (const s of pickSeed({ category, level, count: count - out.length })) {
      if (out.length >= count) break
      add(s, 'random_general')
    }
  }

  // Grow the bank in the background for next time (non-blocking).
  maybeBackfill(db, { userId, grade, subject, category, difficulty })

  const served = out.slice(0, count)
  const origins = served.reduce((a, q) => ((a[questionOrigin(q)] = (a[questionOrigin(q)] || 0) + 1), a), {})
  const modes = served.reduce((a, q) => ((a[q.mode] = (a[q.mode] || 0) + 1), a), {})
  // Server-side observability only — never sent to the student UI.
  console.log('[BrainGym] served', { userId, grade, category, difficulty, teacher: hasTeacher, modes, origins })

  return { questions: served, difficulty, level, plan, modes }
}

// ─── Attempt recording — feeds mastery + per-question performance ────────────
async function recordAttempts(db, { userId, sessionId = null, grade, items = [] }) {
  if (!Array.isArray(items) || !items.length) return { saved: 0 }

  const rows = items.map((it) => ({
    userId,
    questionId: it.source === 'generated' ? (it.id || it.questionId || null) : null,
    seedId: it.source === 'seed' ? (it.seedId || null) : null,
    source: it.source === 'generated' ? 'generated' : 'seed',
    category: it.category,
    grade: grade ? require('./grade').parseGrade(grade).className : null,
    subject: it.subject || 'Mental Math',
    difficulty: it.difficulty || null,
    isCorrect: !!it.isCorrect,
    answerGiven: it.answerGiven != null ? String(it.answerGiven) : null,
    timeMs: Number(it.timeMs) || 0,
    sessionId,
  }))

  try { await db.question_attempts.createMany({ data: rows }) }
  catch (e) { console.warn('[BrainGym] attempts insert skipped:', e.message) }

  // Update per-question performance counters + flag ambiguous questions.
  for (const it of items) {
    if (it.source !== 'generated' || !(it.id || it.questionId)) continue
    const id = it.id || it.questionId
    try {
      const updated = await db.generated_questions.update({
        where: { id },
        data: {
          timesServed: { increment: 1 },
          timesCorrect: { increment: it.isCorrect ? 1 : 0 },
          timesWrong: { increment: it.isCorrect ? 0 : 1 },
          updatedAt: new Date(),
        },
      })
      // Improvement signal: lots of exposure but very low accuracy → likely
      // ambiguous; flag for regeneration/archival by the maintenance job.
      if (updated.timesServed >= 8 && updated.timesCorrect / updated.timesServed < 0.25 && !updated.ambiguityFlag) {
        await db.generated_questions.update({ where: { id }, data: { ambiguityFlag: true } })
      }
    } catch (e) { /* non-fatal */ }
  }
  return { saved: rows.length }
}

// ─── Question improvement — archive an ambiguous question, regenerate a replacement
async function improveFlagged(db, { limit = 10 } = {}) {
  let flagged = []
  try {
    flagged = await db.generated_questions.findMany({
      where: { ambiguityFlag: true, status: 'ACTIVE' }, take: limit,
    })
  } catch { return { improved: 0 } }

  let improved = 0
  for (const q of flagged) {
    try {
      await db.generated_questions.update({
        where: { id: q.id },
        data: { status: 'ARCHIVED', archivedReason: 'ambiguous_low_accuracy' },
      })
      await generateAndStore(db, {
        userId: null, grade: q.grade, subject: q.subject, category: q.category,
        difficulty: q.difficulty, count: 1, trigger: 'background', salt: Date.now() % 100000,
      })
      improved += 1
    } catch (e) { /* skip */ }
  }
  return { improved }
}

module.exports = { getQuestions, recordAttempts, maybeBackfill, improveFlagged, questionOrigin }
