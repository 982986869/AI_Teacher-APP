'use strict'

const { Prisma } = require('@prisma/client')
const db = require('../config/database')
const { config } = require('../config/env')
const { getEmbeddingProvider } = require('../providers/embeddings')
const kg = require('./knowledgeGraph.service')

const round = (x) => Math.round(Number(x) * 1000) / 1000
function toVectorLiteral(embedding) { return `[${embedding.join(',')}]` }

// Curriculum is embedded under canonical subject names ("Mathematics"); the UI may
// send aliases ("Maths"). Unknown subjects (English/History) pass through → no hit.
const SUBJECT_ALIASES = {
  maths: 'Mathematics', math: 'Mathematics', mathematics: 'Mathematics',
  physics: 'Physics', phy: 'Physics', chemistry: 'Chemistry', chem: 'Chemistry',
  biology: 'Biology', bio: 'Biology',
}
function canonicalSubject(subject) {
  if (!subject) return null
  return SUBJECT_ALIASES[String(subject).trim().toLowerCase()] || subject
}

// Core chunk search. Orders by `orderVec` (which chunks to pull) but SCORES by
// `queryVec` (relevance to the actual question) — so prereq pulls stay comparable.
async function rawSearch({ queryVec, orderVec, subject, gradeLevel, limit }) {
  const filters = [Prisma.sql`c.embedding IS NOT NULL`, Prisma.sql`s.status::text = 'READY'`]
  if (subject) filters.push(Prisma.sql`s.subject = ${subject}`)
  if (gradeLevel) filters.push(Prisma.sql`s."gradeLevel" = ${gradeLevel}`)
  const where = Prisma.join(filters, ' AND ')
  const rows = await db.$queryRaw(Prisma.sql`
    SELECT c.id, c."sourceId", c.content, c.metadata, s.title AS "sourceTitle", s.subject,
           1 - (c.embedding <=> ${queryVec}::vector) AS similarity
    FROM knowledge_chunks c
    JOIN knowledge_sources s ON s.id = c."sourceId"
    WHERE ${where}
    ORDER BY c.embedding <=> ${orderVec}::vector
    LIMIT ${limit}`)
  return rows.map((r) => ({
    id: r.id, sourceId: r.sourceId, sourceTitle: r.sourceTitle, subject: r.subject,
    content: r.content, metadata: r.metadata || null, similarity: Number(r.similarity),
  }))
}

const PREREQ_BOOST = 0.05

// Concept-aware retrieval. Returns chunks + the resolved concept (when the catalog
// agrees with the retrieved chapter), its prerequisites, and a confidence tier.
async function retrieve({ query, subject, gradeLevel, topK, minSimilarity } = {}) {
  const q = String(query || '').trim()
  if (!q) return { chunks: [], grounded: false, topSimilarity: 0, confidenceTier: 'low', concept: null, prereqConcepts: [] }

  const k = Math.min(20, Math.max(1, Number(topK) || config.rag.topK))
  const floor = minSimilarity != null ? minSimilarity : config.rag.minSimilarity
  const subj = canonicalSubject(subject)

  const queryEmbedding = await getEmbeddingProvider().embedQuery(q)
  const qLit = toVectorLiteral(queryEmbedding)

  const candidates = await rawSearch({ queryVec: qLit, orderVec: qLit, subject: subj, gradeLevel, limit: Math.max(12, k + 7) })
  const anchorChapter = candidates[0] && candidates[0].metadata ? candidates[0].metadata.chapter : null

  // Resolve the query to a catalog concept, but TRUST it only when its chapter
  // agrees with what we actually retrieved (kills "escape velocity → Velocity").
  let concept = null
  let prereqConcepts = []
  const pool = candidates.map((c) => ({ ...c, isPrereq: false }))

  if (subj && anchorChapter) {
    const resolved = await kg.nearestConcept(queryEmbedding, subj).catch(() => null)
    if (resolved && resolved.chapter === anchorChapter) {
      concept = { id: resolved.id, name: resolved.name, chapter: resolved.chapter, similarity: round(resolved.similarity) }
      const prereqs = await kg.getPrereqs(resolved.id).catch(() => [])
      prereqConcepts = prereqs.map((p) => p.name)
      // Pull a couple of chunks for each prerequisite (e.g. Impulse → Momentum).
      for (const pr of prereqs.slice(0, 2)) {
        if (!pr.emb) continue
        const extra = await rawSearch({ queryVec: qLit, orderVec: pr.emb, subject: subj, gradeLevel, limit: 2 }).catch(() => [])
        extra.forEach((e) => pool.push({ ...e, isPrereq: true, prereqName: pr.name }))
      }
    }
  }

  // Fallback concept (for mastery) = the top chunk's tagged concept.
  if (!concept && candidates[0] && candidates[0].metadata) {
    const { concept: tc, chapter: tch } = candidates[0].metadata
    if (tc && tch) {
      const id = await kg.getConceptId(subj, tch, tc).catch(() => null)
      if (id) concept = { id, name: tc, chapter: tch, similarity: round(candidates[0].similarity) }
    }
  }

  // Re-rank: dedup; prerequisite chunks get a small boost so they surface.
  const seen = new Map()
  for (const c of pool) {
    const score = c.similarity + (c.isPrereq ? PREREQ_BOOST : 0)
    const prev = seen.get(c.id)
    if (!prev || score > prev.score) seen.set(c.id, { ...c, score })
  }
  const ranked = [...seen.values()].sort((a, b) => b.score - a.score)
  const relevant = ranked.filter((c) => c.similarity >= floor).slice(0, k)

  const topSimilarity = candidates.length ? round(candidates[0].similarity) : 0
  const confidenceTier = topSimilarity >= 0.6 ? 'high' : topSimilarity >= 0.45 ? 'medium' : 'low'

  return { chunks: relevant, grounded: relevant.length > 0, topSimilarity, confidenceTier, concept, prereqConcepts, anchorChapter }
}

module.exports = { retrieve, toVectorLiteral, canonicalSubject }
