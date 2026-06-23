'use strict'
// Embeds the curriculum already in the DB (exemplar_solutions + ncert_solutions)
// into knowledge_chunks so the AI Teacher can ground answers in it.
//
// Usage:
//   node scripts/ingest-curriculum.js                 # all subjects, both types
//   node scripts/ingest-curriculum.js Physics         # one subject
//   node scripts/ingest-curriculum.js Physics --exemplar-only
//   node scripts/ingest-curriculum.js --ncert-only
//
// Idempotent: each (type, subject) is one knowledge_sources row; re-running
// deletes+rebuilds that source (chunks cascade). Raw SQL throughout, so it does
// not depend on the half-built knowledge.service model accessors.
require('dotenv').config()
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')
const { config } = require('../src/config/env')
const { chunkText } = require('../src/utils/chunkText')
const { htmlToText } = require('../src/utils/htmlToText')
const { getEmbeddingProvider } = require('../src/providers/embeddings')

const prisma = new PrismaClient()
const GRADE = 'Class 11'
const ALL_SUBJECTS = ['Physics', 'Chemistry', 'Biology', 'Mathematics']
const EMBED_BATCH = 96

const args = process.argv.slice(2)
const onlySubject = args.find((a) => !a.startsWith('--'))
const exemplarOnly = args.includes('--exemplar-only')
const ncertOnly = args.includes('--ncert-only')
const SUBJECTS = ALL_SUBJECTS.filter((s) => !onlySubject || s === onlySubject)

// Which content types to ingest. Default = all four.
//   --types=pyq,practice   restrict to specific types
const typesArg = (args.find((a) => a.startsWith('--types=')) || '').replace('--types=', '')
const TYPES = typesArg
  ? typesArg.split(',').map((s) => s.trim()).filter(Boolean)
  : exemplarOnly ? ['exemplar'] : ncertOnly ? ['ncert'] : ['exemplar', 'ncert', 'pyq', 'practice']

const vecLit = (e) => `[${e.join(',')}]`

async function getUploaderId() {
  const u = await prisma.$queryRaw`SELECT id FROM users ORDER BY "createdAt" ASC LIMIT 1`
  if (!u.length) throw new Error('No users exist to own the knowledge source.')
  return u[0].id
}

async function recreateSource({ title, type, subject, uploaderId }) {
  await prisma.$executeRaw`DELETE FROM knowledge_sources WHERE title = ${title}`
  const id = crypto.randomUUID()
  await prisma.$executeRaw`
    INSERT INTO knowledge_sources
      (id, title, description, type, subject, "gradeLevel", "charCount", "chunkCount", status, "uploadedById", "createdAt", "updatedAt")
    VALUES
      (${id}::uuid, ${title}, ${'Auto-ingested curriculum'}, ${type}, ${subject}, ${GRADE}, 0, 0,
       ${'PROCESSING'}::"KnowledgeStatus", ${uploaderId}::uuid, now(), now())`
  return id
}

async function insertChunks(sourceId, docs) {
  const provider = getEmbeddingProvider()
  let idx = 0
  let chars = 0
  for (let i = 0; i < docs.length; i += EMBED_BATCH) {
    const slice = docs.slice(i, i + EMBED_BATCH)
    const vectors = await provider.embedDocuments(slice.map((d) => d.content))
    for (let j = 0; j < slice.length; j++) {
      const id = crypto.randomUUID()
      const c = slice[j]
      const vec = vecLit(vectors[j])
      await prisma.$executeRaw`
        INSERT INTO knowledge_chunks (id, "sourceId", "chunkIndex", content, "charCount", embedding, metadata, "createdAt")
        VALUES (${id}::uuid, ${sourceId}::uuid, ${idx}, ${c.content}, ${c.content.length}, ${vec}::vector, ${JSON.stringify(c.metadata)}::jsonb, now())`
      chars += c.content.length
      idx += 1
    }
    process.stdout.write(`    embedded ${Math.min(i + EMBED_BATCH, docs.length)}/${docs.length}\r`)
  }
  return { count: idx, chars }
}

async function ingestSource({ title, type, subject, uploaderId, docs }) {
  if (docs.length === 0) { console.log(`  [skip] ${title} — no documents`); return }
  const sourceId = await recreateSource({ title, type, subject, uploaderId })
  const { count, chars } = await insertChunks(sourceId, docs)
  await prisma.$executeRaw`
    UPDATE knowledge_sources SET status = ${'READY'}::"KnowledgeStatus", "chunkCount" = ${count}, "charCount" = ${chars}
    WHERE id = ${sourceId}::uuid`
  console.log(`\n  [ready] ${title} — ${count} chunks, ${chars} chars`)
}

