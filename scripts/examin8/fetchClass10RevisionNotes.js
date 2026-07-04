'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Phase 2A — Examin8 Revision Notes extractor (DRY-RUN / read-only; no DB writes).
//
// The website's "Revision Notes" chapter content is served by the flash_card API:
//   GET /v1/flash_card/flash_cards/{chapterCategoryId}/
//     → { flash_cards:[ { topic_id, topic_name, cards:[{id,flashcard_type,text,answer,order}] } ], count, category_name }
//
// This endpoint is SESSION-GATED (returns 403 without a login). Provide a browser
// session via EXAMIN8_COOKIE + EXAMIN8_CSRF (same as scripts/buildClass7.js).
//
// Input : data/examin8/class{N}/normalized/chapters.json
// Output: data/examin8/class{N}/raw/revision-notes/chapter-{id}.json  (verbatim)
//         data/examin8/class{N}/normalized/revision-notes.json         (app-shaped)
//
// Math/HTML is preserved EXACTLY — {tex}…{/tex} and <span class="math-tex"> are
// never stripped or altered.
//
// Resume: a chapter whose raw file already exists is not re-fetched (unless --force).
//
//   EXAMIN8_COOKIE='…' EXAMIN8_CSRF='…' node scripts/examin8/fetchClass10RevisionNotes.js
//   CLASS_DIR=class10 EXAMIN8_COOKIE='…' EXAMIN8_CSRF='…' node scripts/examin8/fetchClass10RevisionNotes.js --force
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const B = 'https://web.examin8.com/v1'
const DELAY = 130
const FORCE = process.argv.includes('--force')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const OUT = path.join(ROOT, 'data', 'examin8', CLASS_DIR)
const RAW = path.join(OUT, 'raw', 'revision-notes')
const NORM = path.join(OUT, 'normalized')

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// trim() only strips outer whitespace — inner HTML/math ({tex}, <span class="math-tex">) is untouched.
const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (v) => (v == null || v === '' ? null : Number(v))

const log = { chaptersScanned: 0, chaptersWithNotes: 0, topics: 0, cards: 0, empty: 0, forbidden: 0, errors: [] }

async function api(url) {
  const headers = { accept: 'application/json', referer: 'https://web.examin8.com/' }
  if (CSRF) headers['x-csrftoken'] = CSRF
  if (COOKIE) headers.cookie = COOKIE
  const r = await fetch(url, { headers })
  if (r.status === 403) { const e = new Error('HTTP 403 (login required — set EXAMIN8_COOKIE/EXAMIN8_CSRF)'); e.forbidden = true; throw e }
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

// Fetch + cache one chapter's revision notes. Resume: reuse cached raw unless --force.
async function fetchChapter(chapterId) {
  const p = path.join(RAW, `chapter-${chapterId}.json`)
  if (!FORCE && fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch (_) { /* refetch */ }
  }
  const json = await api(`${B}/flash_card/flash_cards/${chapterId}/`)
  fs.writeFileSync(p, JSON.stringify(json, null, 2))
  await sleep(DELAY)
  return json
}

// Normalize topics, preserving card text/answer HTML+math verbatim.
function normalizeTopics(flashCards) {
  return (Array.isArray(flashCards) ? flashCards : []).map((t) => ({
    topic_id: num(t.topic_id),
    topic_name: trim(t.topic_name),
    cards: (Array.isArray(t.cards) ? t.cards : [])
      .map((c) => ({
        id: num(c.id),
        flashcard_type: num(c.flashcard_type),
        text: trim(c.text),      // HTML/math kept as-is
        answer: trim(c.answer),  // HTML/math kept as-is
        order: num(c.order),
      }))
      .filter((c) => c.text || c.answer)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
  })).filter((t) => t.cards.length)
}

async function main() {
  fs.mkdirSync(RAW, { recursive: true })
  const chaptersPath = path.join(NORM, 'chapters.json')
  if (!fs.existsSync(chaptersPath)) {
    console.error(`Missing ${chaptersPath}. Run fetchClass10Metadata.js first.`); process.exit(1)
  }
  const bySubject = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'))
  console.log(`\nRevision Notes fetch — ${CLASS_DIR}${FORCE ? ' (force)' : ''}`)
  if (!COOKIE || !CSRF) console.log('  ⚠ EXAMIN8_COOKIE/EXAMIN8_CSRF not set — the endpoint will 403.')

  const out = []
  for (const s of bySubject) {
    const chaptersOut = []
    for (const ch of (s.chapters || [])) {
      if (!ch.category_id) continue
      log.chaptersScanned += 1
      let json
      try { json = await fetchChapter(ch.category_id) }
      catch (e) { if (e.forbidden) log.forbidden += 1; log.errors.push(`ch ${ch.category_id} (${ch.name}): ${e.message}`); continue }
      const topics = normalizeTopics(json && json.flash_cards)
      if (!topics.length) { log.empty += 1; continue }
      const cards = topics.reduce((n, t) => n + t.cards.length, 0)
      log.chaptersWithNotes += 1; log.topics += topics.length; log.cards += cards
      chaptersOut.push({
        chapter_category_id: ch.category_id,
        chapter: ch.name,
        chapter_slug: ch.slug,
        position: ch.position || 0,
        category_name: trim(json && json.category_name) || ch.name,
        topics,
        card_count: cards,
      })
    }
    if (chaptersOut.length) {
      out.push({ subject: s.subject, subject_category_id: s.subject_category_id, subject_slug: s.slug, chapters: chaptersOut })
      console.log(`  • ${s.subject}: ${chaptersOut.length} chapters with notes`)
    }
  }

  fs.writeFileSync(path.join(NORM, 'revision-notes.json'), JSON.stringify(out, null, 2))
  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Chapters scanned    : ${log.chaptersScanned}`)
  console.log(`  Chapters with notes : ${log.chaptersWithNotes}`)
  console.log(`  Empty (no notes)    : ${log.empty}`)
  console.log(`  Topics found        : ${log.topics}`)
  console.log(`  Cards               : ${log.cards}`)
  console.log(`  Errors              : ${log.errors.length}${log.forbidden ? ` (403 login-gated: ${log.forbidden})` : ''}`)
  log.errors.slice(0, 8).forEach((e) => console.log(`     ! ${e}`))
  if (log.errors.length > 8) console.log(`     … +${log.errors.length - 8} more`)
  console.log(`\n  ✓ normalized/revision-notes.json (${out.length} subjects)`)
  console.log(`  Raw: data/examin8/${CLASS_DIR}/raw/revision-notes/`)
  console.log(`  Next: node scripts/examin8/importClass10RevisionNotes.js --live`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
