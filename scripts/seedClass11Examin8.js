'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Seed Class 11 examin8 content from the RAW cache written by
// scripts/fetchClass11Examin8.js (no network). Same content model as Class 6/9:
//
//   ncert_solutions ("className"='Class 11', part_label = tile name)
//     part 4          = Revision Notes (flash cards)
//     part 3          = Exemplar Solutions
//     parts 2,6,7,9…  = NCERT books (Part-I before Part-II)
//   subjects → chapters(class_level=11) → sections(important_questions | pyq) → questions
//
// Physics/Chemistry/Mathematics/Biology already have Important Questions + PYQ
// that students have progress on (deleting questions cascades question_progress),
// so for those an IQ/PYQ section is only REPLACED when the DB holds < 90% of what
// examin8 has (e.g. Maths PYQ). Everything else is replaced per subject+part.
//
//   node scripts/seedClass11Examin8.js            # DRY report
//   node scripts/seedClass11Examin8.js --live     # write
//   ONLY=1340,1871 KINDS=notes,books,iq,pyq …
//
// CLASS=9 reads src/data/class9Examin8 and runs in GAP mode: Class 9 already holds
// most of this content (with student progress), so only chapters that are missing
// from the DB, or hold fewer questions than examin8, are (re)written. The DRY run
// prints that per-chapter diff.
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const CLASS = process.env.CLASS || '11'
const RAW = path.join(ROOT, 'src', 'data', `class${CLASS}Examin8`)
const LIVE = process.argv.includes('--live')
const CLASS_LEVEL = Number(CLASS)
const CLASS_NAME = `Class ${CLASS}`
// REBUILD=1 → replace each listed part wholesale instead of GAP mode (Class 7 books, whose
// rows lack MCQ options). Only safe with KINDS=books: other kinds delete question sections.
const REBUILD = process.env.REBUILD === '1'
const GAP = CLASS !== '11' && !REBUILD
const NCERT_POOL = [2, 6, 7, 9, 10, 11, 12]
const PCMB = ['1340', '1356', '1371', '1388']
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean)
const KINDS = (process.env.KINDS || 'notes,books,iq,pyq').split(',')
if (REBUILD && KINDS.join() !== 'books') throw new Error('REBUILD=1 requires KINDS=books')
const SKIP = ['2539', '2537', '2559'] // "Other Subjects" (Class 11 / Class 9 / Class 7) — a container, not a subject

