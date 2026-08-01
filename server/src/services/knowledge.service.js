'use strict'

const crypto = require('crypto')
const { Prisma } = require('@prisma/client')
const db = require('../config/database')
const { config } = require('../config/env')
const { AppError } = require('../middleware/errorHandler')
const { getEmbeddingProvider } = require('../providers/embeddings')
const { getAIProvider } = require('../providers')
const { chunkText } = require('../utils/chunkText')

// pgvector accepts the literal form "[1,2,3]" cast to ::vector.
function toVectorLiteral(embedding) {
  return `[${embedding.join(',')}]`
}

const SOURCE_SELECT = {
  id: true,
  title: true,
  description: true,
  type: true,
  subject: true,
  gradeLevel: true,
  originalFilename: true,
  mimeType: true,
  charCount: true,
  chunkCount: true,
  status: true,
  uploadedById: true,
  createdAt: true,
  updatedAt: true,
}

async function getSourceById(id) {
  return db.knowledge_sources.findUnique({ where: { id }, select: SOURCE_SELECT })
}

// ─── Ingestion ──────────────────────────────────────────────────────────────
// extract text -> chunk -> embed -> store chunks + vectors. Source goes
// PROCESSING -> READY (or FAILED). Embedding (network) runs OUTSIDE the tx.
async function ingestSource({
  userId, title, description, subject, gradeLevel, type, originalFilename, mimeType, text,
}) {
  const chunks = chunkText(text, {
    chunkSize: config.rag.chunkSize,
    overlap: config.rag.chunkOverlap,
  })
  if (chunks.length === 0) throw new AppError('No text content found to ingest.', 422)

  const source = await db.knowledge_sources.create({
    data: {
      id: crypto.randomUUID(),
      title,
      description: description || null,
      type,
      subject: subject || null,
      gradeLevel: gradeLevel || null,
      originalFilename: originalFilename || null,
      mimeType: mimeType || null,
      charCount: text.length,
      chunkCount: chunks.length,
      status: 'PROCESSING',
      uploadedById: userId,
      // schema has no @default/@updatedAt on these, so they must be set explicitly.
      updatedAt: new Date(),
    },
    select: { id: true },
  })

  try {
    const embeddings = await getEmbeddingProvider().embedDocuments(chunks)
    if (embeddings.length !== chunks.length) {
      throw new AppError('Embedding count did not match chunk count.', 502)
    }

    // Insert chunks in BATCHED multi-row statements (raw, because Prisma cannot
    // write the Unsupported(vector) column). We deliberately avoid a long
    // interactive $transaction here: on Supabase's pgbouncer pooler a many-row
    // interactive tx blows past the default 5s timeout and fails with
    // "Transaction not found". Each batch is a single round-trip instead.
    // The outer try/catch marks the source FAILED if any batch throws, and
    // status is only flipped to READY after every batch succeeds — so a partial
    // insert is never searchable (searchChunks filters status = 'READY').
    const BATCH_ROWS = 200
    for (let start = 0; start < chunks.length; start += BATCH_ROWS) {
      const slice = chunks.slice(start, start + BATCH_ROWS)
      const rows = slice.map((content, j) => {
        const i = start + j
        return Prisma.sql`(${crypto.randomUUID()}::uuid, ${source.id}::uuid, ${i}, ${content}, ${content.length}, ${toVectorLiteral(embeddings[i])}::vector)`
      })
      await db.$executeRaw(Prisma.sql`
        INSERT INTO knowledge_chunks (id, "sourceId", "chunkIndex", content, "charCount", embedding)
        VALUES ${Prisma.join(rows)}
      `)
    }

    await db.knowledge_sources.update({ where: { id: source.id }, data: { status: 'READY' } })

    return getSourceById(source.id)
  } catch (err) {
    await db.knowledge_sources
      .update({ where: { id: source.id }, data: { status: 'FAILED' } })
      .catch(() => {})
    throw err
  }
}

