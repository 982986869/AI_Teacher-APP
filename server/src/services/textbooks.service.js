'use strict'
// Textbook browsing + the source loader the lesson generator grounds on.
// Built as a factory so the tests can hand in a tiny fake db; the default export is
// bound to the real Prisma client.
const realDb = require('../config/database')
const { AppError } = require('../middleware/errorHandler')

const MAX_TOPICS = 3
const num = (v) => (typeof v === 'bigint' ? Number(v) : v)

function createBooksService(db) {
  const bookOut = (b) => ({ id: num(b.id), code: b.code, title: b.title, subject: b.subject, subjectSlug: b.subject_slug, classLevel: b.class_level })

  async function listBooks({ classLevel, subject } = {}) {
    if (!classLevel) return []
    const rows = await db.textbooks.findMany({
      where: { class_level: Number(classLevel), ...(subject ? { subject } : {}) },
      orderBy: { position: 'asc' },
      include: { _count: { select: { chapters: true } } },
    })
    return rows.map((b) => ({
      ...bookOut(b),
      edition: b.edition, coverUrl: b.cover_url, chapterCount: b._count ? b._count.chapters : 0,
    }))
  }

  // Any book is browsable (the home page lets a student look at another year), so the
  // book id alone names it; the response carries the book's class.
  async function listChapters({ bookId }) {
    const rows = await db.textbook_chapters.findMany({
      where: { book_id: BigInt(bookId) },
      orderBy: { number: 'asc' },
      include: { book: true, _count: { select: { topics: true } } },
    })
    if (!rows.length) throw new AppError('Book not found.', 404)
    return {
      book: bookOut(rows[0].book),
      chapters: rows.map((c) => ({ id: num(c.id), number: c.number, title: c.title, slug: c.slug, topicCount: c._count ? c._count.topics : 0 })),
    }
  }

  // The chapter row with its book.
  async function chapterOf(chapterId) {
    const c = await db.textbook_chapters.findFirst({ where: { id: BigInt(chapterId) }, include: { book: true } })
    if (!c) throw new AppError('Chapter not found.', 404)
    return c
  }

  async function getChapter({ chapterId }) {
    const c = await chapterOf(chapterId)
    const topics = await db.textbook_topics.findMany({ where: { chapter_id: c.id }, orderBy: { position: 'asc' } })
    return {
      book: bookOut(c.book),
      chapter: { id: num(c.id), number: c.number, title: c.title },
      topics: topics.map((t) => ({ id: num(t.id), number: t.number, title: t.title, charCount: t.char_count })),
    }
  }

  // What the lesson generator teaches from. kind 'summary' = whole chapter; 'topics' =
  // 1..MAX_TOPICS ids that must all belong to the chapter. Topics come back in book order.
  // Carries the book's class: a lesson from a Class 9 chapter is taught at Class 9
  // whatever the student's own class is.
  async function loadSource({ chapterId, kind, topicIds }) {
    const c = await chapterOf(chapterId)
    let rows
    if (kind === 'summary') {
      rows = await db.textbook_topics.findMany({ where: { chapter_id: c.id }, orderBy: { position: 'asc' } })
    } else if (kind === 'topics') {
      const ids = Array.from(new Set((topicIds || []).map(Number)))
      if (!ids.length || ids.length > MAX_TOPICS || ids.length !== (topicIds || []).length) {
        throw new AppError(`Pick 1 to ${MAX_TOPICS} topics.`, 422)
      }
      rows = await db.textbook_topics.findMany({ where: { chapter_id: c.id, id: { in: ids.map((i) => BigInt(i)) } }, orderBy: { position: 'asc' } })
      if (rows.length !== ids.length) throw new AppError('Those topics are not in this chapter.', 422)
    } else {
      throw new AppError('source.kind must be "summary" or "topics".', 422)
    }
    if (!rows.length) throw new AppError('This chapter has no topics yet.', 404)

    const topics = rows.map((t) => ({ id: num(t.id), number: t.number, title: t.title, text: t.text }))
    const topicLabel = topics.map((t) => t.number).join(', ')
    const derivedTopic = kind === 'summary'
      ? `Chapter ${c.number}: ${c.title} (summary)`
      : `${c.title}: ${topics.map((t) => `${t.number} ${t.title}`).join('; ')}`
    return { book: bookOut(c.book), classLevel: c.book.class_level, chapter: { id: num(c.id), number: c.number, title: c.title }, kind, topics, topicLabel, derivedTopic }
  }

  return { listBooks, listChapters, getChapter, loadSource }
}

module.exports = { createBooksService, booksService: createBooksService(realDb), MAX_TOPICS }