const trim = (s) => (s == null ? '' : String(s)).trim()
const normApos = (s) => trim(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
const keySlug = (s) => normApos(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// Identical to the app's slugify (src/screens/*.js) so Devanagari names match.
const slugify = (s) => {
  const str = String(s).replace(/[–—­‑]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  const base = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base && !/[^\x00-\x7F]/.test(str)) return base
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  const hash = 'u' + h.toString(36)
  return base ? base + '-' + hash : hash
}

const rd = (...p) => { const f = path.join(RAW, ...p); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null }
const pages = (dir, base) => {
  const out = []
  for (let p = 1; ; p++) { const j = rd(dir, `${base}-p${p}.json`); if (!j) break; out.push(j) }
  return out
}
const resultsOf = (j) => (j && ((j.data && j.data.results) || j.results)) || []

// ── HTML renderers (same markup as the Class 6 seeders → same app styling) ──
const OPT = ['A', 'B', 'C', 'D', 'E', 'F']
function optionsHtml(opts) {
  return `<div class="options">${opts.map((o, k) => {
    const style = o.is_correct ? 'border:1px solid #1a7f37;background:#eaf6ec;' : 'border:1px solid #ededed;background:#fff;'
    return `<div style="${style}padding:8px 10px;border-radius:8px;margin:6px 0;"><b>(${(OPT[k] || k + 1).toString().toLowerCase()})</b> ${trim(o.option)}${o.is_correct ? ' <b style="color:#1a7f37;">✓</b>' : ''}</div>`
  }).join('')}</div>`
}
function mcqAnswerHtml(opts) {
  const ci = opts.findIndex((o) => o.is_correct)
  if (ci < 0) return ''
  const expl = trim(opts[ci].explanation)
  const eb = expl && expl !== trim(opts[ci].option) ? `<div style="margin-top:6px;">${expl}</div>` : ''
  return `<div class="answer-section"><div class="solution-block"><div class="label">Answer</div><div><b>(${OPT[ci].toLowerCase()})</b> ${trim(opts[ci].option)}</div>${eb}</div></div>`
}
function bookCard(q, i) {
  const opts = (q.options || []).filter((o) => trim(o.option))
  const sh = trim(q.solution_html)
  let body = `<div class="question-text">${trim(q.question_html)}</div>`
  if (opts.length) body += optionsHtml(opts)
  const ans = sh ? `<div class="answer-section"><div class="solution-block"><div class="label">Solution</div><div>${sh}</div></div></div>` : (opts.length ? mcqAnswerHtml(opts) : '')
  return `<div class="question-card"><div class="question-header"><span class="q-number">Q ${i + 1}</span></div><div class="question-body">${body}</div>${ans}</div>`
}
function noteCard(c) {
  const ans = trim(c.answer)
  const ab = ans ? `<div class="answer-section"><div class="solution-block"><div class="label">Answer</div><div>${ans}</div></div></div>` : ''
  return `<div class="question-card"><div class="question-body"><div class="question-text">${trim(c.text)}</div></div>${ab}</div>`
}

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']
function mapQ(q, i, isPyq) {
  const opts = Array.isArray(q.option) ? q.option : []
  const mcq = opts.length > 0
  let options = null, correct_option = null
  if (mcq) {
    options = opts.map((o, k) => {
      const idx = LETTERS[k] || String(k + 1)
      if (o.is_correct && !correct_option) correct_option = idx
      return { idx, html: trim(o.option), is_correct: !!o.is_correct }
    })
  }
  let solution_html = Array.isArray(q.solution) && q.solution.length
    ? q.solution.map((s) => trim(s.solution)).filter(Boolean).join('<hr/>') : ''
  if (!solution_html && mcq) { const co = opts.find((o) => o.is_correct); solution_html = trim(co && co.explanation) || '' }
  const years = Array.isArray(q.years) ? q.years.filter(Boolean) : []
  return {
    q_number: `Q${i + 1}`,
    year: isPyq ? (years.length ? years.join(', ') : null) : (trim(q.weightage_name) || null),
    question_html: trim(q.question) || '',
    is_mcq: mcq, options, correct_option, solution_html, position: i,
  }
}

// ── Build per-subject plan from the cache ────────────────────────────────────
function buildNotes(sid) {
  const list = rd(sid, 'notes', 'list.json')
  const kids = (list && list.children) || rd(sid, 'chapters.json') || []
  const chapters = []
  for (const ch of kids) {
    const fc = rd(sid, 'notes', `ch-${ch.id}.json`)
    const topics = ((fc && fc.flash_cards) || []).filter((t) => (t.cards || []).length)
    if (!topics.length) continue
    const single = topics.length === 1
    chapters.push({
      chapter: normApos(ch.name),
      sections: topics.map((t) => ({
        label: single ? 'Revision Notes' : normApos(t.topic_name),
        html: (t.cards || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(noteCard).join('\n'),
        count: (t.cards || []).length,
      })),
    })
  }
  return chapters
}

function buildBook(sid, bk) {
  const meta = rd(sid, 'books', bk.uuid, 'chapters.json')
  const chs = meta ? (Array.isArray(meta) ? meta : (meta.chapters || meta.results || [])) : []
  const out = []
  for (const ch of chs) {
    const chUuid = ch.uuid || ch.id
    const ex = rd(sid, 'books', bk.uuid, `ch-${chUuid}`, 'exercises.json')
    const sections = []
    for (const node of ((ex && ex.exercise_nodes) || [])) {
      const seen = new Set(); const qs = []
      for (const pg of pages(path.join(sid, 'books', bk.uuid, `ch-${chUuid}`), `node-${node.uuid}`)) {
        for (const q of (pg.results || [])) {
          if (seen.has(q.id)) continue; seen.add(q.id)
          const sol = Array.isArray(q.solution_data) && q.solution_data[0] ? q.solution_data[0].solution : (q.solution_html || q.solution || '')
          const options = Array.isArray(q.options_data) ? q.options_data.map((o) => ({ option: o.option || '', explanation: o.explanation || '', is_correct: !!o.is_correct })) : []
          qs.push({ order: q.order != null ? q.order : qs.length + 1, question_html: q.question || '', solution_html: sol || '', options })
        }
      }
      qs.sort((a, b) => a.order - b.order)
      if (qs.length) sections.push({ label: normApos(node.name), html: qs.map(bookCard).join('\n'), count: qs.length })
    }
    if (sections.length) out.push({ chapter: normApos(ch.chapter_name || ch.name), sections })
  }
  return out
}

// Natural order: "Part-I" < "Part-II"; Exemplar handled separately.
const romanRank = (n) => { const m = /part[\s-]*([ivx]+|\d+)/i.exec(n); if (!m) return 0; const r = m[1].toLowerCase(); return /^\d+$/.test(r) ? +r : ({ i: 1, ii: 2, iii: 3, iv: 4, v: 5 })[r] || 9 }

function buildQBank(sid, kind) {
  // kind: 'iq' | 'pyq'. Chapter order = examin8 chapter tree.
  const chapters = rd(sid, 'chapters.json') || []
  const order = new Map(chapters.map((c, i) => [String(c.id), { name: c.name, pos: i }]))
  const dir = path.join(RAW, sid, kind)
  if (!fs.existsSync(dir)) return []
  const ids = [...new Set(fs.readdirSync(dir).map((f) => (/^ch-(\d+)-p1\.json$/.exec(f) || [])[1]).filter(Boolean))]
  const topics = kind === 'pyq' ? rd(sid, 'pyq', 'topics.json') : rd(sid, 'iq', 'list.json')
  const names = new Map()
  for (const t of ((topics && (topics.chapters || topics.children)) || [])) names.set(String(t.id), t.name)
  const out = []
  for (const id of ids) {
    const raw = []
    for (const pg of pages(path.join(sid, kind), `ch-${id}`)) raw.push(...resultsOf(pg))
    if (!raw.length) continue
    const meta = order.get(id) || { name: names.get(id) || `Chapter ${id}`, pos: 900 + out.length }
    out.push({ chapter: normApos(meta.name), pos: meta.pos, questions: raw.map((q, i) => mapQ(q, i, kind === 'pyq')) })
  }
  return out.sort((a, b) => a.pos - b.pos)
}

function getDbUrl() {
  let u = fs.readFileSync(path.join(ROOT, 'server', '.env'), 'utf8').match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, '')
  try { const x = new URL(u); for (const k of [...x.searchParams.keys()]) x.searchParams.delete(k); u = x.toString() } catch (_) {}
  return u
}

async function main() {
  const subjects = (rd('subjects.json') || []).map((s) => ({ id: String(s.id), name: normApos(s.name) }))
    .filter((s) => !SKIP.includes(s.id) && (!ONLY.length || ONLY.includes(s.id)))
  const plan = []
  for (const s of subjects) {
    if (!rd(s.id, 'download-resources.json')) { console.log(`  (not fetched yet) ${s.name}`); continue }
    const dr = rd(s.id, 'download-resources.json')
    const p = { ...s, parts: [], iq: [], pyq: [] }
    if (KINDS.includes('books')) {
      const books = (dr.textbook_data || []).slice()
      const ex = books.filter((b) => /exemplar/i.test(b.name))
      const nc = books.filter((b) => !/exemplar/i.test(b.name)).sort((a, b) => romanRank(a.name) - romanRank(b.name))
      nc.forEach((b, i) => { const ch = buildBook(s.id, b); if (ch.length) p.parts.push({ part: NCERT_POOL[i], label: normApos(b.name), chapters: ch }) })
      ex.forEach((b) => { const ch = buildBook(s.id, b); if (ch.length) p.parts.push({ part: 3, label: normApos(b.name), chapters: ch }) })
    }
    if (KINDS.includes('notes')) { const ch = buildNotes(s.id); if (ch.length) p.parts.push({ part: 4, label: 'Revision Notes', chapters: ch }) }
    if (KINDS.includes('iq')) p.iq = buildQBank(s.id, 'iq')
    if (KINDS.includes('pyq')) p.pyq = buildQBank(s.id, 'pyq')
    const n = (arr) => arr.reduce((a, c) => a + c.questions.length, 0)
    const partStr = p.parts.map((x) => `${x.part}:${x.label}(${x.chapters.length}ch/${x.chapters.reduce((a, c) => a + c.sections.reduce((b, y) => b + y.count, 0), 0)})`).join(' ')
    console.log(`${s.id.padStart(5)} ${s.name.padEnd(28)} IQ ${String(n(p.iq)).padStart(5)}  PYQ ${String(n(p.pyq)).padStart(4)}  ${partStr}`)
    plan.push(p)
  }
  if (GAP) return seedGaps(plan)
  if (!LIVE) { console.log('\n[DRY] add --live to seed.'); return }

  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl() })
  await client.connect(); console.log('\n✓ Connected.')
  // examin8 HTML occasionally carries NUL bytes (raw, or as a JSON "\u0000" escape
  // inside options), which Postgres text/jsonb reject.
  const rawQuery = client.query.bind(client)
  client.query = (sql, params) => rawQuery(sql, params && params.map((v) => (typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\\u0000/g, '') : v)))
  try {
    await client.query('alter table ncert_solutions add column if not exists part_label text')
    for (const s of plan) {
      const isPcmb = PCMB.includes(s.id)
      await client.query('BEGIN')
      // Subject row: reuse an existing one by name, else create with the app slug.
      let r = await client.query('select id, slug from subjects where name = $1 order by id limit 1', [s.name])
      if (!r.rows.length) r = await client.query('insert into subjects (name, slug) values ($1,$2) on conflict (slug) do update set name = subjects.name returning id, slug', [s.name, slugify(s.name)])
      const subjectId = r.rows[0].id

      // ncert_solutions parts. For PCMB the old Class 11 part-2 rows (one blob per
      // chapter, pre-examin8) are replaced along with everything else seeded here.
      if (s.parts.length) {
        if (isPcmb) await client.query('delete from ncert_solutions where subject=$1 and "className"=$2 and part = 2', [s.name, CLASS_NAME])
        for (const p of s.parts) {
          await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3', [p.part, s.name, CLASS_NAME])
          let ci = 0
          for (const c of p.chapters) {
            let si = 0
            for (const sec of c.sections) {
              await client.query(
                `insert into ncert_solutions (id, part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position, part_label)
                 values (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
                [p.part, s.name, CLASS_NAME, c.chapter, keySlug(sec.label) + '-' + si, sec.label, sec.html, ci, si, p.label])
              si++
            }
            ci++
          }
        }
      }

      // Important Questions / PYQ sections.
      for (const [kind, typeKey, pos] of [['iq', 'important_questions', 6], ['pyq', 'pyq', 8]]) {
        const bank = s[kind]
        if (!bank.length) continue
        const want = bank.reduce((a, c) => a + c.questions.length, 0)
        if (isPcmb) {
          const have = (await client.query(
            `select count(q.id)::int n from questions q join sections sec on sec.id=q.section_id join chapters c on c.id=sec.chapter_id
             where c.subject_id=$1 and c.class_level=$2 and sec.type_key=$3 and c.deleted_at is null`, [subjectId, CLASS_LEVEL, typeKey])).rows[0].n
          if (have >= 0.9 * want) { console.log(`  = ${s.name} ${typeKey}: kept (${have} in DB vs ${want} on examin8)`); continue }
          console.log(`  ↻ ${s.name} ${typeKey}: replacing ${have} → ${want}`)
        }
        await client.query(`delete from sections where type_key=$1 and chapter_id in (select id from chapters where subject_id=$2 and class_level=$3)`, [typeKey, subjectId, CLASS_LEVEL])
        for (const c of bank) {
          const ch = await client.query(
            `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
             on conflict (subject_id, class_level, slug) do update set name = excluded.name returning id`,
            [subjectId, c.chapter, slugify(c.chapter), CLASS_LEVEL, c.pos])
          const sec = await client.query(
            `insert into sections (chapter_id, type_key, position) values ($1,$2,$3) on conflict (chapter_id, type_key) do update set position = excluded.position returning id`,
            [ch.rows[0].id, typeKey, pos])
          const sectionId = sec.rows[0].id
          for (let i = 0; i < c.questions.length; i += 200) {
            const chunk = c.questions.slice(i, i + 200)
            const params = []; const tuples = []
            chunk.forEach((q) => {
              const b = params.length
              tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`)
              params.push(sectionId, q.q_number, q.year, q.question_html, q.is_mcq, q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, q.position)
            })
            await client.query(`insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position) values ${tuples.join(',')}`, params)
          }
        }
        console.log(`  ✓ ${s.name} ${typeKey}: ${bank.length} ch, ${want} q`)
      }
      await client.query('COMMIT')
      console.log(`✓ ${s.name}: ${s.parts.length} resource parts`)
    }
  } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e } finally { await client.end() }
}

