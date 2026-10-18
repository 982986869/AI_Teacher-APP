'use strict'

// Admin-uploaded books: the PDF goes in, chapters and generated content come out.
//
// The PDF itself is NOT kept. Once text is extracted it serves no purpose but cost —
// a 50 MB textbook is storage we pay for forever to hold something already in the
// database as text. The SHA-256 is kept instead, so the same file uploaded again is
// recognised in one indexed lookup, before a byte is parsed or a rupee of AI spend.
//
// Generated content is filed under four kinds, each its own row and each separately
// publishable: an admin can release a chapter's notes while its quiz is still under
// review. Nothing reaches a student until an admin says so — `books.published` and
// `book_content.status` both default to the closed position.

const crypto = require('crypto')
const db = require('../config/database')

const KINDS = ['notes', 'quiz', 'practice', 'resource']
const MAX_PAGES = 400

// ─── Chapter detection ───────────────────────────────────────────────────────

// Textbooks announce their chapters, but not uniformly. These are the forms that
// actually appear in Indian school PDFs, in the order worth trying.
const HEADINGS = [
  /^\s*chapter\s+(\d{1,2})\b[:.\-\s]*(.{0,80})$/i,
  /^\s*(\d{1,2})\.\s+([A-Z][^.]{3,80})$/,
  /^\s*unit\s+(\d{1,2})\b[:.\-\s]*(.{0,80})$/i,
  /^\s*(?:अध्याय|पाठ)\s+(\d{1,2})\b[:.\-\s]*(.{0,80})$/,
]

function detectChapters(pages) {
  const marks = []
  pages.forEach((text, i) => {
    // Only the first lines of a page can open a chapter — a mid-page mention of
    // "see Chapter 4" is a reference, not a heading.
    for (const line of String(text || '').split('\n').slice(0, 6)) {
      const clean = line.trim()
      if (!clean || clean.length > 90) continue
      for (const re of HEADINGS) {
        const m = clean.match(re)
        if (!m) continue
        const num = parseInt(m[1], 10)
        if (!Number.isFinite(num) || num < 1 || num > 60) continue
        const title = String(m[2] || '').trim().replace(/\s+/g, ' ')
        marks.push({ page: i, num, title: title || `Chapter ${num}` })
        return
      }
    }
  })

  // Numbers must climb. A stray "3." in a table of contents would otherwise split
  // the book at the wrong place and take every later chapter with it.
  const clean = []
  for (const m of marks) {
    if (clean.length && m.num <= clean[clean.length - 1].num) continue
    clean.push(m)
  }

  // Nothing recognisable — a scanned workbook, or a book that numbers nothing.
  // One chapter is honest; pretending to find structure is not.
  if (clean.length < 2) {
    return [{ position: 1, title: 'Full book', pageFrom: 1, pageTo: pages.length, text: pages.join('\n\n') }]
  }

  return clean.map((m, i) => {
    const end = i + 1 < clean.length ? clean[i + 1].page : pages.length
    return {
      position: i + 1,
      title: m.title,
      pageFrom: m.page + 1,
      pageTo: end,
      text: pages.slice(m.page, end).join('\n\n'),
    }
  })
}

// ─── Upload ──────────────────────────────────────────────────────────────────

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex')

async function findByHash(hash) {
  const rows = await db.$queryRawUnsafe(
    `SELECT id::text AS id, title, status, published FROM "books" WHERE sha256 = $1 LIMIT 1`, hash)
  return rows[0] || null
}

