'use strict'

// The "write" half of the pipeline: generate → validate → dedup → classify →
// quality-gate → save. Records an audit row in generation_history. DB-injected.

const { generateCandidates } = require('./generator')
const { validateQuestion } = require('./validator')
const { computeQuality } = require('./quality')
const { isDuplicate, signature } = require('./dedup')
const { SIGNATURES: SEED_SIGS, seedExamples } = require('./seedBank')
const { QUALITY_MIN, VALIDATION_MIN, PROMPT_VERSION } = require('./constants')
const { parseGrade } = require('./grade')

// Best-effort vector embedding (never blocks acceptance; no-op without a key).
async function storeEmbedding(db, questionId, text) {
  try {
    const { config } = require('../../config/env')
    if (!config.embeddings.voyageApiKey) return
    const { getEmbeddingProvider } = require('../../providers/embeddings')
    const [vec] = await getEmbeddingProvider().embedDocuments([text])
    if (!vec || !vec.length) return
    const literal = `[${vec.join(',')}]`
    await db.$executeRawUnsafe(
      'INSERT INTO question_embeddings ("questionId", embedding, model) VALUES ($1::uuid, $2::vector, $3) ' +
      'ON CONFLICT ("questionId") DO UPDATE SET embedding = EXCLUDED.embedding',
      questionId, literal, config.embeddings.model,
    )
  } catch (err) {
    // dedup still works via signature + jaccard; embeddings are an enhancement.
    console.warn('[BrainGym] embedding store skipped:', err.message)
  }
}

// Pull existing signatures + a sample of texts for the bucket (for dedup).
async function existingForBucket(db, { grade, subject, category }) {
  const className = parseGrade(grade).className
  let rows = []
  try {
    rows = await db.generated_questions.findMany({
      where: { grade: className, subject, category },
      select: { signature: true, questionText: true },
      take: 400,
      orderBy: { createdAt: 'desc' },
    })
  } catch { rows = [] }
  const sigs = new Set(rows.map((r) => r.signature))
  for (const s of SEED_SIGS) sigs.add(s)
  const texts = rows.map((r) => ({ text: r.questionText }))
  return { sigs, texts }
}

// Generate up to `count` accepted questions for the bucket and persist them.
async function generateAndStore(db, req) {
  const {
    userId = null, grade, category, subject = 'Mental Math', difficulty,
    count = 5, trigger = 'on_demand', allowPrereq = false, avoidTexts = [], salt,
  } = req
  const className = parseGrade(grade).className
  const start = Date.now()

  const stats = { requested: count, generated: 0, accepted: 0, rejectedValidation: 0, rejectedDuplicate: 0, rejectedGuardrail: 0 }
  const accepted = []

  const { sigs, texts } = await existingForBucket(db, { grade, subject, category })
  const examples = seedExamples(category, 6)

  // Over-generate a bit so the gates still net `count` good ones.
  const want = Math.min(count * 3 + 2, 40)
  let engine = 'fallback'
  let model = 'deterministic-fallback'
  try {
    const res = await generateCandidates({
      category, grade: className, subject, difficulty, count: want,
      seedExamples: examples, avoidTexts, allowPrereq, salt,
    })
    engine = res.engine; model = res.model
    stats.generated = res.candidates.length

    for (const cand of res.candidates) {
      if (accepted.length >= count) break

      // 1. Validate (structure + numeric + class guardrail).
      const v = validateQuestion(cand, { grade: className, category, difficulty, subject, allowPrereq })
      if (!v.valid || v.score < VALIDATION_MIN) {
        if (v.errors.some((e) => e.startsWith('advanced_syllabus') || e === 'concept_out_of_grade' || e === 'grade_mismatch')) {
          stats.rejectedGuardrail += 1
        } else {
          stats.rejectedValidation += 1
        }
        continue
      }
      const q = v.normalized

      // 2. Duplicate detection (vs DB bucket + seed + this batch).
      const dup = isDuplicate(q.questionText, texts)
      if (dup.duplicate || sigs.has(signature(q.questionText))) {
        stats.rejectedDuplicate += 1
        continue
      }

      // 3. Quality gate.
      const { score: qScore } = computeQuality({
        normalized: q, validationScore: v.score, uniqueness: 1 - dup.score, targetDifficulty: difficulty,
      })
      if (qScore < QUALITY_MIN) { stats.rejectedValidation += 1; continue }

      // 4. Persist.
      const sig = signature(q.questionText)
      let saved
      try {
        saved = await db.generated_questions.create({
          data: {
            category: q.category, grade: className, subject,
            chapter: q.chapter, topic: q.topic, concept: q.concept,
            difficulty: q.difficulty, level: q.level,
            questionText: q.questionText, answer: q.answer, answerValue: q.answerValue,
            options: q.options, correctOption: q.correctOption,
            explanation: q.explanation, hints: q.hints, bloomLevel: q.bloomLevel,
            estimatedTimeSec: q.estimatedTimeSec,
            qualityScore: qScore, validationScore: v.score,
            status: 'ACTIVE', isPrerequisite: q.isPrerequisite,
            generationPromptVersion: PROMPT_VERSION, llmModel: model, signature: sig,
          },
        })
      } catch (err) {
        // Concurrent generation for the same bucket can race to insert the same
        // question. The DB unique index (grade, subject, signature) makes the
        // loser fail with P2002 — treat that as a duplicate, not an error.
        if (err.code === 'P2002') { stats.rejectedDuplicate += 1; continue }
        console.error('[BrainGym] save failed:', err.message)
        continue
      }

      sigs.add(sig)
      texts.push({ text: q.questionText })
      accepted.push(saved)
      stats.accepted += 1
      storeEmbedding(db, saved.id, q.questionText) // fire-and-forget
    }
  } catch (err) {
    console.error('[BrainGym] generation error:', err.message)
  }

  // Audit trail.
  try {
    await db.generation_history.create({
      data: {
        userId, category, grade: className, subject, difficulty,
        requested: stats.requested, generated: stats.generated, accepted: stats.accepted,
        rejectedValidation: stats.rejectedValidation, rejectedDuplicate: stats.rejectedDuplicate,
        rejectedGuardrail: stats.rejectedGuardrail,
        promptVersion: PROMPT_VERSION, llmModel: model, durationMs: Date.now() - start,
        trigger, status: stats.accepted >= count ? 'SUCCESS' : (stats.accepted > 0 ? 'PARTIAL' : 'FAILED'),
      },
    })
  } catch (err) {
    console.warn('[BrainGym] generation_history write skipped:', err.message)
  }

  return { accepted, stats, engine, model }
}

module.exports = { generateAndStore, existingForBucket }
