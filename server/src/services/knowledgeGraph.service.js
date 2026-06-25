'use strict'

const db = require('../config/database')

const vecLit = (e) => (Array.isArray(e) ? `[${e.join(',')}]` : e)

// Nearest catalog concept to a query embedding, within a subject.
async function nearestConcept(queryVec, subject) {
  const [top] = await nearestConcepts(queryVec, subject, 1)
  return top || null
}

// Top-K nearest catalog concepts to a query embedding (highest cosine first).
// Used by the resolver to combine concept-similarity with chunk agreement.
async function nearestConcepts(queryVec, subject, limit = 5) {
  const k = Math.min(20, Math.max(1, Number(limit) || 5))
  const rows = await db.$queryRawUnsafe(
    `SELECT id, name, chapter, 1 - (embedding <=> $1::vector) sim
     FROM concepts WHERE subject = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector LIMIT ${k}`,
    vecLit(queryVec), subject
  )
  return rows.map((r) => ({ id: r.id, name: r.name, chapter: r.chapter, similarity: Number(r.sim) }))
}

// Direct prerequisites of a concept (with their embeddings, for supplementary search).
async function getPrereqs(conceptId) {
  const rows = await db.$queryRaw`
    SELECT pr.id, pr.name, pr.chapter, pr.embedding::text emb
    FROM concept_prereqs e JOIN concepts pr ON pr.id = e.prereq_id
    WHERE e.concept_id = ${conceptId}::uuid`
  return rows.map((r) => ({ id: r.id, name: r.name, chapter: r.chapter, emb: r.emb }))
}

async function getConceptId(subject, chapter, name) {
  if (!subject || !chapter || !name) return null
  const rows = await db.$queryRaw`
    SELECT id FROM concepts WHERE subject = ${subject} AND chapter = ${chapter} AND name = ${name} LIMIT 1`
  return rows.length ? rows[0].id : null
}

module.exports = { nearestConcept, nearestConcepts, getPrereqs, getConceptId, vecLit }