// Extract, split, store. Synchronous on purpose: there is no worker process, and a
// queued job on a host that sleeps is a job that never runs. The page cap is what
// keeps that honest — beyond it the request would outlive any HTTP timeout.
async function ingest(buffer, meta) {
  const hash = sha256(buffer)
  const existing = await findByHash(hash)
  if (existing) return { duplicate: true, book: existing }

  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "books" (title, subject_id, class_level, sha256, original_filename, size_bytes, status, uploaded_by, uploaded_by_name)
     VALUES ($1, $2::bigint, $3::int, $4, $5, $6::bigint, 'extracting', $7::uuid, $8)
     RETURNING id::text AS id`,
    meta.title, meta.subjectId || null, meta.classLevel || null, hash,
    meta.filename || null, buffer.length, meta.userId || null, meta.userName || null)
  const bookId = rows[0].id

  try {
    // pdf-parse v2 exports a PDFParse class (v1's default function is gone) and
    // returns per-page text, which is what chapter detection needs — a concatenated
    // blob has no page boundaries to split on.
    const { PDFParse } = require('pdf-parse')
    const parser = new PDFParse({ data: buffer })
    let pages = []
    try {
      const out = await parser.getText()
      pages = (out.pages || []).map((p) => String(p.text || ''))
    } finally {
      // Releases the worker. Skipping it leaks one per upload.
      await parser.destroy().catch(() => {})
    }
    if (pages.length > MAX_PAGES) pages = pages.slice(0, MAX_PAGES)

    if (!pages.length || pages.join('').trim().length < 200) {
      // A scanned book with no text layer. OCR would be the answer; saying so beats
      // storing an empty book that looks ready.
      throw new Error('No readable text found. This looks like a scanned PDF — it needs OCR before it can be used.')
    }

    const chapters = detectChapters(pages)
    for (const c of chapters) {
      await db.$executeRawUnsafe(
        `INSERT INTO "book_chapters" (book_id, position, title, page_from, page_to, text, char_count)
         VALUES ($1::uuid, $2::int, $3, $4::int, $5::int, $6, $7::int)`,
        bookId, c.position, c.title, c.pageFrom, c.pageTo, c.text, c.text.length)
    }

    await db.$executeRawUnsafe(
      `UPDATE "books" SET status = 'ready', page_count = $2::int, updated_at = now() WHERE id = $1::uuid`,
      bookId, pages.length)

    return { duplicate: false, bookId, pages: pages.length, chapters: chapters.length }
  } catch (err) {
    await db.$executeRawUnsafe(
      `UPDATE "books" SET status = 'failed', error = $2, updated_at = now() WHERE id = $1::uuid`,
      bookId, String(err.message || err).slice(0, 500))
    throw err
  }
}

// ─── Reads ───────────────────────────────────────────────────────────────────

async function list({ search, status } = {}) {
  const conds = []
  const params = []
  const bind = (v) => { params.push(v); return `$${params.length}` }
  if (search) conds.push(`b.title ILIKE ${bind(`%${search}%`)}`)
  if (status) conds.push(`b.status = ${bind(status)}`)
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : ''
  return db.$queryRawUnsafe(
    `SELECT b.id::text AS id, b.title, b.class_level, b.status, b.error, b.published,
            b.page_count, b.size_bytes::text AS size_bytes, b.original_filename,
            b.uploaded_by_name, b.created_at, s.name AS subject,
            (SELECT count(*) FROM "book_chapters" c WHERE c.book_id = b.id)::int AS chapters,
            (SELECT count(*) FROM "book_content" bc JOIN "book_chapters" c2 ON c2.id = bc.chapter_id
              WHERE c2.book_id = b.id)::int AS content_total,
            (SELECT count(*) FROM "book_content" bc JOIN "book_chapters" c3 ON c3.id = bc.chapter_id
              WHERE c3.book_id = b.id AND bc.status = 'published')::int AS content_published
       FROM "books" b LEFT JOIN "subjects" s ON s.id = b.subject_id
       ${where} ORDER BY b.created_at DESC LIMIT 100`, ...params)
}

// Each section carries its own size, because "Notes · Live" tells an admin nothing
// about whether the model wrote four usable paragraphs or forty. The counts come
// straight out of the payload in SQL rather than from a stored column, so they can
// never drift from the content they describe.
//
//   notes     → number of sections
//   quiz      → number of questions
//   practice  → number of questions
//   resource  → number of items
const CONTENT_UNITS = `
  CASE bc.kind
    WHEN 'notes'    THEN jsonb_array_length(COALESCE(bc.payload->'sections',  '[]'::jsonb))
    WHEN 'quiz'     THEN jsonb_array_length(COALESCE(bc.payload->'questions', '[]'::jsonb))
    WHEN 'practice' THEN jsonb_array_length(COALESCE(bc.payload->'questions', '[]'::jsonb))
    WHEN 'resource' THEN jsonb_array_length(COALESCE(bc.payload->'items',     '[]'::jsonb))
    ELSE 0
  END`

async function chapters(bookId) {
  return db.$queryRawUnsafe(
    `SELECT c.id::text AS id, c.position, c.title, c.page_from, c.page_to, c.char_count,
            c.visible,
            COALESCE(json_agg(json_build_object(
              'id', bc.id::text, 'kind', bc.kind, 'title', bc.title,
              'status', bc.status, 'source', bc.source, 'model', bc.model,
              'units', ${CONTENT_UNITS},
              'chars', length(bc.payload::text),
              'updated_at', bc.updated_at
            ) ORDER BY bc.kind) FILTER (WHERE bc.id IS NOT NULL), '[]') AS content
       FROM "book_chapters" c
       LEFT JOIN "book_content" bc ON bc.chapter_id = c.id
      WHERE c.book_id = $1::uuid
      GROUP BY c.id ORDER BY c.position`, bookId)
}

// Releasing a chapter is one decision, so it is one write. It does NOT touch the
// section switches: an admin who published notes and held the quiz back keeps that
// arrangement when the chapter goes live.
async function setChapterVisible(chapterId, visible) {
  const n = await db.$executeRawUnsafe(
    `UPDATE "book_chapters" SET visible = $2::boolean WHERE id = $1::uuid`,
    chapterId, !!visible)
  return n > 0
}

const chapterText = async (chapterId) => {
  const r = await db.$queryRawUnsafe(
    `SELECT c.id::text AS id, c.title, c.text, c.book_id::text AS book_id,
            b.class_level, s.name AS subject
       FROM "book_chapters" c JOIN "books" b ON b.id = c.book_id
       LEFT JOIN "subjects" s ON s.id = b.subject_id
      WHERE c.id = $1::uuid`, chapterId)
  return r[0] || null
}

const getContent = async (id) => {
  const r = await db.$queryRawUnsafe(
    `SELECT id::text AS id, chapter_id::text AS chapter_id, kind, title, payload, status, source, model, updated_at
       FROM "book_content" WHERE id = $1::uuid`, id)
  return r[0] || null
}

// ─── Writes ──────────────────────────────────────────────────────────────────

async function saveContent(chapterId, kind, { title, payload, source = 'ai', model = null }) {
  if (!KINDS.includes(kind)) throw new Error(`Unknown content kind: ${kind}`)
  const rows = await db.$queryRawUnsafe(
    `INSERT INTO "book_content" (chapter_id, kind, title, payload, source, model)
     VALUES ($1::uuid, $2, $3, $4::jsonb, $5, $6)
     ON CONFLICT (chapter_id, kind) DO UPDATE
       SET title = EXCLUDED.title, payload = EXCLUDED.payload,
           source = EXCLUDED.source, model = EXCLUDED.model,
           -- A regenerated piece returns to draft. Publishing is a decision about
           -- specific content, and this is no longer that content.
           status = 'draft', updated_at = now()
     RETURNING id::text AS id`,
    chapterId, kind, title || null, JSON.stringify(payload), source, model)
  return rows[0].id
}

const setContentStatus = (id, status) => db.$executeRawUnsafe(
  `UPDATE "book_content" SET status = $2, updated_at = now() WHERE id = $1::uuid`, id, status)

const setBookPublished = (id, published) => db.$executeRawUnsafe(
  `UPDATE "books" SET published = $2, updated_at = now() WHERE id = $1::uuid`, id, !!published)

const updateBook = (id, { title, subjectId, classLevel }) => db.$executeRawUnsafe(
  `UPDATE "books" SET title = COALESCE($2, title), subject_id = COALESCE($3::bigint, subject_id),
          class_level = COALESCE($4::int, class_level), updated_at = now()
    WHERE id = $1::uuid`, id, title || null, subjectId || null, classLevel || null)

const remove = (id) => db.$executeRawUnsafe(`DELETE FROM "books" WHERE id = $1::uuid`, id)

// ─── Student side ────────────────────────────────────────────────────────────

// Published books for a class. Subject is optional: a book filed under no subject
// is a general one and reaches the whole class.
const visibleBooks = (classLevel) => db.$queryRawUnsafe(
  `SELECT b.id::text AS id, b.title, s.name AS subject, b.page_count,
          (SELECT count(*) FROM "book_chapters" c WHERE c.book_id = b.id)::int AS chapters
     FROM "books" b LEFT JOIN "subjects" s ON s.id = b.subject_id
    WHERE b.published = true AND b.status = 'ready'
      AND (b.class_level IS NULL OR b.class_level = $1::int)
      AND EXISTS (SELECT 1 FROM "book_content" bc JOIN "book_chapters" c2 ON c2.id = bc.chapter_id
                   WHERE c2.book_id = b.id AND c2.visible = true AND bc.status = 'published')
    ORDER BY b.created_at DESC`, classLevel)

// Only chapters an admin has released AND that have something published — a chapter
// whose notes are still in draft is not worth a row a student can tap into an empty
// screen, and one nobody has released is not theirs to see yet.
//
// Ordered by what THIS student is weakest on. `book_chapter_concepts` says what a
// chapter teaches; `student_concepts.weakness` says how they are doing on it. A
// chapter covering a concept they keep getting wrong leads the list, and carries
// the concept's name so the screen can say why rather than silently reordering —
// an unexplained reshuffle reads as a bug, not as help.
//
// Everything is LEFT JOINed: a student with no history, or a book whose chapters
// were never linked, falls back to plain chapter order rather than vanishing.
const visibleChapters = (bookId, userId = null) => db.$queryRawUnsafe(
  `SELECT c.id::text AS id, c.position, c.title,
          array_agg(DISTINCT bc.kind) AS kinds,
          w.weakness, w.concept
     FROM "book_chapters" c
     JOIN "book_content" bc ON bc.chapter_id = c.id
     LEFT JOIN LATERAL (
       SELECT sc.weakness::float AS weakness, con.name AS concept
         FROM "book_chapter_concepts" bcc
         JOIN "concepts" con ON con.id = bcc.concept_id
         JOIN "student_concepts" sc
           ON sc.concept_id = bcc.concept_id AND sc."userId" = $2::uuid
        WHERE bcc.chapter_id = c.id AND sc.weakness IS NOT NULL
        ORDER BY sc.weakness DESC
        LIMIT 1
     ) w ON $2::uuid IS NOT NULL
    WHERE c.book_id = $1::uuid AND c.visible = true AND bc.status = 'published'
    GROUP BY c.id, w.weakness, w.concept
    ORDER BY w.weakness DESC NULLS LAST, c.position`, bookId, userId)

// The shelf, ordered the same way: a book holding the chapter a student is
// weakest on comes first. `weakest_concept` is what the card explains itself
// with. Same LEFT JOIN discipline — no history means plain recency order.
const visibleBooksFor = (classLevel, userId = null) => db.$queryRawUnsafe(
  `SELECT b.id::text AS id, b.title, s.name AS subject, b.page_count,
          (SELECT count(*) FROM "book_chapters" c WHERE c.book_id = b.id)::int AS chapters,
          w.weakness, w.concept AS weakest_concept
     FROM "books" b
     LEFT JOIN "subjects" s ON s.id = b.subject_id
     LEFT JOIN LATERAL (
       SELECT sc.weakness::float AS weakness, con.name AS concept
         FROM "book_chapters" c2
         JOIN "book_chapter_concepts" bcc ON bcc.chapter_id = c2.id
         JOIN "concepts" con ON con.id = bcc.concept_id
         JOIN "student_concepts" sc
           ON sc.concept_id = bcc.concept_id AND sc."userId" = $2::uuid
        WHERE c2.book_id = b.id AND c2.visible = true AND sc.weakness IS NOT NULL
        ORDER BY sc.weakness DESC
        LIMIT 1
     ) w ON $2::uuid IS NOT NULL
    WHERE b.published = true AND b.status = 'ready'
      AND (b.class_level IS NULL OR b.class_level = $1::int)
      AND EXISTS (SELECT 1 FROM "book_content" bc JOIN "book_chapters" c3 ON c3.id = bc.chapter_id
                   WHERE c3.book_id = b.id AND c3.visible = true AND bc.status = 'published')
    ORDER BY w.weakness DESC NULLS LAST, b.created_at DESC`, classLevel, userId)

// All three gates checked in one query. This is the only route by which a student
// reads generated content, so a gate missing here is a gate that does not exist.
const visibleContent = async (chapterId, kind) => {
  const r = await db.$queryRawUnsafe(
    `SELECT bc.id::text AS id, bc.kind, bc.title, bc.payload
       FROM "book_content" bc JOIN "book_chapters" c ON c.id = bc.chapter_id
       JOIN "books" b ON b.id = c.book_id
      WHERE bc.chapter_id = $1::uuid AND bc.kind = $2
        AND bc.status = 'published' AND c.visible = true AND b.published = true`, chapterId, kind)
  return r[0] || null
}

module.exports = {
  KINDS, MAX_PAGES, sha256, findByHash, ingest, detectChapters,
  list, chapters, chapterText, getContent,
  saveContent, setContentStatus, setBookPublished, setChapterVisible, updateBook, remove,
  visibleBooks, visibleBooksFor, visibleChapters, visibleContent,
}
