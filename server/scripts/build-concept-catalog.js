'use strict'
// Builds the Physics concept catalog: for each chapter, an LLM extracts the key
// concepts + their prerequisites; each concept name is embedded (for query→concept
// and chunk→concept matching). Idempotent for Physics. Run from server/.
require('dotenv').config()
const crypto = require('crypto')
const Anthropic = require('@anthropic-ai/sdk')
const { PrismaClient } = require('@prisma/client')
const { getEmbeddingProvider } = require('../src/providers/embeddings')

const prisma = new PrismaClient()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.AI_DOUBT_MODEL || 'claude-haiku-4-5'
const SUBJECT = 'Physics'
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function parseJson(text) {
  let c = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const s = c.indexOf('{'); const e = c.lastIndexOf('}')
  if (s >= 0 && e > s) c = c.slice(s, e + 1)
  return JSON.parse(c)
}

async function chapterSample(chapter) {
  const rows = await prisma.$queryRaw`
    SELECT content FROM knowledge_chunks
    WHERE metadata->>'subject' = ${SUBJECT} AND metadata->>'chapter' = ${chapter}
    ORDER BY "chunkIndex" LIMIT 14`
  return rows.map((r) => r.content).join('\n---\n').slice(0, 6500)
}

async function extractConcepts(chapter, sample) {
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 700,
    system: `You map the key concepts of a Class 11 Physics chapter for a learning system. `
      + `List the 5 to 9 most important named concepts a student must master in "${chapter}", and for each, `
      + `its DIRECT prerequisite concepts chosen ONLY from this same list (the ones that must be understood first). `
      + `Order from foundational to advanced. Use short canonical names (e.g. "Momentum", "Impulse", "Escape Velocity"). `
      + `Return ONLY JSON: {"concepts":[{"name":"Force","prereqs":[]},{"name":"Momentum","prereqs":["Force"]},{"name":"Impulse","prereqs":["Momentum"]}]}`,
    messages: [{ role: 'user', content: `Material from "${chapter}":\n${sample}\n\nList the concepts + prerequisites as JSON.` }],
  })
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  return parseJson(text).concepts || []
}

;(async () => {
  const emb = getEmbeddingProvider()
  const chapters = (await prisma.$queryRaw`
    SELECT DISTINCT metadata->>'chapter' chapter FROM knowledge_chunks WHERE metadata->>'subject' = ${SUBJECT}`)
    .map((r) => r.chapter).filter(Boolean)

  await prisma.$executeRaw`DELETE FROM concept_prereqs WHERE concept_id IN (SELECT id FROM concepts WHERE subject = ${SUBJECT})`
  await prisma.$executeRaw`DELETE FROM concepts WHERE subject = ${SUBJECT}`

  let total = 0
  for (const chapter of chapters) {
    const sample = await chapterSample(chapter)
    let concepts = []
    try { concepts = await extractConcepts(chapter, sample) } catch (e) { console.log(`  [skip] ${chapter}: ${e.message}`); continue }
    concepts = concepts.filter((c) => c && c.name)
    if (!concepts.length) { console.log(`  [empty] ${chapter}`); continue }

    const vecs = await emb.embedDocuments(concepts.map((c) => c.name))
    const idByName = {}
    for (let i = 0; i < concepts.length; i++) {
      const id = crypto.randomUUID()
      idByName[concepts[i].name] = id
      const vec = `[${vecs[i].join(',')}]`
      await prisma.$executeRaw`
        INSERT INTO concepts (id, subject, chapter, name, slug, position, embedding)
        VALUES (${id}::uuid, ${SUBJECT}, ${chapter}, ${concepts[i].name}, ${slug(concepts[i].name)}, ${i}, ${vec}::vector)
        ON CONFLICT (subject, chapter, name) DO NOTHING`
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
    total += concepts.length
    console.log(`  ${chapter}: ${concepts.length} concepts (${concepts.map((c) => c.name).join(', ')})`)
  }
  console.log(`\nDONE. ${total} Physics concepts across ${chapters.length} chapters.`)
  await prisma.$disconnect()
})().catch(async (e) => { console.error('CATALOG ERROR:', e); await prisma.$disconnect(); process.exit(1) })