// ── GAP mode ─────────────────────────────────────────────────────────────────
// Unicode-aware (keySlug drops Devanagari entirely, so Hindi chapters would collide).
const chKey = (s) => normApos(s).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}\p{M}]+/gu, '-').replace(/^-|-$/g, '').replace(/^(chapter|ch)-?\d+-?/, '')
const cardsIn = (html) => (String(html).match(/class="question-card"/g) || []).length
const textKey = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 80)
const cardTexts = (html) => [...String(html).matchAll(/<div class="question-text">([\s\S]*?)<\/div>/g)].map((m) => textKey(m[1])).filter(Boolean)
const isDeleted = (name) => /\(deleted\)/i.test(name)
// examin8 renames chapters between syllabus updates ("Democracy in India" →
// "Democracy"). A chapter with no name match is paired with the unmatched DB
// chapter sharing the most question texts (≥ 40% of the smaller side).
function pairByContent(wanted, dbOnly) {
  const pairs = new Map()
  for (const w of wanted) {
    let best = null, bestScore = 0
    for (const d of dbOnly) {
      if ([...pairs.values()].includes(d)) continue
      const hit = w.texts.filter((t) => d.texts.has(t)).length
      const score = hit / Math.max(1, Math.min(w.texts.length, d.texts.size))
      if (score > bestScore) { best = d; bestScore = score }
    }
    if (best && bestScore >= 0.4) pairs.set(w, best)
  }
  return pairs
}

