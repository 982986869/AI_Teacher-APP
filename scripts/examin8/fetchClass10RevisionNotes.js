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
// Byte-identical to the client slugify so DB chapter slugs match API lookups.
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base) return base
  let h = 5381; const str = String(s)
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  return 'u' + h.toString(36)
}

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

// The flash-card chapter list — what the website's "Revision Notes" tab actually
// shows — comes from this content_name endpoint, NOT the plain category children.
// It can include chapters missing from /content/category/{id}/ (e.g. AI's 27217
// "Advance Concepts of Modeling in AI"). This endpoint is public (no auth needed).
async function fetchFlashCardChapters(subjectId) {
  const p = path.join(RAW, `subject-${subjectId}-flashcard-chapters.json`)
  let json
  if (!FORCE && fs.existsSync(p)) {
    try { json = JSON.parse(fs.readFileSync(p, 'utf8')) } catch (_) { /* refetch */ }
  }
  if (!json) {
    try { json = await api(`${B}/content/category/${subjectId}/type/0/content_name/flash-card/`) }
    catch (e) { return null }
    fs.writeFileSync(p, JSON.stringify(json, null, 2))
    await sleep(DELAY)
  }
  const children = (json && (json.children || json.results)) || []
  return children
    .map((c, i) => ({ category_id: num(c.id), name: trim(c.name), slug: slugify(c.name), position: i }))
    .filter((c) => c.category_id && c.name)
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
  let bySubject = JSON.parse(fs.readFileSync(chaptersPath, 'utf8'))
  // ONLY=<substr> re-fetches just the matching subject(s), e.g. ONLY=artificial.
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  if (ONLY.length) bySubject = bySubject.filter((s) => ONLY.some((t) => String(s.subject).toLowerCase().includes(t) || String(s.slug).includes(t)))
  console.log(`\nRevision Notes fetch — ${CLASS_DIR}${FORCE ? ' (force)' : ''}${ONLY.length ? ` (ONLY: ${ONLY.join(',')})` : ''}`)
  // The flash_cards endpoint is login-gated; without creds every card call 403s and
  // we'd overwrite a good revision-notes.json with empty data. Refuse to proceed.
  if (!COOKIE || !CSRF) {
    console.error('  ✗ EXAMIN8_COOKIE and EXAMIN8_CSRF are required (the flash_card endpoint 403s without a session).')
    console.error('    Run: EXAMIN8_COOKIE=\'…\' EXAMIN8_CSRF=\'…\' node scripts/examin8/fetchClass10RevisionNotes.js --force')
    process.exit(1)
  }

  const out = []
  for (const s of bySubject) {
    const chaptersOut = []
    // Source the chapter list from the flash-card listing (matches the website),
    // falling back to the metadata category children only if that returns nothing.
    let chapters = await fetchFlashCardChapters(s.subject_category_id)
    const fromListing = !!(chapters && chapters.length)
    if (!fromListing) chapters = (s.chapters || []).map((c) => ({ category_id: c.category_id, name: c.name, slug: c.slug, position: c.position || 0 }))

    for (const ch of chapters) {
      if (!ch.category_id) continue
      log.chaptersScanned += 1
      let json
      try { json = await fetchChapter(ch.category_id) }
      catch (e) { if (e.forbidden) log.forbidden += 1; log.errors.push(`ch ${ch.category_id} (${ch.name}): ${e.message}`); continue }
      const topics = normalizeTopics(json && json.flash_cards)
      if (!topics.length) {
        log.empty += 1
        // A chapter that IS in the flash-card listing but returns 0 cards is worth
        // surfacing (stale/paginated/transient) — don't silently drop it.
        if (fromListing) log.errors.push(`empty cards: ${s.subject} / ${ch.name} (${ch.category_id})`)
        continue
      }
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
      console.log(`  • ${s.subject}: ${chaptersOut.length} chapters with notes (${fromListing ? 'flash-card listing' : 'metadata fallback'})`)
    }
  }

  // Merge into any existing revision-notes.json by subject_slug so a partial run
  // (e.g. ONLY=artificial) refreshes just those subjects without dropping the rest.
  const outPath = path.join(NORM, 'revision-notes.json')
  let merged = out
  try {
    const prev = JSON.parse(fs.readFileSync(outPath, 'utf8'))
    if (Array.isArray(prev)) {
      const bySlug = new Map(prev.map((s) => [s.subject_slug, s]))
      for (const s of out) bySlug.set(s.subject_slug, s) // fetched subjects win
      merged = Array.from(bySlug.values())
    }
  } catch (_) { /* no prior file — write fresh */ }
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2))
  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Chapters scanned    : ${log.chaptersScanned}`)
  console.log(`  Chapters with notes : ${log.chaptersWithNotes}`)
  console.log(`  Empty (no notes)    : ${log.empty}`)
  console.log(`  Topics found        : ${log.topics}`)
  console.log(`  Cards               : ${log.cards}`)
  console.log(`  Errors              : ${log.errors.length}${log.forbidden ? ` (403 login-gated: ${log.forbidden})` : ''}`)
  log.errors.slice(0, 8).forEach((e) => console.log(`     ! ${e}`))
  if (log.errors.length > 8) console.log(`     … +${log.errors.length - 8} more`)
  console.log(`\n  ✓ normalized/revision-notes.json (${merged.length} subjects; ${out.length} refreshed this run)`)
  console.log(`  Raw: data/examin8/${CLASS_DIR}/raw/revision-notes/`)
  console.log(`  Next: node scripts/examin8/importClass10RevisionNotes.js --live`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
