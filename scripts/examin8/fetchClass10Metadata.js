'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Examin8 → Class metadata extractor (DRY-RUN / read-only; never touches the DB).
//
// Walks the Examin8 hierarchy for one class:
//   Class (CLASS_ID) → Subjects → Chapters   (+ per-subject download-resources)
//
// Generic: works for ANY class by changing CLASS_ID (env or arg). 1175 = CBSE
// Class 10. It only reads subject + chapter METADATA here (Phase 1). Resource
// content types (NCERT, Important Qs, tests, …) are discovered and reported from
// the API flags but fetched in a later phase.
//
// Endpoints (as provided / verified — no guessing):
//   children  : GET /v1/content/category/{id}/                         → array of child categories
//   resources : GET /v1/content/category/{id}/type/download-resources/ → subject metadata + has_* flags
//
// Output (raw = verbatim API, normalized = app-shaped, ads_* dropped):
//   data/examin8/class{N}/raw/*.json
//   data/examin8/class{N}/normalized/{subjects,chapters,resources}.json
//
// Resume: already-downloaded raw files are skipped unless --force.
//
//   node scripts/examin8/fetchClass10Metadata.js
//   CLASS_ID=1175 node scripts/examin8/fetchClass10Metadata.js --force
//   node scripts/examin8/fetchClass10Metadata.js 1175         # class id as positional arg
// ───────────────────────────────────────────────────────────────────────────

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const B = 'https://web.examin8.com/v1'
const DELAY = 150
const FORCE = process.argv.includes('--force')
const argId = process.argv.find((a) => /^\d+$/.test(a))
const CLASS_ID = String(process.env.CLASS_ID || argId || 1175)

// Optional — the endpoints above are public, but forward a session if provided.
const COOKIE = process.env.EXAMIN8_COOKIE
const CSRF = process.env.EXAMIN8_CSRF

// Content types the app cares about, mapped to the download-resources has_* flag
// and the *_content_id / count fields. Detected per subject (nothing hardcoded).
const CONTENT_TYPES = [
  { key: 'ncert',                flag: 'has_textbook_data',          via: 'textbook' },
  { key: 'exemplar',             flag: 'has_textbook_data',          via: 'textbook' },
  { key: 'important_questions',  flag: 'has_important_questions',     paid: 'important_questions_paid_count' },
  { key: 'previous_year_questions', flag: 'has_previous_year_questions', paid: 'paid_previous_year_count' },
  { key: 'practice',             flag: null,                          paid: 'paid_practice_count' },
  { key: 'online_test',          flag: 'has_onlinetest',              free: 'free_onlinetest', paid: 'paid_onlinetest' },
  { key: 'mock_quiz',            flag: 'has_mock_quiz',               free: 'free_mock_quiz_count', paid: 'paid_mock_quiz_count' },
  { key: 'flash_card',           flag: 'has_flash_card',              free: 'free_flash_card_count', paid: 'paid_flash_card_count' },
  { key: 'syllabus',             flag: 'has_syllabus',                id: 'syllabus_content_id', name: 'syllabus_content_name', free: 'syllabus_item_free_count', paid: 'syllabus_item_paid_count' },
  { key: 'sample_papers',        flag: 'has_sample_papers',           id: 'sample_papers_content_id', name: 'sample_papers_content_name', free: 'sample_papers_item_free_count', paid: 'sample_papers_item_paid_count' },
  { key: 'test_papers',          flag: 'has_test_papers',             id: 'test_papers_content_id', name: 'test_papers_content_name', free: 'test_papers_item_free_count', paid: 'test_papers_item_paid_count' },
  { key: 'last_year_paper',      flag: 'has_last_year_paper',         id: 'last_year_paper_content_id', name: 'last_year_paper_content_name', free: 'last_year_paper_item_free_count' },
  { key: 'case_study_questions', flag: 'has_case_study_questions',    id: 'case_study_questions_content_id', name: 'case_study_questions_content_name', free: 'case_study_questions_item_free_count', paid: 'case_study_questions_item_paid_count' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const trim = (s) => (s == null ? '' : String(s)).trim()
const num = (v) => (v == null || v === '' ? null : Number(v))
const bool = (v) => v === true || v === 'true' || v === 1 || v === '1'

// MUST stay byte-identical to the client slugify (src/screens/PracticeScreen.js)
// so inserted chapters resolve through the API by slug. Non-ASCII names fall back
// to a stable hash slug.
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  if (base) return base
  let h = 5381
  const str = String(s)
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0
  return 'u' + h.toString(36)
}

const log = { subjects: 0, chapters: 0, resources: 0, errors: [] }

async function api(url) {
  const headers = { accept: 'application/json', referer: 'https://web.examin8.com/' }
  if (CSRF) headers['x-csrftoken'] = CSRF
  if (COOKIE) headers.cookie = COOKIE
  const r = await fetch(url, { headers })
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url)
  return r.json()
}

