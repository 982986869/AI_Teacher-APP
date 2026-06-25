'use strict'
// Builds the concept catalog for the AI Teacher's knowledge graph. For each chapter
// of each subject, an LLM extracts the key named concepts + their prerequisites;
// each concept name is embedded (for query→concept and chunk→concept matching).
//
// ADDITIVE & idempotent: it never deletes existing concepts (so student mastery,
// which references concept ids, is preserved). It only fills gaps via
// INSERT ... ON CONFLICT DO NOTHING, then links prerequisites by the concept's
// real id (existing or newly inserted).
//
// Usage:  node scripts/build-concept-catalog.js [Subject]
//         node scripts/build-concept-catalog.js            # all subjects with chunks
require('dotenv').config()
const crypto = require('crypto')
const Anthropic = require('@anthropic-ai/sdk')
const { PrismaClient } = require('@prisma/client')
const { getEmbeddingProvider } = require('../src/providers/embeddings')

const prisma = new PrismaClient()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.AI_DOUBT_MODEL || 'claude-haiku-4-5'
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function parseJson(text) {
  let c = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const s = c.indexOf('{'); const e = c.lastIndexOf('}')
  if (s >= 0 && e > s) c = c.slice(s, e + 1)
  return JSON.parse(c)
}

async function chapterSample(subject, chapter) {
  const rows = await prisma.$queryRaw`
    SELECT content FROM knowledge_chunks
    WHERE metadata->>'subject' = ${subject} AND metadata->>'chapter' = ${chapter}
    ORDER BY "chunkIndex" LIMIT 16`
  return rows.map((r) => r.content).join('\n---\n').slice(0, 7000)
}

async function extractConcepts(subject, chapter, sample) {
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 1100,
    system: `You map the key concepts of a "${chapter}" chapter in school ${subject} for a learning system. `
      + `List the 12 to 20 most important NAMED concepts a student must master in this chapter — be thorough and `
      + `COMPLETE: include every specific named law, quantity, process, theorem, reaction or principle that appears `
      + `(e.g. for Physics Gravitation: "Escape Velocity", "Gravitational Potential Energy", "Orbital Velocity", "Kepler's Laws"). `
      + `Use short canonical names as a student/teacher would say them. For each concept give its DIRECT prerequisite `
      + `concepts chosen ONLY from this same list (the ones that must be understood first). Order foundational → advanced. `
      + `Return ONLY JSON: {"concepts":[{"name":"Force","prereqs":[]},{"name":"Momentum","prereqs":["Force"]}]}`,
    messages: [{ role: 'user', content: `Material from "${chapter}" (${subject}):\n${sample}\n\nList the concepts + prerequisites as JSON.` }],
  })
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  return parseJson(text).concepts || []
}

// Insert a concept if absent; return its real id (existing or new).
async function upsertConcept(subject, chapter, name, position, vec) {
  const id = crypto.randomUUID()
  await prisma.$executeRaw`
    INSERT INTO concepts (id, subject, chapter, name, slug, position, embedding)
    VALUES (${id}::uuid, ${subject}, ${chapter}, ${name}, ${slug(name)}, ${position}, ${vec}::vector)
    ON CONFLICT (subject, chapter, name) DO NOTHING`
  const rows = await prisma.$queryRaw`
    SELECT id FROM concepts WHERE subject = ${subject} AND chapter = ${chapter} AND name = ${name} LIMIT 1`
  return rows.length ? rows[0].id : null
}

async function buildSubject(subject) {
  const emb = getEmbeddingProvider()
  const chapters = (await prisma.$queryRaw`
    SELECT DISTINCT metadata->>'chapter' chapter FROM knowledge_chunks WHERE metadata->>'subject' = ${subject}`)
    .map((r) => r.chapter).filter(Boolean)

  let added = 0
  for (const chapter of chapters) {
    const sample = await chapterSample(subject, chapter)
    if (!sample) { console.log(`  [no chunks] ${chapter}`); continue }
    let concepts = []
    try { concepts = await extractConcepts(subject, chapter, sample) } catch (e) { console.log(`  [skip] ${chapter}: ${e.message}`); continue }
    concepts = concepts.filter((c) => c && c.name)
    if (!concepts.length) { console.log(`  [empty] ${chapter}`); continue }

    // Concept names are matched against student QUERIES, so embed them in the query
    // space (symmetric) — not as documents. This is what makes "charles law" resolve
    // to "Charles's Law" instead of falling under the confidence floor.
    const vecs = await emb.embedQueries(concepts.map((c) => c.name))
    const idByName = {}
    for (let i = 0; i < concepts.length; i++) {
      const id = await upsertConcept(subject, chapter, concepts[i].name, i, `[${vecs[i].join(',')}]`)
      if (id) idByName[concepts[i].name] = id
    }
    for (const c of concepts) {
      for (const pr of (c.prereqs || [])) {
        if (idByName[c.name] && idByName[pr]) {
          await prisma.$executeRaw`
            INSERT INTO concept_prereqs (concept_id, prereq_id)
            VALUES (${idByName[c.name]}::uuid, ${idByName[pr]}::uuid) ON CONFLICT DO NOTHING`
        }
      }
    }
    added += concepts.length
    console.log(`  ${chapter}: ${concepts.length} concepts`)
  }
  console.log(`[${subject}] processed ${chapters.length} chapters, ~${added} concepts ensured.`)
}

;(async () => {
  const arg = process.argv[2]
  const subjects = arg ? [arg] : (await prisma.$queryRaw`
    SELECT DISTINCT metadata->>'subject' subject FROM knowledge_chunks WHERE metadata->>'subject' IS NOT NULL ORDER BY 1`)
    .map((r) => r.subject)
  console.log('Building concept catalog (additive) for:', subjects.join(', '))
  for (const s of subjects) { console.log(`\n=== ${s} ===`); await buildSubject(s) }
  console.log('\nDONE.')
  await prisma.$disconnect()
})().catch(async (e) => { console.error('CATALOG ERROR:', e); await prisma.$disconnect(); process.exit(1) })
