'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Fetch Class 6 "Revision Notes" (flash cards) from examin8. Unlike the textbook
// API, the flashcard chapter list is STUDENT-accessible, so we auto-enumerate all
// chapters from the resource (category) id — no per-chapter URLs needed.
//
// API (from the examin8 web bundle):
//   GET /v1/content/category/:categoryId/type/0/content_name/flash-card/
//        -> { name, has_subscription, children:[{ id, name, is_free_subject }] }
//   GET /v1/flash_card/flash_cards/:chapterId/
//        -> { category_name, count, flash_cards:[{ topic_name, cards:[{ text, answer,
//             flashcard_type, order }] }] }
//   NOTE: the API returns cards even for is_free_subject=false chapters — the paywall
//   is enforced only in examin8's own UI, not the API.
//
// Config via env:
//   RESOURCE_ID = 23200 (Science Curiosity) | 23228 (English Poorvi) …   [required]
//   SUBJECT_SLUG = science-curiosity | english-poorvi …                   [required]
//   ONLY_CH = 1   (optional: fetch just this chapter number)
//
//   EXAMIN8_COOKIE=… EXAMIN8_CSRF=… RESOURCE_ID=23228 SUBJECT_SLUG=english-poorvi \
//     node scripts/fetchClass6Flashcards.js
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF
const RESOURCE_ID = process.env.RESOURCE_ID
const SUBJECT_SLUG = process.env.SUBJECT_SLUG
const ONLY_CH = process.env.ONLY_CH ? parseInt(process.env.ONLY_CH, 10) : null
const B = 'https://web.examin8.com/v1'
const DELAY_MS = 200

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()

async function api(url) {
  const r = await fetch(url, {
    headers: { accept: 'application/json', 'x-csrftoken': CSRF, referer: 'https://web.examin8.com/', cookie: COOKIE },
  })
  if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url)
  return r.json()
}

async function main() {
  if (!COOKIE || !CSRF) { console.error('Set EXAMIN8_COOKIE and EXAMIN8_CSRF.'); process.exit(1) }
  if (!RESOURCE_ID || !SUBJECT_SLUG) { console.error('Set RESOURCE_ID and SUBJECT_SLUG.'); process.exit(1) }

  const list = await api(`${B}/content/category/${RESOURCE_ID}/type/0/content_name/flash-card/`)
  const subjectName = trim(list.name)
  const chapters = list.children || []
  console.log(`\n${subjectName}  (resource ${RESOURCE_ID}, has_subscription=${list.has_subscription}) — ${chapters.length} chapters`)

  const outDir = path.join(ROOT, 'src', 'data', 'class6Flashcards', SUBJECT_SLUG)
  fs.mkdirSync(outDir, { recursive: true })

  let n = 0, grand = 0
  for (const ch of chapters) {
    n++
    if (ONLY_CH && n !== ONLY_CH) continue
    try {
      const fc = await api(`${B}/flash_card/flash_cards/${ch.id}/`)
      // Flatten topics → cards, keeping the topic grouping.
      const topics = (fc.flash_cards || []).map((t) => ({
        topic: trim(t.topic_name),
        cards: (t.cards || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((c) => ({
          type: c.flashcard_type,
          text: trim(c.text),
          answer: trim(c.answer),
        })),
      }))
      const cardCount = topics.reduce((a, t) => a + t.cards.length, 0)
      const file = path.join(outDir, 'ch' + String(n).padStart(2, '0') + '.json')
      fs.writeFileSync(file, JSON.stringify({ chapter: trim(ch.name), chapterId: ch.id, isFree: ch.is_free_subject, topics }))
      grand += cardCount
      console.log(`  ch${String(n).padStart(2, '0')}  ${trim(ch.name).padEnd(38)} ${topics.length} topics, ${cardCount} cards  ${ch.is_free_subject ? '' : '(paywalled in UI)'}`)
    } catch (e) {
      console.log(`  ch${String(n).padStart(2, '0')}  ${trim(ch.name)}  FAILED: ${e.message}`)
    }
    await sleep(DELAY_MS)
  }
  console.log(`\nDone: ${grand} cards -> src/data/class6Flashcards/${SUBJECT_SLUG}/`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