// Fetch + cache a URL to a raw file. Resume: reuse the cached file unless --force.
async function cached(rawDir, file, url) {
  const p = path.join(rawDir, file)
  if (!FORCE && fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch (_) { /* re-fetch on parse error */ }
  }
  const j = await api(url)
  fs.writeFileSync(p, JSON.stringify(j, null, 2))
  await sleep(DELAY)
  return j
}

const childrenOf = (list) => (Array.isArray(list) ? list : (list && (list.children || list.results)) || [])

// Parse "CBSE > Class 10 > Mathematics" → { board, classNum }.
function parseFullName(fullName) {
  const parts = String(fullName || '').split('>').map((x) => x.trim()).filter(Boolean)
  const board = parts[0] || null
  const classPart = parts.find((p) => /class\s*\d+/i.test(p)) || parts[1] || ''
  const m = classPart.match(/\d{1,2}/)
  return { board, classNum: m ? parseInt(m[0], 10) : null }
}

// Available content types for one subject, read straight from its has_* flags.
function contentTypesOf(d) {
  return CONTENT_TYPES.filter((t) => (t.flag ? bool(d[t.flag]) : false) || (t.paid && num(d[t.paid])) || (t.id && d[t.id] != null))
    .map((t) => ({
      type: t.key,
      content_id: t.id ? num(d[t.id]) : null,
      content_name: t.name ? (trim(d[t.name]) || null) : null,
      free: t.free ? num(d[t.free]) : null,
      paid: t.paid ? num(d[t.paid]) : null,
    }))
}

