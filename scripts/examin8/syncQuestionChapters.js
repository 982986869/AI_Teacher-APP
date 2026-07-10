'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Make the app's question-resource chapter list (Important Questions / PYQ /
// Practice) match the website EXACTLY — count and membership.
//
// The website lists a resource's chapters from the PUBLIC endpoint
//   GET /v1/content/category/{subjectId}/type/0/content_name/{contentName}/
//        → { children:[{id,name}] }
// (NOT the plain category-children list, and NOT login-gated). This is the
// authoritative roster the website itself renders. The generic children list
// (chapters.json) is a DIFFERENT, incomplete set, which is why counts drifted:
//   • under-count — a roster chapter was never imported (came back empty w/o creds)
//   • over-count  — the DB kept a chapter that isn't in the current roster
//
// For every roster chapter this ensures a `sections(type_key=SECTION)` row exists
// (so the chapter shows), and PRUNES sections of that type whose chapter is no
// longer in the roster. Questions are left untouched — an empty section renders
// the honest "No questions for this chapter yet" until the real bank is fetched
// (with creds) by fetch/importClass10Questions.js, which fills the same section.
//
// No EXAMIN8 creds needed — only the public listing endpoint + the DB.
//
//   SECTION=important_questions node scripts/examin8/syncQuestionChapters.js            # DRY
//   SECTION=important_questions node scripts/examin8/syncQuestionChapters.js --live     # apply
//   ONLY=reasoning,ntse SECTION=important_questions node ... --live                      # subset
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const B = 'https://web.examin8.com/v1'
const DELAY = 150
const LIVE = process.argv.includes('--live')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const NORM = path.join(ROOT, 'data', 'examin8', CLASS_DIR, 'normalized')

const SECTION_META = {
  important_questions: { contentName: 'important-questions', label: 'Important Questions', position: 5 },
  pyq:                 { contentName: 'pyq',                 label: 'Previous Year Questions', position: 6 },
  practice:            { contentName: 'practice-topic-list', label: 'Practice Questions', position: 7 },
}
const SECTION = (process.env.SECTION || 'important_questions').toLowerCase()
if (!SECTION_META[SECTION]) { console.error(`SECTION must be: ${Object.keys(SECTION_META).join(', ')}`); process.exit(1) }
const { contentName, label: SECTION_LABEL, position: SECTION_POSITION } = SECTION_META[SECTION]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (v) => (v == null || v === '' ? null : Number(v))
// Byte-identical to the app's slugify (ResourcesScreen/PracticeScreen/…): if a
// name has any non-ASCII (Devanagari) char, append a stable hash so numeric- or
// marker-prefixed names ("1 विकास") stay unique instead of collapsing to "1".
const slugify = (s) => {
  const str = String(s).replace(/[–—­‑]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  const base = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base && !/[^\x00-\x7F]/.test(str)) return base
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  const hash = 'u' + h.toString(36)
  return base ? base + '-' + hash : hash
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8')
    .match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); x.searchParams.delete('sslmode'); u = x.toString() } catch (_) {}
  return u
}

