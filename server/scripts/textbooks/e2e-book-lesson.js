'use strict'
// Generates a textbook lesson through the real service against the local DB, twice,
// and checks the second call hits the shared cache.
//   MOCK_AI=true node scripts/textbooks/e2e-book-lesson.js --book jemh1 --chapter 7 [--topics 2,3] [--summary] [--dump]
// With MOCK_AI unset it calls Claude for real (costs money; used for the fidelity review).
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const db = require('../../src/config/database')
const aiService = require('../../src/services/ai.service')
const lib = require('./lib')

;(async () => {
  const args = lib.parseArgs()
  const summary = process.argv.includes('--summary')
  const topicsArg = process.argv.includes('--topics') ? process.argv[process.argv.indexOf('--topics') + 1] : null
  // --mode <key> picks the teaching mode (default intermediate); a different mode is a
  // DB-cache miss on purpose, which is how the Anthropic prompt-cache read is verified.
  const mode = process.argv.includes('--mode') ? process.argv[process.argv.indexOf('--mode') + 1] : 'intermediate'
  const user = await db.user.findFirst({ where: { grade: { contains: '10' }, accessLevel: 'full' }, select: { id: true, grade: true } })
  if (!user) throw new Error('no Class 10 user in the local DB — set a dev account\'s grade to "Class 10"')
  const book = await db.books.findUnique({ where: { code: args.book || 'jemh1' } })
  const chapter = await db.book_chapters.findFirst({ where: { book_id: book.id, number: args.chapter || 1 } })
  const topics = await db.book_topics.findMany({ where: { chapter_id: chapter.id }, orderBy: { position: 'asc' } })
  const picks = summary ? [] : (topicsArg ? topicsArg.split(',').map((i) => topics[Number(i) - 1]) : [topics[1] || topics[0]])
  const source = summary ? { chapterId: Number(chapter.id), kind: 'summary' } : { chapterId: Number(chapter.id), kind: 'topics', topicIds: picks.map((t) => Number(t.id)) }

  for (const pass of [1, 2]) {
    const t0 = Date.now()
    const lesson = await aiService.generateLesson({ userId: user.id, topic: '', subject: '', gradeLevel: '10', mode, prefs: { explanationStyle: 'visual' }, source })
    console.log(`pass ${pass}: ${lesson.lessonTitle} | ${lesson.slides.length} slides | model=${lesson.generationModel} | ${Date.now() - t0} ms | source=${lesson.source.kind === 'summary' ? 'summary' : lesson.source.topicLabel} | lesson ${lesson.id}`)
    if (pass === 2 && !String(lesson.generationModel).startsWith('cache:')) throw new Error('second call did not hit the cache')
    if (pass === 1 && process.argv.includes('--dump')) {
      for (const s of lesson.slides) console.log(`\n## ${s.slideNumber}. ${s.slideTitle} [${s.visualType}]\n${s.narrationText}`)
      console.log('')
    }
  }
  await db.$disconnect()
})().catch(async (e) => { console.error('E2E ERROR:', e.message); await db.$disconnect(); process.exit(1) })
