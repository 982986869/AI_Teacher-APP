'use strict'
// Embeds book_topics into knowledge_chunks (one knowledge_source per book) so the
// Ask screen and in-lesson doubts can retrieve textbook passages. Rebuilds the
// book's source from scratch each run.
//   node scripts/textbooks/embed-textbooks.js [--book jemh1]
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const crypto = require('crypto')
const { Prisma } = require('@prisma/client')
const db = require('../../src/config/database')
const { chunkText } = require('../../src/utils/chunkText')
const { getEmbeddingProvider } = require('../../src/providers/embeddings')
const { config } = require('../../src/config/env')
const lib = require('./lib')

const EMBED_BATCH = 96
const vecLit = (v) => `[${v.join(',')}]`

// knowledge_sources needs an owner; a teacher/admin keeps the book out of any one
// student's "my uploads" list (students only see sources they uploaded themselves).
async function ownerId() {
  const u = await db.user.findFirst({ where: { role: { in: ['ADMIN', 'TEACHER'] } }, orderBy: { createdAt: 'asc' }, select: { id: true } })
    || await db.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } })
  if (!u) throw new Error('no users in DB to own the knowledge source')
  return u.id
}

async function embedBook(book, uploadedById) {
  const title = `NCERT Class ${book.class_level} ${book.title}`
  await db.knowledge_sources.deleteMany({ where: { title } })
  const chapters = await db.book_chapters.findMany({ where: { book_id: book.id }, orderBy: { number: 'asc' }, include: { topics: { orderBy: { position: 'asc' } } } })
  const docs = []
  for (const ch of chapters) {
    for (const t of ch.topics) {
      for (const piece of chunkText(t.text, { chunkSize: config.rag.chunkSize, overlap: config.rag.chunkOverlap })) {
        docs.push({
          content: `${ch.title} — ${t.number} ${t.title}\n${piece}`,
          metadata: { type: 'textbook', book: book.code, chapterNumber: ch.number, chapterTitle: ch.title, topicNumber: t.number, topicTitle: t.title, topicId: Number(t.id) },
        })
      }
    }
  }
  const source = await db.knowledge_sources.create({
    data: {
      id: crypto.randomUUID(),
      title, description: `${book.publisher} ${book.edition}`, type: 'textbook', subject: book.subject, gradeLevel: `Class ${book.class_level}`,
      charCount: docs.reduce((s, d) => s + d.content.length, 0), chunkCount: docs.length, status: 'PROCESSING', uploadedById, updatedAt: new Date(),
    },
  })
  const provider = getEmbeddingProvider()
  for (let i = 0; i < docs.length; i += EMBED_BATCH) {
    const slice = docs.slice(i, i + EMBED_BATCH)
    const vectors = await provider.embedDocuments(slice.map((d) => d.content))
    const rows = slice.map((d, j) => Prisma.sql`(${crypto.randomUUID()}::uuid, ${source.id}::uuid, ${i + j}, ${d.content}, ${d.content.length}, ${vecLit(vectors[j])}::vector, ${JSON.stringify(d.metadata)}::jsonb)`)
    await db.$executeRaw(Prisma.sql`INSERT INTO knowledge_chunks (id, "sourceId", "chunkIndex", content, "charCount", embedding, metadata) VALUES ${Prisma.join(rows)}`)
    process.stdout.write(`  ${book.code}: ${Math.min(i + EMBED_BATCH, docs.length)}/${docs.length}\r`)
  }
  await db.knowledge_sources.update({ where: { id: source.id }, data: { status: 'READY' } })
  console.log(`\n${title}: ${docs.length} chunks`)
}

;(async () => {
  const args = lib.parseArgs()
  const owner = await ownerId()
  const books = await db.books.findMany({ where: args.book ? { code: args.book } : {}, orderBy: { position: 'asc' } })
  for (const b of books) await embedBook(b, owner)
  await db.$disconnect()
})().catch(async (e) => { console.error('EMBED ERROR:', e.message); await db.$disconnect(); process.exit(1) })