async function exemplarDocs(subject) {
  const rows = await prisma.$queryRaw`
    SELECT chapter, section, "qNumber", text, options, "solutionLabel", solution
    FROM exemplar_solutions WHERE subject = ${subject} AND "className" = ${GRADE}
    ORDER BY chapter, position`
  return rows.map((r) => {
    const opts = Array.isArray(r.options) && r.options.length
      ? '\nOptions: ' + r.options.map((o) => o.text).filter(Boolean).join(' | ')
      : ''
    const content = `[Exemplar] ${subject} > ${r.chapter} > ${r.section}\n`
      + `Q${r.qNumber}: ${r.text}${opts}\n${r.solutionLabel || 'Solution'}: ${r.solution || ''}`
    return {
      content: content.trim(),
      metadata: { type: 'exemplar', subject, chapter: r.chapter, section: r.section, qNumber: r.qNumber },
    }
  })
}

async function ncertDocs(subject) {
  const secs = await prisma.$queryRaw`
    SELECT chapter, "sectionLabel", html
    FROM ncert_solutions WHERE part = 2 AND subject = ${subject} AND "className" = ${GRADE} AND html IS NOT NULL
    ORDER BY "chapterPos", position`
  const docs = []
  for (const s of secs) {
    const text = htmlToText(s.html)
    if (!text) continue
    const pieces = chunkText(text, { chunkSize: config.rag.chunkSize, overlap: config.rag.chunkOverlap })
    pieces.forEach((piece, pi) => {
      docs.push({
        content: `[NCERT Part-II] ${subject} > ${s.chapter} > ${s.sectionLabel}\n${piece}`,
        metadata: { type: 'ncert', subject, chapter: s.chapter, section: s.sectionLabel, part: pi },
      })
    })
  }
  return docs
}

// PYQ + Practice live in the relational `questions` table (joined via
// sections -> section_types). Each question becomes a doc; long solutions chunk.
async function questionDocs(subject, typeKey, typeLabel) {
  const rows = await prisma.$queryRaw`
    SELECT c.name chapter, q.q_number qnum, q.year, q.question_html qhtml, q.options, q.solution_html shtml
    FROM questions q
    JOIN sections sec ON sec.id = q.section_id
    JOIN section_types st ON st.key = sec.type_key
    JOIN chapters c ON c.id = sec.chapter_id
    JOIN subjects s ON s.id = c.subject_id
    WHERE st.key = ${typeKey} AND s.name = ${subject}
    ORDER BY c.position, sec.position, q.position`
  const docs = []
  for (const r of rows) {
    const qtext = htmlToText(r.qhtml)
    if (!qtext) continue
    const opts = Array.isArray(r.options) && r.options.length
      ? '\nOptions: ' + r.options.map((o) => (typeof o === 'string' ? o : (o && o.text) || '')).filter(Boolean).join(' | ')
      : ''
    const sol = r.shtml ? '\nSolution: ' + htmlToText(r.shtml) : ''
    const yr = r.year ? ` (${r.year})` : ''
    const base = `[${typeLabel}] ${subject} > ${r.chapter}\nQ${r.qnum || ''}${yr}: ${qtext}${opts}${sol}`.trim()
    const pieces = base.length > 1800 ? chunkText(base, { chunkSize: 1500, overlap: 150 }) : [base]
    pieces.forEach((piece, pi) => docs.push({
      content: piece,
      metadata: { type: typeKey, subject, chapter: r.chapter, qNumber: r.qnum, year: r.year, part: pi },
    }))
  }
  return docs
}

;(async () => {
  const uploaderId = await getUploaderId()
  console.log(`Ingesting curriculum -> knowledge_chunks (subjects: ${SUBJECTS.join(', ')} | types: ${TYPES.join(', ')})`)
  for (const subject of SUBJECTS) {
    console.log(`\n== ${subject} ==`)
    if (TYPES.includes('exemplar')) {
      await ingestSource({ title: `Exemplar — ${subject} (Class 11)`, type: 'exemplar', subject, uploaderId, docs: await exemplarDocs(subject) })
    }
    if (TYPES.includes('ncert')) {
      await ingestSource({ title: `NCERT Part-II — ${subject} (Class 11)`, type: 'ncert', subject, uploaderId, docs: await ncertDocs(subject) })
    }
    if (TYPES.includes('pyq')) {
      await ingestSource({ title: `PYQ — ${subject} (Class 11)`, type: 'pyq', subject, uploaderId, docs: await questionDocs(subject, 'pyq', 'PYQ') })
    }
    if (TYPES.includes('practice')) {
      await ingestSource({ title: `Practice — ${subject} (Class 11)`, type: 'practice', subject, uploaderId, docs: await questionDocs(subject, 'important_questions', 'Practice') })
    }
  }
  const tot = await prisma.$queryRaw`SELECT count(*)::int n FROM knowledge_chunks`
  console.log(`\nDONE. Total knowledge_chunks now: ${tot[0].n}`)
  await prisma.$disconnect()
})().catch(async (e) => { console.error('INGEST ERROR:', e.message); await prisma.$disconnect(); process.exit(1) })