async function main() {
  console.log(`\nExamin8 metadata fetch — CLASS_ID=${CLASS_ID}${FORCE ? ' (force re-download)' : ''}`)

  // Resolve the class node so we can name the output folder and stamp board/class.
  let classNode
  try {
    classNode = await api(`${B}/content/category/${CLASS_ID}/type/download-resources/`)
  } catch (e) {
    console.error('FAILED to read class node:', e.message); process.exit(1)
  }
  const parsedClass = parseFullName(classNode.full_name)
  const classNum = parsedClass.classNum
  const folder = `class${classNum || CLASS_ID}`
  const OUT = path.join(ROOT, 'data', 'examin8', folder)
  const rawDir = path.join(OUT, 'raw')
  const normDir = path.join(OUT, 'normalized')
  fs.mkdirSync(rawDir, { recursive: true })
  fs.mkdirSync(normDir, { recursive: true })
  console.log(`  ${classNode.full_name || classNode.name} → data/examin8/${folder}/`)
  fs.writeFileSync(path.join(rawDir, `class-${CLASS_ID}.json`), JSON.stringify(classNode, null, 2))

  // 1) subjects = children of the class category
  let subjectList
  try {
    subjectList = childrenOf(await cached(rawDir, `class-${CLASS_ID}-children.json`, `${B}/content/category/${CLASS_ID}/`))
  } catch (e) {
    console.error('FAILED to list subjects:', e.message); process.exit(1)
  }

  const subjectsOut = []
  const chaptersOut = []
  const resourcesOut = []

  for (const su of subjectList) {
    const subjectId = num(su.id)
    const name = trim(su.name)
    if (!subjectId || !name) continue
    const slug = slugify(name)
    process.stdout.write(`  • ${name} (${subjectId}) … `)

    // 1a) subject metadata (download-resources)
    let d
    try {
      d = await cached(rawDir, `subject-${subjectId}-resources.json`, `${B}/content/category/${subjectId}/type/download-resources/`)
    } catch (e) {
      console.log(`SKIP (${e.message})`); log.errors.push(`subject ${subjectId}: ${e.message}`); continue
    }
    const pf = parseFullName(d.full_name)

    subjectsOut.push({
      category_id: num(d.id) || subjectId,
      parent_id: num(d.parent_id),
      board: pf.board || parsedClass.board,
      class_level: pf.classNum || classNum,
      name,
      full_name: trim(d.full_name) || null,
      slug,
      web_logo: trim(d.web_logo) || null,
      mobile_logo: trim(d.mobile_logo) || null,
      mobile_logo2: trim(d.mobile_logo2) || null,
      is_subject: bool(d.is_subject),
      is_chapter: bool(d.is_chapter),
    })

    const textbook_data = Array.isArray(d.textbook_data)
      ? d.textbook_data.map((t) => ({ name: trim(t.name), uuid: trim(t.uuid) })).filter((t) => t.uuid) : []
    resourcesOut.push({
      category_id: num(d.id) || subjectId,
      name, slug,
      content_types: contentTypesOf(d),
      has_textbook_data: bool(d.has_textbook_data),
      textbook_data,
    })
    log.resources += contentTypesOf(d).length

    // 1b) chapters = children of the subject category
    let chaps = []
    try {
      chaps = childrenOf(await cached(rawDir, `subject-${subjectId}-children.json`, `${B}/content/category/${subjectId}/`))
    } catch (e) {
      log.errors.push(`chapters ${subjectId}: ${e.message}`)
    }
    const chapters = chaps.map((c, i) => ({
      category_id: num(c.id),
      name: trim(c.name),
      slug: slugify(c.name),
      weight: num(c.weight),
      parent: num(c.parent != null ? c.parent : subjectId),
      position: i,
      web_logo: trim(c.web_logo) || null,
      mobile_logo: trim(c.mobile_logo) || null,
      is_free: bool(c.is_free_subject),
    })).filter((c) => c.category_id && c.name)
    chaptersOut.push({ subject_category_id: subjectId, subject: name, slug, chapters })

    log.subjects += 1
    log.chapters += chapters.length
    console.log(`${chapters.length} chapters, ${textbook_data.length} textbooks, ${resourcesOut[resourcesOut.length - 1].content_types.length} content types`)
  }

  // 2) normalized outputs
  const write = (file, data) => {
    fs.writeFileSync(path.join(normDir, file), JSON.stringify(data, null, 2))
    console.log(`  ✓ normalized/${file} (${Array.isArray(data) ? data.length : 0} records)`)
  }
  console.log('')
  write('subjects.json', subjectsOut)
  write('chapters.json', chaptersOut)
  write('resources.json', resourcesOut)

  console.log('\n── LOG ────────────────────────────────')
  console.log(`  Subjects  : ${log.subjects}`)
  console.log(`  Chapters  : ${log.chapters}`)
  console.log(`  Resources : ${log.resources} content-type descriptors (fetched in a later phase)`)
  console.log(`  Errors    : ${log.errors.length}`)
  log.errors.forEach((e) => console.log(`     ! ${e}`))
  console.log(`\nRaw JSON  : data/examin8/${folder}/raw/`)
  console.log(`Normalized: data/examin8/${folder}/normalized/`)
  console.log(`Next: node scripts/examin8/importClass10Metadata.js --live`)
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
