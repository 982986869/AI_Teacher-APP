'use strict'
// Textbook lesson generation end to end against the local DB with MOCK_AI: the lesson
// rows carry the chapter/topics, the second identical request is a cache hit, a
// different teaching mode is a miss, and the topic is derived from the book.
//
// Skips automatically if there is no DATABASE_URL, no seeded books, or no Class 10
// full-access student. Cleans up every row it creates.
process.env.MOCK_AI = 'true'
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), override: false })

const test = require('node:test')
const assert = require('node:assert/strict')

const hasDb = !!process.env.DATABASE_URL
const ctx = { skip: !hasDb, db: null, userId: null, chapterId: null, topicIds: [], lessonIds: [], cacheKeys: [] }

if (hasDb) {
  ctx.db = require('../src/config/database')
}

const aiService = hasDb ? require('../src/services/ai.service') : null

test('setup: a Class 10 student and a seeded chapter', { skip: ctx.skip }, async () => {
  const user = await ctx.db.user.findFirst({ where: { grade: { contains: '10' }, accessLevel: 'full', isDeleted: false }, select: { id: true } }).catch(() => null)
  const chapter = await ctx.db.textbook_chapters.findFirst({ where: { book: { class_level: 10 } }, include: { topics: { orderBy: { position: 'asc' }, take: 2 } } }).catch(() => null)
  if (!user || !chapter || chapter.topics.length < 2) { ctx.skip = true; return }
  ctx.userId = user.id
  ctx.chapterId = Number(chapter.id)
  ctx.topicIds = chapter.topics.map((t) => Number(t.id))
  ctx.chapterTitle = chapter.title
})

async function gen(extra = {}) {
  const lesson = await aiService.generateLesson({
    userId: ctx.userId, topic: '', subject: '', gradeLevel: '10', mode: 'intermediate',
    prefs: { explanationStyle: 'visual', goal: 'test-run' },
    source: { chapterId: ctx.chapterId, kind: 'topics', topicIds: ctx.topicIds },
    ...extra,
  })
  ctx.lessonIds.push(lesson.id)
  return lesson
}

test('a fresh request generates and stores a shared lesson; the lesson rows carry the book scope', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const lesson = await gen()
  assert.equal(lesson.generationModel, 'mock-v1')
  assert.ok(lesson.slides.length >= 1)
  assert.equal(lesson.source.chapter.id, ctx.chapterId)
  assert.deepEqual(lesson.source.topics.map((t) => t.id), ctx.topicIds)
  assert.ok(lesson.topic.startsWith(ctx.chapterTitle), 'topic derived from the chapter title')

  const row = await ctx.db.$queryRaw`SELECT chapter, book_chapter_id::text AS cid, book_topic_ids::text AS tids, book_lesson_id FROM lessons WHERE id = ${lesson.id}::uuid`
  assert.equal(row[0].chapter, ctx.chapterTitle)
  assert.equal(row[0].cid, String(ctx.chapterId))
  assert.equal(row[0].tids, `{${ctx.topicIds.join(',')}}`)
  assert.ok(row[0].book_lesson_id, 'points at the shared textbook_lessons row')
  ctx.cacheKeys.push(row[0].book_lesson_id)
})

test('the same request again is served from the cache', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const lesson = await gen()
  assert.equal(lesson.generationModel, 'cache:mock-v1')
  const hits = await ctx.db.$queryRaw`SELECT hits FROM textbook_lessons WHERE id = ${ctx.cacheKeys[0]}::uuid`
  assert.equal(hits[0].hits, 1)
})

test('a book lesson is taught at the BOOK\'s class, whatever the student\'s own class is', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const lesson = await gen({ gradeLevel: '12', mode: 'beginner', prefs: { explanationStyle: 'visual' } }) // its own mode, so it is its own cache row
  assert.equal(String(lesson.gradeLevel), '10')
  const row = await ctx.db.$queryRaw`SELECT book_lesson_id FROM lessons WHERE id = ${lesson.id}::uuid`
  ctx.cacheKeys.push(row[0].book_lesson_id)
})

test('a different teaching mode is a miss, a different goal is not (goal is not in the key)', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  const other = await gen({ mode: 'exam' })
  assert.equal(other.generationModel, 'mock-v1')
  const row = await ctx.db.$queryRaw`SELECT book_lesson_id FROM lessons WHERE id = ${other.id}::uuid`
  ctx.cacheKeys.push(row[0].book_lesson_id)
  const sameKeyDifferentGoal = await gen({ prefs: { explanationStyle: 'visual', goal: 'another-goal' } })
  assert.equal(sameKeyDifferentGoal.generationModel, 'cache:mock-v1')
})

test('teardown: delete every row this file created', { skip: ctx.skip }, async () => {
  if (ctx.skip) return
  for (const id of ctx.lessonIds) await ctx.db.lesson.delete({ where: { id } }).catch(() => {})
  for (const id of ctx.cacheKeys) await ctx.db.$executeRaw`DELETE FROM textbook_lessons WHERE id = ${id}::uuid`
  await ctx.db.$disconnect()
})
