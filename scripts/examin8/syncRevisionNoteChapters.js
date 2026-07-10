'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Make the app's Revision-Notes chapter list match the website EXACTLY.
//
// The website's Revision Notes tab lists the chapters from the PUBLIC endpoint
//   GET /v1/content/category/{subjectId}/type/0/content_name/flash-card/  → {children:[{id,name}]}
// (this is NOT the plain category-children list, and is not login-gated).
//
// For every listed chapter this ensures a `sections(type_key='revision_notes')`
// row exists (so the chapter shows in the list), WITHOUT touching chapters that
// already have real notes. Chapters that don't have notes yet get a safe
// placeholder note ("Content coming soon") so tapping them isn't blank; when the
// real cards are later fetched, importClass10RevisionNotes.js (DO UPDATE) replaces
// the placeholder with the real content.
//
// No EXAMIN8 creds needed — only the public listing endpoint + the DB.
// Generic: reads subjects from normalized/subjects.json; filter with ONLY=<substr>.
//
//   node scripts/examin8/syncRevisionNoteChapters.js               # DRY RUN
//   ONLY=artificial node scripts/examin8/syncRevisionNoteChapters.js --live
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const B = 'https://web.examin8.com/v1'
const DELAY = 150
const LIVE = process.argv.includes('--live')
const CLASS_DIR = process.env.CLASS_DIR || 'class10'
const NORM = path.join(ROOT, 'data', 'examin8', CLASS_DIR, 'normalized')
const TYPE_KEY = 'revision_notes'
const SECTION_POSITION = 3
const PLACEHOLDER = [{ title: 'Revision Notes', html: '<p style="text-align:center;color:#8a8f9c;">Content coming soon.</p>' }]

const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (v) => (v == null || v === '' ? null : Number(v))
// Byte-identical to the app's slugify: if a name has any non-ASCII (Devanagari)
// char, append a stable hash so numeric-/marker-prefixed names ("1 विकास") stay
// unique instead of collapsing to "1".
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
  if (CSRF) headers['x-csrftoken'] = CSRF
  if (COOKIE) headers.cookie = COOKIE
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}

// The authoritative Revision-Notes chapter list for a subject (public endpoint).
async function flashCardChapters(subjectId) {
  const j = await api(`${B}/content/category/${subjectId}/type/0/content_name/flash-card/`)
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

  console.log(`\nSync Revision-Notes chapters to website listing — ${CLASS_DIR}${ONLY.length ? ` (ONLY: ${ONLY.join(',')})` : ''}`)

  // Fetch the listing for each subject first (read-only), so DRY RUN shows the plan.
  const plan = []
  for (const s of targets) {
    let chapters
    try { chapters = await flashCardChapters(s.category_id) } catch (e) { console.log(`  ! ${s.name}: listing failed (${e.message})`); continue }
    if (!chapters.length) continue
    plan.push({ subject: s, chapters })
    console.log(`  • ${s.name}: ${chapters.length} chapters in flash-card listing`)
    await sleep(DELAY)
  }
  if (!LIVE) { console.log('\n[DRY] add --live to write to the DB.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl(), ssl: { rejectUnauthorized: false } })
  await client.connect(); console.log('\n✓ Connected.')

  const stat = { listed: 0, sectionsNew: 0, placeholders: 0, keptWithContent: 0, errors: [] }
  try {
    await client.query(
      `insert into section_types (key, label, position) values ($1,'Revision Notes',$2) on conflict (key) do nothing`,
      [TYPE_KEY, SECTION_POSITION])

    for (const { subject: s, chapters } of plan) {
      const classLevel = Number(s.class_level) || 10
      const sub = await client.query(
        `insert into subjects (name, slug) values ($1,$2)
         on conflict (slug) do update set name = excluded.name returning id`,
        [s.name, s.slug])
      const subjectId = sub.rows[0].id

      for (const ch of chapters) {
        stat.listed++
        try {
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
             returning id, (xmax = 0) as inserted`,
            [chapterId, TYPE_KEY, SECTION_POSITION])
          const sectionId = sec.rows[0].id
          if (sec.rows[0].inserted) stat.sectionsNew++

          // Placeholder note ONLY when this section has no note yet — never
          // overwrite the real content of the existing chapters.
          const existing = await client.query('select id, blocks from notes where section_id = $1', [sectionId])
          const hasContent = existing.rows[0] && Array.isArray(existing.rows[0].blocks) && existing.rows[0].blocks.length > 0
          if (hasContent) { stat.keptWithContent++; continue }
          await client.query(
            `insert into notes (section_id, intro, blocks) values ($1,$2,$3::jsonb)
             on conflict (section_id) do nothing`,
            [sectionId, null, JSON.stringify(PLACEHOLDER)])
          stat.placeholders++
        } catch (e) {
          stat.errors.push(`${s.name} / ${ch.name}: ${e.message}`)
        }
      }
    }

    // Verify: chapters that now resolve for the Revision Notes list, per subject.
    console.log('\n── VERIFY (getChapters revision_notes) ─')
    for (const { subject: s } of plan) {
      const v = await client.query(
        `select count(*)::int n from chapters ch join subjects su on su.id = ch.subject_id
          where su.slug = $1 and ch.class_level = $2
            and exists (select 1 from sections se where se.chapter_id = ch.id and se.type_key = $3)`,
        [s.slug, Number(s.class_level) || 10, TYPE_KEY])
      console.log(`  ${s.name}: ${v.rows[0].n} chapters in Revision Notes list`)
    }
  } finally { await client.end() }

  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Chapters in listing : ${stat.listed}`)
  console.log(`  New sections created: ${stat.sectionsNew}`)
  console.log(`  Placeholders added  : ${stat.placeholders}`)
  console.log(`  Kept with content   : ${stat.keptWithContent}`)
  console.log(`  Errors              : ${stat.errors.length}`)
  stat.errors.slice(0, 20).forEach((e) => console.log(`     ! ${e}`))
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