async function api(url) {
  const headers = { accept: 'application/json', referer: 'https://web.examin8.com/' }
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

// The authoritative chapter roster for a subject's resource (public endpoint).
async function rosterChapters(subjectId) {
  const j = await api(`${B}/content/category/${subjectId}/type/0/content_name/${contentName}/`)
  const children = (j && (j.children || j.results)) || []
  return children
    .map((c, i) => ({ category_id: num(c.id), name: trim(c.name), slug: slugify(c.name), position: i }))
    .filter((c) => c.category_id && c.name)
}

async function main() {
  const subjects = JSON.parse(fs.readFileSync(path.join(NORM, 'subjects.json'), 'utf8'))
  const ONLY = (process.env.ONLY || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean)
  const targets = (ONLY.length
    ? subjects.filter((s) => ONLY.some((t) => String(s.name).toLowerCase().includes(t) || String(s.slug).includes(t)))
    : subjects
  ).filter((s) => s.is_subject !== false)

  console.log(`\nSync ${SECTION} chapters to website roster — ${CLASS_DIR}${ONLY.length ? ` (ONLY: ${ONLY.join(',')})` : ''}`)

  // Fetch each subject's roster first (read-only) so DRY RUN shows the plan.
  const plan = []
  for (const s of targets) {
    let chapters
    try { chapters = await rosterChapters(s.category_id) } catch (e) { console.log(`  ! ${s.name}: listing failed (${e.message})`); continue }
    if (!chapters.length) continue
    plan.push({ subject: s, chapters })
    console.log(`  • ${s.name}: ${chapters.length} chapters in ${contentName} roster`)
    await sleep(DELAY)
  }
  if (!LIVE) { console.log('\n[DRY] add --live to write to the DB.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')

  const stat = { listed: 0, sectionsNew: 0, pruned: 0, prunedQ: 0, errors: [] }
  try {
    await client.query(
      `insert into section_types (key, label, position) values ($1,$2,$3) on conflict (key) do nothing`,
      [SECTION, SECTION_LABEL, SECTION_POSITION])

    for (const { subject: s, chapters } of plan) {
      const classLevel = Number(s.class_level) || 10
      const sub = await client.query(
        `insert into subjects (name, slug) values ($1,$2)
         on conflict (slug) do update set name = excluded.name returning id`,
        [s.name, s.slug])
      const subjectId = sub.rows[0].id
      const rosterSlugs = new Set()

      for (const ch of chapters) {
        stat.listed++
        try {
          rosterSlugs.add(ch.slug)
          const chp = await client.query(
            `insert into chapters (subject_id, name, slug, class_level, position)
             values ($1,$2,$3,$4,$5)
             on conflict (subject_id, class_level, slug)
             do update set name = excluded.name, position = excluded.position returning id`,
            [subjectId, ch.name, ch.slug, classLevel, ch.position])
          const chapterId = chp.rows[0].id

          const sec = await client.query(
            `insert into sections (chapter_id, type_key, position) values ($1,$2,$3)
             on conflict (chapter_id, type_key) do update set position = excluded.position
             returning (xmax = 0) as inserted`,
            [chapterId, SECTION, SECTION_POSITION])
          if (sec.rows[0].inserted) stat.sectionsNew++
        } catch (e) { stat.errors.push(`${s.name} / ${ch.name}: ${e.message}`) }
      }

      // Prune: any section of this type whose chapter is NOT in the current
      // roster is stale (the over-count) — drop its questions then the section.
      // Guarded by a non-empty roster above, so a fetch hiccup never prunes.
      const stale = await client.query(
        `select se.id sec_id, ch.slug, ch.name from sections se
           join chapters ch on ch.id = se.chapter_id
          where ch.subject_id = $1 and ch.class_level = $2 and se.type_key = $3`,
        [subjectId, classLevel, SECTION])
      for (const row of stale.rows) {
        if (rosterSlugs.has(row.slug)) continue
        const dq = await client.query('delete from questions where section_id = $1', [row.sec_id])
        await client.query('delete from sections where id = $1', [row.sec_id])
        stat.pruned++; stat.prunedQ += dq.rowCount
        console.log(`    − pruned stale ${s.name} / ${row.name} (${dq.rowCount} q)`)
      }
    }

    // Verify: chapters that now resolve for this resource's list, per subject.
    console.log(`\n── VERIFY (getChapters ${SECTION}) ─`)
    for (const { subject: s, chapters } of plan) {
      const v = await client.query(
        `select count(*)::int n from chapters ch join subjects su on su.id = ch.subject_id
          where su.slug = $1 and ch.class_level = $2
            and exists (select 1 from sections se where se.chapter_id = ch.id and se.type_key = $3)`,
        [s.slug, Number(s.class_level) || 10, SECTION])
      const ok = v.rows[0].n === chapters.length
      console.log(`  ${ok ? '✓' : '✗'} ${s.name}: ${v.rows[0].n} in app / ${chapters.length} on site`)
    }
  } finally { await client.end() }

  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Chapters in roster  : ${stat.listed}`)
  console.log(`  New sections created: ${stat.sectionsNew}`)
  console.log(`  Stale sections pruned: ${stat.pruned} (${stat.prunedQ} questions)`)
  console.log(`  Errors              : ${stat.errors.length}`)
  stat.errors.slice(0, 20).forEach((e) => console.log(`     ! ${e}`))
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
