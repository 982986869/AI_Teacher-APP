'use strict'

// What a book chapter actually teaches, in the vocabulary the rest of the app
// already reasons about: `concepts`, and through them `student_concepts`,
// `concept_prereqs` and the mastery loop.
//
// Matched by EMBEDDING, not by asking a model to list concept names. The catalog
// already carries a vector per concept, so the nearest neighbours of the chapter
// text are the concepts it covers — deterministic, one cheap call, and every
// result is a real row. A model asked to name concepts returns plausible strings
// that match nothing in the table, and then the fuzzy-matching becomes the bug.

const db = require('../config/database')
const { getEmbeddingProvider } = require('../providers/embeddings')

// How close a concept has to be before we claim the chapter teaches it.
//
// MEASURED, not guessed. Embedded probes against this catalog:
//
//   a photosynthesis passage  -> 0.853  Photosynthesis       (clearly on topic)
//   a quadratics passage      -> 0.679  Quadratic Equation   (genuinely on topic)
//   an HR policy document     -> 0.532  "Function"           (nothing to do with it)
//
// Cosine similarity has a high floor here, so everything scores something. A
// threshold below ~0.55 therefore links unrelated text with confidence — an
// earlier 0.45 would have told a student "because you struggled with Function"
// about an HR contract. 0.58 sits above that noise and below real content.
const MIN_SIMILARITY = 0.58

// Relative gate on top of the absolute one: a concept has to be in the same
// league as the chapter's best match, not merely over the bar. Without this a
// chapter collects a tail of near-threshold links that dilute what it is "about".
const SIMILARITY_MARGIN = 0.05

// More than this and "what this chapter covers" stops being a useful signal —
// a chapter matching twenty concepts matches nothing in particular.
const MAX_LINKS = 5

// Enough text to characterise the chapter without paying to embed a whole
// textbook. The opening pages carry the subject matter; later pages are usually
// worked examples of the same thing.
const EMBED_CHARS = 4000

/**
 * Nearest catalog concepts to a vector.
 *
 * Subject is a filter when the book has one and a no-op when it does not: an
 * uploaded PDF often has no subject assigned, and refusing to link in that case
 * would silently disable personalisation for exactly the books that are most
 * ad-hoc. Cross-subject matches are then possible, which is what MIN_SIMILARITY
 * is there to catch.
 */
async function nearest(vec, subject, limit) {
  const lit = Array.isArray(vec) ? `[${vec.join(',')}]` : vec
  const k = Math.min(20, Math.max(1, limit || MAX_LINKS))
  if (subject) {
    return db.$queryRawUnsafe(
      `SELECT id::text AS id, name, 1 - (embedding <=> $1::vector) AS sim
         FROM concepts WHERE subject = $2 AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector LIMIT ${k}`, lit, subject)
  }
  return db.$queryRawUnsafe(
    `SELECT id::text AS id, name, 1 - (embedding <=> $1::vector) AS sim
       FROM concepts WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector LIMIT ${k}`, lit)
}

/**
 * Link one chapter to the concepts it covers. Idempotent and safe to call on
 * every generation: it returns early once a chapter has links, so the embedding
 * is paid for once rather than on every regenerate.
 *
 * Never throws. Concept linking is an enhancement — a book that fails to link
 * still generates, still publishes and still reads. Breaking the upload because
 * the embedding API had a bad minute would be a poor trade.
 */
async function linkChapter(chapterId, { force = false } = {}) {
  try {
    if (!force) {
      const [had] = await db.$queryRawUnsafe(
        `SELECT 1 AS x FROM book_chapter_concepts WHERE chapter_id = $1::uuid LIMIT 1`, chapterId)
      if (had) return { skipped: true, reason: 'already linked' }
    }

    const [ch] = await db.$queryRawUnsafe(
      `SELECT c.title, c.text, s.name AS subject
         FROM book_chapters c
         JOIN books b ON b.id = c.book_id
         LEFT JOIN subjects s ON s.id = b.subject_id
        WHERE c.id = $1::uuid`, chapterId)
    if (!ch) return { skipped: true, reason: 'chapter not found' }

    const body = `${ch.title || ''}\n\n${String(ch.text || '').slice(0, EMBED_CHARS)}`.trim()
    if (body.length < 120) return { skipped: true, reason: 'too little text' }

    const vec = await getEmbeddingProvider().embedQuery(body)
    // Over-fetch, because deduplication below removes rows: the catalog holds
    // 1429 concepts for 1347 distinct names ("Displacement" appears four times),
    // and without this a chapter's links could be the same concept repeated.
    const rows = await nearest(vec, ch.subject, MAX_LINKS * 4)
    if (!rows.length) return { linked: 0, considered: 0 }

    const top = Number(rows[0].sim)
    if (top < MIN_SIMILARITY) {
      // Nothing in the catalog genuinely covers this chapter. Linking the nearest
      // row anyway is how a student gets told they struggled with a concept the
      // chapter never mentions, so link nothing instead.
      return { linked: 0, considered: rows.length, bestRejected: top }
    }

    const seen = new Set()
    const keep = []
    for (const r of rows) {
      const sim = Number(r.sim)
      if (sim < MIN_SIMILARITY || sim < top - SIMILARITY_MARGIN) break // rows are sorted
      const key = String(r.name).trim().toLowerCase()
      if (seen.has(key)) continue   // keep the highest-scoring row per name
      seen.add(key)
      keep.push(r)
      if (keep.length >= MAX_LINKS) break
    }
    if (!keep.length) return { linked: 0, considered: rows.length }

    if (force) {
      await db.$executeRawUnsafe(`DELETE FROM book_chapter_concepts WHERE chapter_id = $1::uuid`, chapterId)
    }
    for (const r of keep) {
      await db.$executeRawUnsafe(
        `INSERT INTO book_chapter_concepts (chapter_id, concept_id, similarity)
         VALUES ($1::uuid, $2::uuid, $3::real)
         ON CONFLICT (chapter_id, concept_id) DO UPDATE SET similarity = EXCLUDED.similarity`,
        chapterId, r.id, Number(r.sim))
    }
    return { linked: keep.length, considered: rows.length, top: keep[0] && keep[0].name }
  } catch (err) {
    // Logged, not thrown — see the note above.
    console.error('[bookConcepts] linkChapter failed:', err && err.message)
    return { error: String(err && err.message) }
  }
}

/** Link every chapter of a book. Used after an upload finishes extracting. */
async function linkBook(bookId, opts) {
  const chapters = await db.$queryRawUnsafe(
    `SELECT id::text AS id FROM book_chapters WHERE book_id = $1::uuid ORDER BY position`, bookId)
  const out = []
  for (const c of chapters) out.push(await linkChapter(c.id, opts))
  return out
}

/** What a chapter was matched to — for the admin, so the links are inspectable. */
const chapterConcepts = (chapterId) => db.$queryRawUnsafe(
  `SELECT c.id::text AS id, c.name, c.subject, bcc.similarity
     FROM book_chapter_concepts bcc JOIN concepts c ON c.id = bcc.concept_id
    WHERE bcc.chapter_id = $1::uuid
    ORDER BY bcc.similarity DESC`, chapterId)

module.exports = { linkChapter, linkBook, chapterConcepts, MIN_SIMILARITY, MAX_LINKS }
