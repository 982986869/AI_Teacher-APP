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
  return db.knowledgeSource.findUnique({ where: { id }, select: SOURCE_SELECT })
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

  const source = await db.knowledgeSource.create({
    data: {
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
    },
    select: { id: true },
  })

  try {
    const embeddings = await getEmbeddingProvider().embedDocuments(chunks)
    if (embeddings.length !== chunks.length) {
      throw new AppError('Embedding count did not match chunk count.', 502)
    }

    await db.$transaction(async (tx) => {
      for (let i = 0; i < chunks.length; i++) {
        const id = crypto.randomUUID()
        const vec = toVectorLiteral(embeddings[i])
        // Raw insert because Prisma cannot write the Unsupported(vector) column.
        await tx.$executeRaw`
          INSERT INTO knowledge_chunks (id, "sourceId", "chunkIndex", content, "charCount", embedding)
          VALUES (${id}::uuid, ${source.id}::uuid, ${i}, ${chunks[i]}, ${chunks[i].length}, ${vec}::vector)
        `
      }
      await tx.knowledgeSource.update({ where: { id: source.id }, data: { status: 'READY' } })
    })

    return getSourceById(source.id)
  } catch (err) {
    await db.knowledgeSource
      .update({ where: { id: source.id }, data: { status: 'FAILED' } })
      .catch(() => {})
    throw err
  }
}

async function listSources({ subject, gradeLevel } = {}) {
  return db.knowledgeSource.findMany({
    where: {
      ...(subject ? { subject } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: SOURCE_SELECT,
  })
}

// ─── Retrieval ──────────────────────────────────────────────────────────────
// embed query -> cosine similarity search over chunks (raw SQL).
async function searchChunks({ query, topK, subject, gradeLevel, sourceIds }) {
  const k = Math.min(20, Math.max(1, Number(topK) || config.rag.topK))
  const queryEmbedding = await getEmbeddingProvider().embedQuery(query)
  const vec = toVectorLiteral(queryEmbedding)

  const filters = [
    Prisma.sql`c.embedding IS NOT NULL`,
    Prisma.sql`s.status::text = 'READY'`,
  ]
  if (subject) filters.push(Prisma.sql`s.subject = ${subject}`)
  if (gradeLevel) filters.push(Prisma.sql`s."gradeLevel" = ${gradeLevel}`)
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

// ─── Grounded answer ────────────────────────────────────────────────────────
async function answerFromKnowledge({ question, subject, gradeLevel, sourceIds, topK }) {
  const chunks = await searchChunks({ query: question, topK, subject, gradeLevel, sourceIds })
  const relevant = chunks.filter((c) => c.similarity >= config.rag.minSimilarity)

  if (relevant.length === 0) {
    return {
      grounded: false,
      chunksUsed: 0,
      sources: [],
      answer:
        "I couldn't find this in the uploaded learning material. Try rephrasing your question, " +
        'or ask your teacher to add content on this topic.',
    }
  }

  const answer = await getAIProvider().answerFromKnowledge(question, relevant, [])
  const sources = [
    ...new Map(
      relevant.map((c) => [c.sourceId, { sourceId: c.sourceId, title: c.sourceTitle }])
    ).values(),
  ]

  return { grounded: true, chunksUsed: relevant.length, sources, answer }
}

module.exports = {
  ingestSource,
  getSourceById,
  listSources,
  searchChunks,
  answerFromKnowledge,
}
