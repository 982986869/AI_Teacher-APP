'use strict'
// Asks Claude to confirm which heading candidates are the chapter's real numbered
// sections (and which are subsections / formula lines / exercise numbers), then slices
// the raw text with outlineLib and writes the committed chNN.json.
//
//   node scripts/textbooks/outline.js --book jemh1 [--chapter 7] [--force]
//
// Model: TEXTBOOK_OUTLINE_MODEL (default claude-sonnet-5-5). ~3–6k input tokens per
// chapter, a few hundred out — a few rupees per chapter, one time.
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') })
const fs = require('fs')
const Anthropic = require('@anthropic-ai/sdk')
const lib = require('./lib')
const { sliceChapter } = require('./outlineLib')

const MODEL = process.env.TEXTBOOK_OUTLINE_MODEL || 'claude-sonnet-5-5'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM = `You verify the section outline of one NCERT textbook chapter from PDF-extracted lines.
You are given numbered heading CANDIDATES (page, line, text, bold, font size, and the two lines that follow) and END MARKERS (Summary / What you have learnt / Exercises / in-text EXERCISE N.N / QUESTIONS boxes).
Return ONLY a JSON object:
{
  "title": string,                                        // the chapter's FULL title as printed on its first page (see FIRST PAGE: the extracted title may be cut short, glued to the chapter number, or polluted by a decorative glyph), Title Case
  "topics":      [{ "number": "N.N",   "title": string, "page": int, "line": int }],   // the real top-level sections, in order
  "subsections": [{ "number": "N.N.M", "title": string, "page": int, "line": int }],   // real sub-sections (kept separate so question blocks can be cut up to them)
  "bodyEnd": { "page": int, "line": int } | null          // the FIRST end-of-chapter marker: "Summary" / "N.N Summary" / "What you have learnt" / "Exercises" — NOT an in-text "EXERCISE N.N" or "QUESTIONS". It always comes AFTER the last section starts; null when the chapter has no such marker (a closing "Conclusion" section is a topic, not the end)
}
Rules: a candidate is a section only if its text is a heading (a number followed by a title in words), NOT a formula, a measurement ("1.2 g cm-3"), or an exercise question ("1.14 The unit of length ..."). A numbered "N.N Summary" is the bodyEnd, not a topic. Use page/line EXACTLY as given. Titles: convert ALL CAPS to Title Case, keep question marks, drop trailing punctuation otherwise. Every real section N.N in the chapter must appear once.`

function candidateBlock(raw) {
  const flat = []
  for (const p of raw.pages) p.lines.forEach((ln, li) => flat.push({ page: p.index, line: li, text: ln.text }))
  const ctx = (c) => {
    const i = flat.findIndex((x) => x.page === c.page && x.line === c.line)
    return flat.slice(i + 1, i + 3).map((x) => x.text).join(' ').slice(0, 120)
  }
  const cands = raw.headingCandidates.map((c) => `p${c.page} l${c.line} ${c.bold ? 'BOLD' : 'reg '} ${c.size} | ${c.text} || next: ${ctx(c)}`)
  const ends = raw.endMarkers.map((e) => `p${e.page} l${e.line} | ${e.text}`)
  const first = (raw.firstPage || []).map((l) => `${l.size} | ${l.text}`)
  return `CHAPTER ${raw.chapterNumber} (extracted title: "${raw.chapterTitle}", ${raw.pageCount} pages)\n\nFIRST PAGE (font size | text):\n${first.join('\n')}\n\nCANDIDATES:\n${cands.join('\n')}\n\nEND MARKERS:\n${ends.join('\n')}`
}

async function verifyOutline(raw) {
  const msg = await client.messages.create({
    model: MODEL, max_tokens: 4000, system: SYSTEM,
    messages: [{ role: 'user', content: candidateBlock(raw) }],
  })
  const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  const start = text.indexOf('{'); const stop = text.lastIndexOf('}')
  if (start < 0 || stop < 0) throw new Error(`no JSON in outline response: ${text.slice(0, 200)}`)
  return JSON.parse(text.slice(start, stop + 1))
}

;(async () => {
  const args = lib.parseArgs()
  const books = lib.loadManifest().filter((b) => !args.book || b.code === args.book)
  const review = []
  const failed = []
  for (const b of books) {
    for (let n = 1; n <= b.chapters; n++) {
      if (args.chapter && n !== args.chapter) continue
      const outPath = lib.chapterJsonPath(b.code, n, b.classLevel)
      if (fs.existsSync(outPath) && !args.force) { console.log(`skip ${b.code} ch${lib.pad2(n)} (exists)`); continue }
      const raw = JSON.parse(fs.readFileSync(lib.rawJsonPath(b.code, n, b.classLevel), 'utf8'))
      let outline = null
      try {
        outline = await verifyOutline(raw)
        const ch = sliceChapter(raw, outline)
        const json = { code: b.code, classLevel: b.classLevel, chapterNumber: raw.chapterNumber, title: ch.title, slug: ch.slug, pageCount: raw.pageCount, sourceUrl: lib.pdfUrl(b.code, n), topics: ch.topics }
        fs.writeFileSync(outPath, JSON.stringify(json, null, 1) + '\n', 'utf8')
        review.push(`\n${b.code} ch${lib.pad2(n)} ${ch.title}`)
        for (const t of ch.topics) review.push(`   ${t.number.padEnd(6)} ${t.title.padEnd(60).slice(0, 60)} ${String(t.charCount).padStart(6)} chars`)
        console.log(`ok   ${b.code} ch${lib.pad2(n)} ${ch.title} — ${ch.topics.length} topics`)
      } catch (e) {
        failed.push(`${b.code} ch${lib.pad2(n)}: ${e.message}`)
        console.log(`FAIL ${b.code} ch${lib.pad2(n)}: ${e.message}`)
        if (outline) console.log(`     outline was: ${JSON.stringify(outline)}`)
      }
    }
  }
  console.log('\n=== REVIEW TABLE (read every line against the book\'s contents page) ===' + review.join('\n'))
  if (failed.length) { console.log('\nFAILED:\n' + failed.join('\n')); process.exit(1) }
})().catch((e) => { console.error('OUTLINE ERROR:', e.message); process.exit(1) })