async function listSources({ subject, gradeLevel, ownerId } = {}) {
  return db.knowledge_sources.findMany({
    where: {
      ...(subject ? { subject } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
      // ownerId scopes the list to one uploader (students see only their own).
      ...(ownerId ? { uploadedById: ownerId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: SOURCE_SELECT,
  })
}

// Delete a source and all its chunks (chunks cascade via the FK relation).
// `actor` (optional) enforces ownership: a non-teacher/admin may only delete
// material they uploaded themselves.
async function deleteSource(id, actor = null) {
  const existing = await db.knowledge_sources.findUnique({
    where: { id },
    select: { id: true, uploadedById: true },
  })
  if (!existing) throw new AppError('Knowledge source not found.', 404)

  if (actor) {
    const isPrivileged = actor.role === 'TEACHER' || actor.role === 'ADMIN'
    if (!isPrivileged && existing.uploadedById !== actor.userId) {
      throw new AppError('You can only delete material you uploaded.', 403)
    }
  }

  await db.knowledge_sources.delete({ where: { id } })
  return { id }
}

// ─── Retrieval ──────────────────────────────────────────────────────────────
// embed query -> cosine similarity search over chunks (raw SQL).
async function searchChunks({ query, topK, subject, gradeLevel, sourceIds, ownerId }) {
  const k = Math.min(20, Math.max(1, Number(topK) || config.rag.topK))
  const queryEmbedding = await getEmbeddingProvider().embedQuery(query)
  const vec = toVectorLiteral(queryEmbedding)

  const filters = [
    Prisma.sql`c.embedding IS NOT NULL`,
    Prisma.sql`s.status::text = 'READY'`,
  ]
  if (subject) filters.push(Prisma.sql`s.subject = ${subject}`)
  if (gradeLevel) filters.push(Prisma.sql`s."gradeLevel" = ${gradeLevel}`)
  // ownerId scopes retrieval to one uploader (students search only their own material).
  if (ownerId) filters.push(Prisma.sql`s."uploadedById" = ${ownerId}::uuid`)
  if (Array.isArray(sourceIds) && sourceIds.length) {
    filters.push(Prisma.sql`c."sourceId" = ANY(${sourceIds}::uuid[])`)
  }
  const where = Prisma.join(filters, ' AND ')

  const rows = await db.$queryRaw(Prisma.sql`
    SELECT c.id, c."sourceId", c."chunkIndex", c.content,
           s.title AS "sourceTitle", s.subject, s."gradeLevel",
           1 - (c.embedding <=> ${vec}::vector) AS similarity
    FROM knowledge_chunks c
    JOIN knowledge_sources s ON s.id = c."sourceId"
    WHERE ${where}
    ORDER BY c.embedding <=> ${vec}::vector
    LIMIT ${k}
  `)

  return rows.map((r) => ({
    id: r.id,
    sourceId: r.sourceId,
    sourceTitle: r.sourceTitle,
    subject: r.subject,
    gradeLevel: r.gradeLevel,
    chunkIndex: Number(r.chunkIndex),
    content: r.content,
    similarity: Number(r.similarity),
  }))
}

// The exact refusal returned when nothing in the material is relevant. Kept as
// a single constant so the API contract stays consistent (Phase 6).
const NOT_COVERED_MESSAGE =
  'This topic is not covered in the uploaded learning material.'

// ─── Grounded answer ────────────────────────────────────────────────────────
// Shared retrieval: builds a conversation-aware query, runs vector search (with
// a no-filter fallback), and returns the relevant chunks + confidence + sources.
async function retrieveForAnswer({ question, subject, gradeLevel, sourceIds, topK, ownerId, history }) {
  // Retrieval query. A SHORT reply to a clarifying question ("the second one") is a
  // poor search term on its own, so for those we blend in earlier user turns. But a
  // full new question must retrieve on its OWN text — blending an earlier, unrelated
  // question pollutes retrieval and makes the model answer from the wrong chunks
  // (a cross-topic hallucination when two questions share one thread).
  const priorUserTurns = (Array.isArray(history) ? history : [])
    .filter((m) => String(m?.role).toUpperCase() === 'USER' && typeof m?.content === 'string')
    .map((m) => m.content)
  const isShortReply = question.trim().split(/\s+/).filter(Boolean).length <= 5
  const retrievalQuery = (isShortReply && priorUserTurns.length)
    ? [...priorUserTurns, question].join('\n').slice(-2000)
    : question

  let chunks = await searchChunks({ query: retrievalQuery, topK, subject, gradeLevel, sourceIds, ownerId })
  let relevant = chunks.filter((c) => c.similarity >= config.rag.minSimilarity)

  // Robustness: uploaded files often carry no subject/grade tag. If a subject or
  // grade FILTER wiped out all matches, retry once WITHOUT those filters (still
  // scoped to the user's own material) so a stale/mismatched filter never causes
  // a false "not covered in the material".
  if (relevant.length === 0 && (subject || gradeLevel)) {
    chunks = await searchChunks({ query: retrievalQuery, topK, sourceIds, ownerId })
    relevant = chunks.filter((c) => c.similarity >= config.rag.minSimilarity)
  }

  if (relevant.length === 0) return { relevant: [], confidence: 0, sources: [] }

  // Confidence = similarity of the best-matching chunk (0..1), rounded — the
  // grounding strength surfaced to the student as a % in the UI.
  const confidence = Math.round(Math.max(...relevant.map((c) => c.similarity)) * 100) / 100

  // Dedupe sources by sourceId, keeping each source's strongest chunk similarity.
  const byId = new Map()
  for (const c of relevant) {
    const prev = byId.get(c.sourceId)
    if (!prev || c.similarity > prev.similarity) {
      byId.set(c.sourceId, { sourceId: c.sourceId, title: c.sourceTitle, similarity: c.similarity })
    }
  }
  const sources = [...byId.values()].sort((a, b) => b.similarity - a.similarity)

  return { relevant, confidence, sources }
}

async function answerFromKnowledge(params) {
  const { relevant, confidence, sources } = await retrieveForAnswer(params)

  if (relevant.length === 0) {
    return { grounded: false, chunksUsed: 0, confidence: 0, sources: [], answer: NOT_COVERED_MESSAGE }
  }

  const provider = getAIProvider()
  const history = Array.isArray(params.history) ? params.history : []
  const answer = await provider.answerFromKnowledge(params.question, relevant, history)

  return { grounded: true, chunksUsed: relevant.length, confidence, sources, answer }
}

// Streaming variant: emits onMeta({ grounded, confidence, sources }) once retrieval
// is done, then streams the answer text via onDelta(t). Resolves with the same
// final object shape as answerFromKnowledge.
async function answerFromKnowledgeStream(params, { onMeta, onDelta } = {}) {
  const { relevant, confidence, sources } = await retrieveForAnswer(params)

  if (relevant.length === 0) {
    if (onMeta) onMeta({ grounded: false, confidence: 0, sources: [] })
    if (onDelta) onDelta(NOT_COVERED_MESSAGE)
    return { grounded: false, chunksUsed: 0, confidence: 0, sources: [], answer: NOT_COVERED_MESSAGE }
  }

  if (onMeta) onMeta({ grounded: true, confidence, sources })

  const provider = getAIProvider()
  const history = Array.isArray(params.history) ? params.history : []
  const answer = await provider.streamAnswerFromKnowledge(
    params.question, relevant, history,
    (t) => { if (onDelta) onDelta(t) },
  )

  return { grounded: true, chunksUsed: relevant.length, confidence, sources, answer }
}

// ─── Structured (whiteboard) answer ───────────────────────────────────────────
// Same strict grounding as answerFromKnowledge, but returns a `teaching` object
// (intro, steps, formula, diagram, gaps) the app renders with a drawn diagram
// and rendered math. Falls back to wrapping the plain-text answer if structured
// generation fails, so the student always gets something.
async function answerStructured(params) {
  const { relevant, confidence, sources } = await retrieveForAnswer(params)

  if (relevant.length === 0) {
    return { grounded: false, confidence: 0, sources: [], teaching: null, answer: NOT_COVERED_MESSAGE }
  }

  const provider = getAIProvider()
  const history = Array.isArray(params.history) ? params.history : []

  let teaching
  try {
    teaching = await provider.answerFromKnowledgeStructured(params.question, relevant, history)
  } catch (err) {
    // Structured path failed (bad JSON, etc.) — degrade gracefully to plain text.
    const answer = await provider.answerFromKnowledge(params.question, relevant, history)
    teaching = { title: 'Explanation', intro: answer, steps: [], formula: '', example: '', quickCheck: '', diagram: null, gaps: [] }
  }

  return { grounded: true, confidence, sources, teaching }
}

// ─── Extended answer (general knowledge, on demand) ───────────────────────────
// For gap-filling ONLY: the student explicitly asked for something the material
// lacks (worked example / full solution / who-gave-this). General knowledge is
// allowed here. Context is still retrieved to stay on-topic, but retrieval
// returning nothing is NOT fatal — that's the whole point. The client labels the
// result clearly as "beyond your material".
async function answerExtended(params) {
  let relevant = []
  let sources = []
  try {
    const r = await retrieveForAnswer(params)
    relevant = r.relevant
    sources = r.sources
  } catch (_) { /* no context available — answer from general knowledge alone */ }

  const provider = getAIProvider()
  const history = Array.isArray(params.history) ? params.history : []
  const teaching = await provider.answerExtended(params.question, relevant, history, params.gapKind)

  return { beyondMaterial: true, sources, teaching }
}

// ─── Solve from photo ─────────────────────────────────────────────────────────
// Reads a homework question from a photo and solves it step by step. NOT grounded
// (solving a problem needs general method), so no retrieval — just Claude vision.
async function solvePhoto({ buffer, mimeType, filename, hint }) {
  const provider = getAIProvider()
  if (typeof provider.solveFromImage !== 'function') {
    throw new AppError('Photo solving is not available with the current AI provider.', 501)
  }
  const teaching = await provider.solveFromImage({ buffer, mimeType, filename, hint })
  return { fromPhoto: true, teaching }
}

module.exports = {
  ingestSource,
  getSourceById,
  listSources,
  deleteSource,
  searchChunks,
  answerFromKnowledge,
  answerFromKnowledgeStream,
  answerStructured,
  answerExtended,
  solvePhoto,
}
