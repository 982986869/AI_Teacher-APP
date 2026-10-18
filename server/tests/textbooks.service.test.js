'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { createBooksService } = require('../src/services/textbooks.service')

// A tiny Prisma stand-in with only the query shapes the service uses.
function fakeDb() {
  const books = [
    { id: 1n, code: 'jemh1', class_level: 10, subject: 'Mathematics', subject_slug: 'mathematics', title: 'Mathematics', edition: '2026-27', cover_url: '/books/jemh1.png', position: 2, _count: { chapters: 14 } },
    { id: 2n, code: 'jesc1', class_level: 10, subject: 'Science', subject_slug: 'science', title: 'Science', edition: '2026-27', cover_url: '/books/jesc1.png', position: 1, _count: { chapters: 13 } },
  ]
  const chapters = [
    { id: 10n, book_id: 1n, number: 7, title: 'Binomial Theorem', slug: 'binomial-theorem', _count: { topics: 3 } },
    { id: 11n, book_id: 1n, number: 8, title: 'Sequences', slug: 'sequences', _count: { topics: 2 } },
  ]
  const topics = [
    { id: 100n, chapter_id: 10n, number: '7.1', title: 'Introduction', position: 1, text: 'intro text', char_count: 10 },
    { id: 101n, chapter_id: 10n, number: '7.2', title: 'Binomial Theorem for Positive Integral Indices', position: 2, text: 'bt text', char_count: 7 },
    { id: 102n, chapter_id: 10n, number: '7.3', title: 'General and Middle Terms', position: 3, text: 'gen text', char_count: 8 },
    { id: 110n, chapter_id: 11n, number: '8.1', title: 'Introduction', position: 1, text: 'seq text', char_count: 8 },
  ]
  const withBook = (c) => ({ ...c, book: books.find((b) => b.id === c.book_id) })
  return {
    textbooks: {
      async findMany({ where = {} }) {
        return books
          .filter((b) => (where.class_level == null || b.class_level === where.class_level) && (!where.subject || b.subject === where.subject))
          .sort((a, b) => a.position - b.position)
      },
    },
    textbook_chapters: {
      async findMany({ where }) {
        return chapters
          .filter((c) => c.book_id === where.book_id && (!where.book || where.book.class_level === withBook(c).book.class_level))
          .map(withBook)
      },
      async findFirst({ where }) { const c = chapters.find((c) => c.id === where.id); return c ? withBook(c) : null },
    },
    textbook_topics: {
      async findMany({ where }) {
        return topics
          .filter((t) => t.chapter_id === where.chapter_id && (!where.id || where.id.in.includes(t.id)))
          .sort((a, b) => a.position - b.position)
      },
    },
  }
}

const svc = createBooksService(fakeDb())

test('listBooks returns the class\'s books in position order with plain-number ids and chapter counts', async () => {
  const out = await svc.listBooks({ classLevel: 10 })
  assert.deepEqual(out.map((b) => [b.id, b.code, b.chapterCount]), [[2, 'jesc1', 13], [1, 'jemh1', 14]])
  assert.equal(typeof out[0].id, 'number')
  assert.equal(out[0].coverUrl, '/books/jesc1.png')
})

test('listBooks is empty (not an error) for a class with no books, or no class', async () => {
  assert.deepEqual(await svc.listBooks({ classLevel: 11 }), [])
  assert.deepEqual(await svc.listBooks({}), [])
})

test('listChapters returns number/title/topicCount', async () => {
  const out = await svc.listChapters({ bookId: 1, classLevel: 10 })
  assert.deepEqual(out.chapters.map((c) => [c.id, c.number, c.topicCount]), [[10, 7, 3], [11, 8, 2]])
  assert.equal(out.book.title, 'Mathematics')
})

test('listChapters for an unknown book is a 404', async () => {
  await assert.rejects(svc.listChapters({ bookId: 99 }), (e) => e.statusCode === 404)
})

test('getChapter returns topic titles and sizes but never the text', async () => {
  const out = await svc.getChapter({ chapterId: 10, classLevel: 10 })
  assert.equal(out.chapter.title, 'Binomial Theorem')
  assert.deepEqual(out.topics.map((t) => t.number), ['7.1', '7.2', '7.3'])
  assert.equal(out.topics[0].text, undefined)
  assert.equal(out.topics[0].charCount, 10)
})

test('getChapter opens a chapter of any class (a student may browse another year) and names the class', async () => {
  const out = await svc.getChapter({ chapterId: 10 })
  assert.equal(out.chapter.title, 'Binomial Theorem')
  assert.equal(out.book.classLevel, 10)
})

test('listChapters needs only the book id', async () => {
  const out = await svc.listChapters({ bookId: 1 })
  assert.equal(out.chapters.length, 2)
  assert.equal(out.book.classLevel, 10)
})

test('loadSource reports the BOOK\'s class so the lesson is taught at that level', async () => {
  const s = await svc.loadSource({ chapterId: 10, kind: 'summary' })
  assert.equal(s.classLevel, 10)
})

test('loadSource(topics) returns the chosen topics in book order and a derived topic string', async () => {
  const s = await svc.loadSource({ chapterId: 10, kind: 'topics', topicIds: [102, 101], classLevel: 10 })
  assert.deepEqual(s.topics.map((t) => t.number), ['7.2', '7.3'])
  assert.equal(s.topics[0].text, 'bt text')
  assert.equal(s.topicLabel, '7.2, 7.3')
  assert.equal(s.derivedTopic, 'Binomial Theorem: 7.2 Binomial Theorem for Positive Integral Indices; 7.3 General and Middle Terms')
  assert.equal(s.kind, 'topics')
  assert.equal(s.book.subject, 'Mathematics')
})

test('loadSource(summary) returns every topic and a chapter-level topic string', async () => {
  const s = await svc.loadSource({ chapterId: 10, kind: 'summary', classLevel: 10 })
  assert.equal(s.topics.length, 3)
  assert.equal(s.derivedTopic, 'Chapter 7: Binomial Theorem (summary)')
})

test('loadSource rejects topic ids outside the chapter, empty, or more than 3', async () => {
  await assert.rejects(svc.loadSource({ chapterId: 10, kind: 'topics', topicIds: [101, 110], classLevel: 10 }), (e) => e.statusCode === 422)
  await assert.rejects(svc.loadSource({ chapterId: 10, kind: 'topics', topicIds: [], classLevel: 10 }), (e) => e.statusCode === 422)
  await assert.rejects(svc.loadSource({ chapterId: 10, kind: 'topics', topicIds: [100, 101, 102, 100], classLevel: 10 }), (e) => e.statusCode === 422)
  await assert.rejects(svc.loadSource({ chapterId: 10, kind: 'quiz', classLevel: 10 }), (e) => e.statusCode === 422)
})

test('loadSource refuses an unknown chapter with 404', async () => {
  await assert.rejects(svc.loadSource({ chapterId: 999, kind: 'summary', classLevel: 10 }), (e) => e.statusCode === 404)
})