async function insertQuestions(client, sectionId, questions) {
  for (let i = 0; i < questions.length; i += 200) {
    const chunk = questions.slice(i, i + 200)
    const params = []; const tuples = []
    chunk.forEach((q) => {
      const b = params.length
      tuples.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9})`)
      params.push(sectionId, q.q_number, q.year, q.question_html, q.is_mcq, q.options ? JSON.stringify(q.options) : null, q.correct_option, q.solution_html, q.position)
    })
    await client.query(`insert into questions (section_id, q_number, year, question_html, is_mcq, options, correct_option, solution_html, position) values ${tuples.join(',')}`, params)
  }
}

// Which DB part an examin8 book/notes part corresponds to: same part_label, else
// the unlabeled rows the team seeded (part 2 = the one NCERT book, 3 = Exemplar,
// 4 = notes), else a free part number.
function matchPart(p, dbParts, nNcert) {
  const byLabel = dbParts.find((d) => d.label && normApos(d.label) === p.label)
  if (byLabel) return { part: byLabel.part, label: byLabel.label }
  const unl = (n) => dbParts.find((d) => d.part === n && !d.label)
  if (p.part === 4 && (unl(4) || !dbParts.some((d) => d.part === 4))) return { part: 4, label: unl(4) ? null : p.label }
  if (p.part === 3 && (unl(3) || !dbParts.some((d) => d.part === 3))) return { part: 3, label: unl(3) ? null : p.label }
  if (p.part !== 3 && p.part !== 4 && nNcert === 1 && unl(2)) return { part: 2, label: null }
  const used = new Set(dbParts.map((d) => d.part))
  // "Class 09 > Social Science (…)" is examin8's breadcrumb, not a book name →
  // leave it unlabeled so the tile reads "NCERT Solutions" like the team's rows.
  const label = /^class\s*\d+\s*[->]/i.test(p.label) ? null : p.label
  return { part: [p.part, ...NCERT_POOL].find((n) => !used.has(n) && n !== 3 && n !== 4), label, fresh: true }
}

async function seedGaps(plan) {
  const { Client } = require('pg')
  const client = new Client({ connectionString: getDbUrl() })
  await client.connect()
  const rawQuery = client.query.bind(client)
  client.query = (sql, params) => rawQuery(sql, params && params.map((v) => (typeof v === 'string' ? v.replace(/\u0000/g, '').replace(/\\u0000/g, '') : v)))
  let nWrites = 0
  try {
    await client.query('alter table ncert_solutions add column if not exists part_label text')
    for (const s of plan) {
      if (LIVE) await client.query('BEGIN')
      const sub = (await client.query('select id from subjects where name = $1 order by id limit 1', [s.name])).rows[0]
      console.log(`\n=== ${s.name}${sub ? '' : '  (NEW subject)'}`)

      // ncert_solutions parts, compared chapter by chapter on question-card count.
      const rows = (await client.query('select part, part_label, chapter, html from ncert_solutions where subject=$1 and "className"=$2', [s.name, CLASS_NAME])).rows
      const dbParts = []
      for (const r of rows) {
        let d = dbParts.find((x) => x.part === r.part)
        if (!d) dbParts.push(d = { part: r.part, label: r.part_label, chapters: new Map() })
        const k = chKey(r.chapter)
        if (!d.chapters.has(k)) d.chapters.set(k, { name: r.chapter, cards: 0, texts: new Set() })
        const h = d.chapters.get(k)
        h.cards += cardsIn(r.html); cardTexts(r.html).forEach((t) => h.texts.add(t))
      }
      const nNcert = s.parts.filter((p) => p.part !== 3 && p.part !== 4).length
      for (const p of s.parts) {
        const m = matchPart(p, dbParts, nNcert)
        const have = (dbParts.find((d) => d.part === m.part) || { chapters: new Map() }).chapters
        const items = p.chapters.filter((c) => !isDeleted(c.chapter)).map((c, ci) => ({
          c, ci, h: have.get(chKey(c.chapter)), want: c.sections.reduce((a, x) => a + cardsIn(x.html), 0),
          texts: c.sections.flatMap((x) => cardTexts(x.html)),
        }))
        const matched = new Set(items.map((i) => i.h).filter(Boolean))
        for (const [i, d] of pairByContent(items.filter((i) => !i.h), [...have.values()].filter((h) => !matched.has(h)))) { i.h = d; i.renamed = true; matched.add(d) }
        const todo = items.filter((i) => !i.h || i.h.cards < i.want || i.renamed)
        const extra = [...have.values()].filter((h) => !matched.has(h))
        console.log(`  part ${m.part} "${m.label || p.label}"${m.fresh ? ' (new tile)' : ''}: ${items.length} ch on examin8, ${have.size} in DB → ${todo.length ? todo.map((t) => (t.renamed ? `"${t.h.name}" renamed → ` : '') + `${t.c.chapter} ${t.h ? t.h.cards : 0}→${t.want}`).join('; ') : 'up to date'}`)
        if (extra.length) console.log(`     DB-only chapters kept: ${extra.map((h) => h.name).join('; ')}`)
        if (!LIVE || !todo.length) continue
        for (const { c, ci, h, want } of todo) {
          if (h && h.cards >= want) { // renamed only
            await client.query('update ncert_solutions set chapter=$1 where part=$2 and subject=$3 and "className"=$4 and chapter=$5', [c.chapter, m.part, s.name, CLASS_NAME, h.name])
            continue
          }
          if (h) await client.query('delete from ncert_solutions where part=$1 and subject=$2 and "className"=$3 and chapter=$4', [m.part, s.name, CLASS_NAME, h.name])
          let si = 0
          for (const sec of c.sections) {
            await client.query(
              `insert into ncert_solutions (id, part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position, part_label)
               values (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
              [m.part, s.name, CLASS_NAME, c.chapter, keySlug(sec.label) + '-' + si, sec.label, sec.html, ci, si, m.label])
            si++; nWrites++
          }
        }
        // Keep examin8's chapter order across old and newly added chapters
        // (DB-only chapters go after them).
        for (const { c, ci, h } of items) {
          await client.query('update ncert_solutions set "chapterPos"=$1 where part=$2 and subject=$3 and "className"=$4 and chapter=$5', [ci, m.part, s.name, CLASS_NAME, todo.some((t) => t.c === c) || !h ? c.chapter : h.name])
        }
        for (const [k, h] of extra.entries()) {
          await client.query('update ncert_solutions set "chapterPos"=$1 where part=$2 and subject=$3 and "className"=$4 and chapter=$5', [items.length + k, m.part, s.name, CLASS_NAME, h.name])
        }
      }

      // Important Questions / PYQ, chapter by chapter. Only a chapter with fewer
      // questions than examin8 is rewritten (its question_progress goes with it).
      let subjectId = sub && sub.id
      for (const [kind, typeKey, pos] of [['iq', 'important_questions', 6], ['pyq', 'pyq', 8]]) {
        const bank = s[kind].filter((c) => !isDeleted(c.chapter))
        if (!bank.length) continue
        const dbCh = subjectId ? (await client.query(
          `select c.id, c.name, c.slug, count(q.id)::int n, coalesce(array_agg(q.question_html) filter (where q.id is not null), '{}') qs from chapters c
           left join sections sec on sec.chapter_id=c.id and sec.type_key=$3 left join questions q on q.section_id=sec.id
           where c.subject_id=$1 and c.class_level=$2 and c.deleted_at is null group by 1,2,3`, [subjectId, CLASS_LEVEL, typeKey])).rows : []
        dbCh.forEach((d) => { d.texts = new Set(d.qs.map(textKey)) })
        const items = bank.map((c) => ({
          c, h: dbCh.find((d) => d.slug === slugify(c.chapter) || chKey(d.name) === chKey(c.chapter)),
          texts: c.questions.map((q) => textKey(q.question_html)),
        }))
        const matched = new Set(items.map((i) => i.h).filter(Boolean))
        for (const [i, d] of pairByContent(items.filter((i) => !i.h), dbCh.filter((d) => d.n && !matched.has(d)))) { i.h = d; i.renamed = true }
        const todo = items.filter((i) => !i.h || i.h.n < i.c.questions.length || i.renamed)
        const have = dbCh.reduce((a, d) => a + d.n, 0), want = bank.reduce((a, c) => a + c.questions.length, 0)
        console.log(`  ${typeKey}: examin8 ${bank.length} ch/${want} q, DB ${have} q → ${todo.length ? todo.map((t) => (t.renamed ? `"${t.h.name}" renamed → ` : '') + `${t.c.chapter} ${t.h ? t.h.n : 0}→${t.c.questions.length}`).join('; ') : 'up to date'}`)
        if (!LIVE || !todo.length) continue
        if (!subjectId) {
          subjectId = (await client.query('insert into subjects (name, slug) values ($1,$2) on conflict (slug) do update set name = subjects.name returning id', [s.name, slugify(s.name)])).rows[0].id
        }
        for (const { c, h, renamed } of todo) {
          if (renamed) await client.query('update chapters set name=$1, slug=$2 where id=$3', [c.chapter, slugify(c.chapter), h.id])
          if (h && h.n >= c.questions.length) continue // renamed only
          const chapterId = h ? h.id : (await client.query(
            `insert into chapters (subject_id, name, slug, class_level, position) values ($1,$2,$3,$4,$5)
             on conflict (subject_id, class_level, slug) do update set name = excluded.name returning id`,
            [subjectId, c.chapter, slugify(c.chapter), CLASS_LEVEL, c.pos])).rows[0].id
          const sectionId = (await client.query(
            `insert into sections (chapter_id, type_key, position) values ($1,$2,$3) on conflict (chapter_id, type_key) do update set position = excluded.position returning id`,
            [chapterId, typeKey, pos])).rows[0].id
          await client.query('delete from questions where section_id=$1', [sectionId])
          await insertQuestions(client, sectionId, c.questions)
          nWrites += c.questions.length
        }
      }
      if (LIVE) await client.query('COMMIT')
    }
  } catch (e) { if (LIVE) await client.query('ROLLBACK').catch(() => {}); throw e } finally { await client.end() }
  console.log(LIVE ? `\n✓ GAP seed done (${nWrites} rows written).` : '\n[DRY] add --live to seed the gaps above.')
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
