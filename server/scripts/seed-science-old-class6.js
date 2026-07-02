'use strict'
// Seeds EMPTY scaffolds for Class 6 "Science (OLD)" into ncert_solutions using
// RAW SQL (works with the existing generated Prisma client — no `prisma generate`).
//
// Purpose: make the Science (OLD) resource tiles (Revision Notes / NCERT Solutions
// / Exemplar) list their chapters. A chapter only appears once it has >=1 row, so
// we insert one placeholder ("coming soon") section per chapter for each part:
//   part 2 = NCERT textbook solutions (also feeds the "Class 06 - Science - Revised" tile)
//   part 3 = NCERT Exemplar
//   part 4 = Revision Notes (flash cards)
//
// Idempotent: clears ONLY subject='Science (OLD)' + className='Class 6' rows first.
// Touches no other subject, class or part.
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const SUBJECT = 'Science (OLD)'
const CLASS_NAME = 'Class 6'

// Old NCERT (pre-revision) Class 6 Science textbook — 16 chapters, registry order.
const CHAPTERS = [
  'Food: Where Does It Come From?',
  'Components of Food',
  'Fibre to Fabric',
  'Sorting Materials into Groups',
  'Separation of Substances',
  'Changes Around Us',
  'Getting to Know Plants',
  'Body Movements',
  'The Living Organisms and Their Surroundings',
  'Motion and Measurement of Distances',
  'Light, Shadows and Reflections',
  'Electricity and Circuits',
  'Fun with Magnets',
  'Water',
  'Air Around Us',
  'Garbage In, Garbage Out',
]

// One placeholder section per chapter for each part. `html` is a clean "coming
// soon" card so tapping a section reads nicely (rather than an empty/debug view).
const PARTS = [
  { part: 2, sectionKey: 'exercises',      sectionLabel: 'Textbook Exercises' },
  { part: 3, sectionKey: 'exemplar',       sectionLabel: 'Exemplar Questions' },
  { part: 4, sectionKey: 'revision-notes', sectionLabel: 'Revision Notes' },
]

const comingSoonHtml = (chapter, label) =>
  `<div class="question-card"><div class="question-text">${label} for ` +
  `<b>${chapter}</b> are coming soon.</div></div>`

;(async () => {
  const del = await prisma.$executeRaw`
    DELETE FROM ncert_solutions WHERE subject = ${SUBJECT} AND "className" = ${CLASS_NAME}`
  console.log(`cleared existing ${SUBJECT} / ${CLASS_NAME} rows:`, del)

  let inserted = 0
  const total = CHAPTERS.length * PARTS.length
  for (let ci = 0; ci < CHAPTERS.length; ci++) {
    const chapter = CHAPTERS[ci]
    for (const p of PARTS) {
      await prisma.$executeRaw`
        INSERT INTO ncert_solutions
          (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
        VALUES
          (${p.part}, ${SUBJECT}, ${CLASS_NAME}, ${chapter}, ${p.sectionKey}, ${p.sectionLabel},
           ${comingSoonHtml(chapter, p.sectionLabel)}, ${ci}, ${0})`
      inserted += 1
      process.stdout.write(`  inserted ${inserted}/${total}\r`)
    }
  }
  console.log(`\nseeded total: ${inserted} (${CHAPTERS.length} chapters x ${PARTS.length} parts)`)
  await prisma.$disconnect()
})().catch(async (e) => { console.error('SEED ERROR:', e.message); await prisma.$disconnect(); process.exit(1) })
