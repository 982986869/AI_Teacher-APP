'use strict'
// Upserts books / book_chapters / book_topics from the committed chNN.json files.
// Re-runnable: topics missing from a JSON are deleted, everything else is updated in
// place so ids (and therefore cached book_lessons) survive a re-seed.
//
//   node scripts/textbooks/seed-textbooks.js [--book jemh1]
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')
const lib = require('./lib')

const db = new PrismaClient()

async function seedBook(b) {
  const data = { class_level: b.classLevel, subject: b.subject, subject_slug: b.subjectSlug, title: b.title, publisher: b.publisher, edition: b.edition, language: b.language, cover_url: `/books/${b.code}.png`, position: b.position || 0 }
  const book = await db.textbooks.upsert({ where: { code: b.code }, create: { code: b.code, ...data }, update: data })
  let topicsTotal = 0
  for (let n = 1; n <= b.chapters; n++) {
    const file = lib.chapterJsonPath(b.code, n, b.classLevel)
    if (!fs.existsSync(file)) throw new Error(`missing ${file} — run outline.js first`)
    const ch = JSON.parse(fs.readFileSync(file, 'utf8'))
    const bad = ch.topics.find((t) => !t.text || t.text.length < 200)
    if (bad) throw new Error(`${b.code} ch${n} topic ${bad.number} has no usable text — refusing the chapter`)
    const charCount = ch.topics.reduce((s, t) => s + t.charCount, 0)
    const chData = { title: ch.title, slug: ch.slug, page_count: ch.pageCount, source_url: ch.sourceUrl, char_count: charCount }
    // The chapter's number as the book prints it (a part 2 continues part 1's count).
    const number = ch.chapterNumber || n
    const chapter = await db.textbook_chapters.upsert({
      where: { book_id_number: { book_id: book.id, number } },
      create: { book_id: book.id, number, ...chData },
      update: chData,
    })
    for (let i = 0; i < ch.topics.length; i++) {
      const t = ch.topics[i]
      const tData = { title: t.title, slug: t.slug, position: i + 1, text: t.text, char_count: t.charCount }
      await db.textbook_topics.upsert({
        where: { chapter_id_number: { chapter_id: chapter.id, number: t.number } },
        create: { chapter_id: chapter.id, number: t.number, ...tData },
        update: tData,
      })
    }
    await db.textbook_topics.deleteMany({ where: { chapter_id: chapter.id, number: { notIn: ch.topics.map((t) => t.number) } } })
    topicsTotal += ch.topics.length
    console.log(`  ch${lib.pad2(n)} ${ch.title} — ${ch.topics.length} topics`)
  }
  console.log(`${b.code}: ${b.chapters} chapters, ${topicsTotal} topics`)
}

;(async () => {
  const args = lib.parseArgs()
  for (const b of lib.loadManifest()) {
    if (args.book && b.code !== args.book) continue
    await seedBook(b)
  }
  await db.$disconnect()
})().catch(async (e) => { console.error('SEED ERROR:', e.message); await db.$disconnect(); process.exit(1) })
