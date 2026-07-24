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
// A concept resolves only when the query is genuinely close to its name embedding.
// Below this we return no concept rather than a wrong one (e.g. a topic with no
// catalog entry like an un-ingested chapter). Concept names are embedded in the
// QUERY space (symmetric), so true matches score ~0.85+ while cross-topic noise
// sits ~0.6-0.7 — this floor cleanly separates them. Tuned against the benchmark.
const CONCEPT_FLOOR = 0.72
// When a slightly-lower-ranked concept sits in the chapter our chunk search landed
// in, that agreement breaks the tie in its favour (within this similarity margin).
const CHAPTER_AGREE_MARGIN = 0.08
// The chunk-tag fallback (used only when the concept embedding match is weak) is
// trusted only when the top chunk itself is a confident hit — otherwise an
// un-catalogued query (no source material) would resolve to a random nearby tag.
const FALLBACK_CHUNK_FLOOR = 0.55

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

  // Resolve the query to a catalog concept. The concept-NAME embedding match is the
  // reliable signal (benchmarked ~95%+); the chunk search's chapter is only a SOFT
  // confirmation, never a hard veto (the old veto wrongly killed "adiabatic process"
  // when chunk retrieval happened to land in another chapter). We pick the best
  // concept by similarity, let chunk-chapter agreement break near-ties, and accept
  // only above a confidence floor so un-catalogued topics resolve to nothing.
  let concept = null
  let prereqConcepts = []
  const pool = candidates.map((c) => ({ ...c, isPrereq: false }))

  if (subj) {
    const top = await kg.nearestConcepts(queryEmbedding, subj, 5).catch(() => [])
    if (top.length) {
      let best = top[0]
      if (anchorChapter) {
        const agree = top.find((t) => t.chapter === anchorChapter && t.similarity >= best.similarity - CHAPTER_AGREE_MARGIN)
        if (agree) best = agree
      }
      if (best.similarity >= CONCEPT_FLOOR) {
        concept = { id: best.id, name: best.name, chapter: best.chapter, similarity: round(best.similarity) }
        const prereqs = await kg.getPrereqs(best.id).catch(() => [])
        prereqConcepts = prereqs.map((p) => p.name)
        // Pull a couple of chunks for each prerequisite (e.g. Impulse → Momentum).
        // Run the per-prereq vector searches CONCURRENTLY — they're independent, so
        // serial awaits needlessly stacked their round-trips on the doubt critical path.
        const prereqResults = await Promise.all(
          prereqs.slice(0, 2).filter((pr) => pr.emb).map((pr) =>
            rawSearch({ queryVec: qLit, orderVec: pr.emb, subject: subj, gradeLevel, limit: 2 })
              .then((extra) => extra.map((e) => ({ ...e, isPrereq: true, prereqName: pr.name })))
              .catch(() => [])
          )
        )
        prereqResults.forEach((chunks) => chunks.forEach((e) => pool.push(e)))
      }
    }
  }

  // Last-resort fallback (for mastery) = the top chunk's tagged concept — but only
  // when the embedding match was below the floor AND the chunk itself is a confident
  // hit, so an un-catalogued query doesn't latch onto a random nearby tag.
  if (!concept && candidates[0] && candidates[0].metadata && candidates[0].similarity >= FALLBACK_CHUNK_FLOOR) {
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
