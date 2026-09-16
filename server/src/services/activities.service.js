'use strict'

// Chapter activities, in two modes a class can play from one chapter.
//
//   board     A teacher-run TEAM GAME for the whole class, projected on a screen:
//             2–4 teams, a 4×4 board of point tiles under four categories, a timer,
//             the teacher reveals the answer and marks the team right or wrong.
//               { cats: [4 names], tiles: [ [ {p, q, o?, a} ×4 ] ×4 ] }   (tiles[col][row])
//
//   missions  SOLO practice a student plays alone, auto-graded, five kinds of item:
//               mcq     { q, o: [text], a: index, x }          — tap the right pill
//               tf      { q, a: boolean, x }                   — true or false
//               typein  { q, a: [accepted lowercase], show }   — type the answer
//               match   { q, o: [3 texts], a: index }          — pick the matching pair
//               task    { steps: [text] }                      — a real-world thing to do; unscored
//               { missions: [ { type, title, note, items | steps } ], total }
//
// Both are ASSEMBLED here from the chapter's question banks, so every chapter with
// enough MCQs is playable today with nobody authoring anything. Assembly cannot
// invent what a bank does not hold — a theme, a riddle with spelling aliases, an
// "act it out" tile, a pledge — so a curated row in `activities` wins over assembly
// wherever one exists. That is the upgrade path: assembled everywhere first, curated
// where someone has done the work.

const db = require('../config/database')

const MCQ_COUNT = 6
const TF_COUNT = 5
const TYPEIN_COUNT = 4
const MATCH_COUNT = 5
const BOARD_CATS = 4
const BOARD_ROWS = 4
const BOARD_POINTS = [10, 20, 30, 40]
// Below this many usable MCQs an assembled activity is too thin to be worth opening —
// a board is 16 tiles, and the same three questions recycled across missions is not a
// game.
const MIN_USABLE = 10

// ─── HTML → text ─────────────────────────────────────────────────────────────

// The banks store HTML. A pill or a tile renders text, so this strips tags and decodes
// the entities that actually appear. Superscript and subscript lose their position
// (cm<sup>-1</sup> → cm-1); items that depend on it are mostly the ones excluded below
// for carrying math markup anyway.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', deg: '°', times: '×', divide: '÷', minus: '−', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' }
function toText(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') {
        const hex = e[1] === 'x' || e[1] === 'X'
        return String.fromCodePoint(parseInt(hex ? e.slice(2) : e.slice(1), hex ? 16 : 10))
      }
      return ENTITIES[e.toLowerCase()] ?? m
    })
    .replace(/\s+/g, ' ')
    .trim()
}

// Things text cannot render, or a stem too long to read aloud in a game. `{tex}` and
// math-tex are the LaTeX wrappers the banks use; an image stem is unanswerable as text.
function renderable(html) {
  const s = String(html || '')
  return s && !/\{tex\}|math-tex|<img|\\\(|\\\[/i.test(s)
}

// Fisher–Yates. Math.random is fine: this is variety between plays, not anything a
// student could exploit by predicting.
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Question pool ───────────────────────────────────────────────────────────

// One normalised shape from two banks:
//   { stem, options: [text], correct: index, explanation, difficulty, topic }
//
// mcq_questions reaches a chapter via subtopics and carries a difficulty and a topic
// name; questions reaches it via sections and carries neither. Both are pulled, so a
// class-10 chapter (which has questions but no mcq_questions) assembles like a class-8
// one — it just gets generic board categories instead of subtopic names.
async function loadPool(chapterId) {
  const [mcq, qs] = await Promise.all([
    db.$queryRawUnsafe(
      `SELECT m.question_html, m.options, m.correct_option_id::text AS correct_id, m.explanation_html, m.difficulty, st.name AS topic
         FROM mcq_questions m JOIN subtopics st ON st.id = m.subtopic_id
        WHERE st.chapter_id = $1::bigint`, chapterId),
    db.$queryRawUnsafe(
      `SELECT q.question_html, q.options, q.correct_option, q.solution_html
         FROM questions q JOIN sections s ON s.id = q.section_id
        WHERE s.chapter_id = $1::bigint AND q.is_mcq = true AND q.options IS NOT NULL`, chapterId),
  ])

  const pool = []
  const seen = new Set()
  const push = (item) => {
    // The same stem in two banks would let one tile hand the answer to another.
    const key = item.stem.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    pool.push(item)
  }
  const usable = (stem, options) => stem && stem.length <= 240 && options.every((o) => o && o.length <= 90)

  for (const r of mcq) {
    const opts = Array.isArray(r.options) ? r.options : []
    if (!renderable(r.question_html) || opts.length < 3 || !opts.every((o) => renderable(o.html))) continue
    const options = opts.map((o) => toText(o.html))
    const correct = opts.findIndex((o) => String(o.id) === String(r.correct_id))
    const stem = toText(r.question_html)
    if (correct < 0 || !usable(stem, options)) continue
    const topic = String(r.topic || '').trim()
    push({ stem, options, correct, explanation: toText(r.explanation_html), difficulty: String(r.difficulty || '').toLowerCase(), topic: /^uncategori[sz]ed$/i.test(topic) ? '' : topic })
  }
  for (const r of qs) {
    const opts = Array.isArray(r.options) ? r.options : []
    if (!renderable(r.question_html) || opts.length < 3 || !opts.every((o) => renderable(o.html))) continue
    const options = opts.map((o) => toText(o.html))
    let correct = opts.findIndex((o) => o.is_correct === true)
    if (correct < 0) correct = opts.findIndex((o) => String(o.idx) === String(r.correct_option))
    const stem = toText(r.question_html)
    if (correct < 0 || !usable(stem, options)) continue
    // Solutions in this bank are worked answers, often long. Keep the first sentence.
    const explanation = toText(r.solution_html).split(/(?<=[.!?])\s/)[0].slice(0, 160)
    push({ stem, options, correct, explanation, difficulty: '', topic: '' })
  }
  return pool
}

// ─── Theme ───────────────────────────────────────────────────────────────────

// By subject family, matched on the subject's name. The chapter's own name is always
// the title; the theme supplies the flavour a bank cannot.
const THEMES = [
  [/physics/i,                                  { emoji: '⚛️', theme: 'Physics Lab' }],
  [/chem/i,                                     { emoji: '🧪', theme: 'Chemistry Lab' }],
  [/bio/i,                                      { emoji: '🧬', theme: 'Life Lab' }],
  [/social|history|geograph|civics|सामाजिक/i,   { emoji: '🗺️', theme: 'Time Traveller' }],
  [/science|विज्ञान/i,                          { emoji: '🔬', theme: 'Science Mission' }],
  [/math|गणित/i,                                { emoji: '🧮', theme: 'Number Quest' }],
  [/english/i,                                  { emoji: '📚', theme: 'Word Explorer' }],
  [/hindi|हिंदी|हिन्दी/i,                        { emoji: '📖', theme: 'शब्द यात्रा' }],
  [/sanskrit|संस्कृत/i,                          { emoji: '🕉️', theme: 'Sanskrit Quest' }],
  [/reasoning|mental/i,                         { emoji: '🧠', theme: 'Brain Quest' }],
  [/computer|information|artificial/i,          { emoji: '💻', theme: 'Tech Mission' }],
]
function themeFor(subjectName) {
  for (const [re, t] of THEMES) if (re.test(subjectName || '')) return t
  return { emoji: '🎯', theme: 'Chapter Mission' }
}
const kickerFor = (chapter, subjectName, classLevel) =>
  [subjectName, `Class ${classLevel}`, chapter.position ? `Chapter ${chapter.position}` : null].filter(Boolean).join(' · ')

const DIFF_ORDER = { easy: 0, '': 1, medium: 1, hard: 2 }
const byDifficulty = (a, b) => (DIFF_ORDER[a.difficulty] ?? 1) - (DIFF_ORDER[b.difficulty] ?? 1)

// ─── Board (class game) ──────────────────────────────────────────────────────

// Generic category names for when the chapter's subtopics cannot fill four columns.
const GENERIC_CATS = ['⚡ Quick Facts', '🔍 Look Closer', '🤔 Think It Through', '🏆 Challenge']

function assembleBoard(pool) {
  // Group by topic; a topic is a category only if it can fill a whole column.
  const byTopic = new Map()
  for (const it of pool) if (it.topic) (byTopic.get(it.topic) || byTopic.set(it.topic, []).get(it.topic)).push(it)
  const full = [...byTopic.entries()].filter(([, v]) => v.length >= BOARD_ROWS).sort((a, b) => b[1].length - a[1].length)

  const used = new Set()
  const cats = []
  const tiles = []
  const column = (items) => {
    // Easiest tile is 10 points, hardest is 40: sort by difficulty, spread across rows.
    const sorted = shuffle(items).sort(byDifficulty)
    const step = sorted.length / BOARD_ROWS
    const picked = BOARD_POINTS.map((_, r) => sorted[Math.min(sorted.length - 1, Math.floor(r * step))])
    picked.forEach((it) => used.add(it))
    return picked.map((it, r) => ({ p: BOARD_POINTS[r], q: it.stem, o: it.options, a: it.options[it.correct], x: it.explanation || undefined }))
  }

  for (const [name, items] of full) {
    if (cats.length >= BOARD_CATS) break
    // A subtopic name is written for a table of contents, not a game board — trim it
    // to what fits a tile header.
    cats.push(name.length > 34 ? name.slice(0, 32).replace(/\s+\S*$/, '') + '…' : name)
    tiles.push(column(items))
  }
  // Fill the remaining columns from whatever is left, under generic headings.
  let rest = shuffle(pool.filter((it) => !used.has(it)))
  let g = 0
  while (cats.length < BOARD_CATS && rest.length >= BOARD_ROWS) {
    cats.push(GENERIC_CATS[g++ % GENERIC_CATS.length])
    tiles.push(column(rest.slice(0, Math.min(rest.length, BOARD_ROWS * 2))))
    rest = rest.filter((it) => !used.has(it))
  }
  if (cats.length < 2) return null   // a one-column board is a quiz, not a game
  return { cats, tiles }
}

// ─── Missions (solo) ─────────────────────────────────────────────────────────

// A type-in answer has to be something a student can plausibly spell from the clue:
// short, wordy, no numbers-with-units. "Mitochondria" yes; "ohm-1 cm2 mol-1" no.
const typeable = (s) => /^[A-Za-zऀ-ॿ][A-Za-zऀ-ॿ\s'-]{1,28}$/.test(s) && s.split(/\s+/).length <= 3

function assembleMissions(pool) {
  // Draw without replacement across missions, easiest first, so Quick Fire really is
  // quick and the later missions get the harder stems.
  const sorted = shuffle(pool).sort(byDifficulty)
  const used = new Set()
  const take = (n, pred = () => true) => {
    const out = []
    // Preferred items first, then anything left, so a mission is short only when the
    // pool truly is.
    for (let pass = 0; pass < 2 && out.length < n; pass++) {
      for (const it of sorted) {
        if (out.length >= n) break
        if (used.has(it) || (pass === 0 && !pred(it))) continue
        used.add(it); out.push(it)
      }
    }
    return out
  }
  const pickOptions = (it, n) => {
    const idx = shuffle(it.options.map((_, i) => i).filter((i) => i !== it.correct)).slice(0, n - 1).concat(it.correct)
    const o = shuffle(idx)
    return { o: o.map((i) => it.options[i]), a: o.indexOf(it.correct) }
  }

  const missions = []
  const m1 = take(MCQ_COUNT, (it) => it.options.length >= 4)
  if (m1.length) missions.push({
    type: 'mcq', title: 'Quick Fire Quiz', note: 'Tap the correct answer. One try per question!',
    items: m1.map((it) => ({ q: it.stem, ...pickOptions(it, 4), x: it.explanation || '' })),
  })

  const m2 = take(TF_COUNT)
  if (m2.length) missions.push({
    type: 'tf', title: 'True or False?', note: 'Is the answer shown the right one?',
    items: m2.map((it) => {
      const wrong = it.options.filter((_, i) => i !== it.correct)
      const showTrue = Math.random() < 0.5 || !wrong.length
      const shown = showTrue ? it.options[it.correct] : wrong[Math.floor(Math.random() * wrong.length)]
      return { q: `${it.stem}\nAnswer: ${shown}`, a: showTrue, x: showTrue ? (it.explanation || '') : `The correct answer is: ${it.options[it.correct]}` }
    }),
  })

  const m3 = take(TYPEIN_COUNT, (it) => typeable(it.options[it.correct])).filter((it) => typeable(it.options[it.correct]))
  if (m3.length) missions.push({
    type: 'typein', title: 'Type the Answer', note: 'Type your answer and press Check.',
    items: m3.map((it) => ({ q: it.stem, a: [it.options[it.correct].toLowerCase()], show: it.options[it.correct] })),
  })

  const m4 = take(MATCH_COUNT)
  if (m4.length) missions.push({
    type: 'match', title: 'Connections', note: 'Match each one with its answer — tap the right pair!',
    items: m4.map((it) => ({ q: it.stem, ...pickOptions(it, 3) })),
  })

  return missions
}

const missionsTotal = (missions) => (missions || []).reduce((n, m) => n + (m.type === 'task' ? 0 : (m.items || []).length), 0)

// ─── Spec validation (curated rows) ──────────────────────────────────────────

// A curated spec is admin-written JSON. It is checked here rather than trusted, so a
// typo in a hand-edited row fails loudly at write time instead of crashing a screen.
function validateSpec(spec) {
  const fail = (m) => { throw new Error(`activity spec: ${m}`) }
  if (!spec || typeof spec !== 'object') fail('not an object')
  if (!spec.board && !spec.missions) fail('needs board and/or missions')

  if (spec.board) {
    const b = spec.board
    if (!Array.isArray(b.cats) || b.cats.length < 2) fail('board.cats needs ≥2 categories')
    if (!Array.isArray(b.tiles) || b.tiles.length !== b.cats.length) fail('board.tiles must have one column per category')
    b.tiles.forEach((col, c) => {
      if (!Array.isArray(col) || !col.length) fail(`board.tiles[${c}] empty`)
      col.forEach((t, r) => {
        const p = `board.tiles[${c}][${r}]`
        if (!Number.isFinite(t.p) || t.p <= 0) fail(`${p}.p must be positive points`)
        if (typeof t.q !== 'string' || !t.q.trim()) fail(`${p}.q required`)
        if (typeof t.a !== 'string' || !t.a.trim()) fail(`${p}.a required`)
      })
    })
  }
  if (spec.missions) {
    if (!Array.isArray(spec.missions) || !spec.missions.length) fail('missions[] empty')
    spec.missions.forEach((m, mi) => {
      const at = `missions[${mi}]`
      if (!['mcq', 'tf', 'typein', 'match', 'task'].includes(m.type)) fail(`${at}.type invalid`)
      if (m.type === 'task') { if (!Array.isArray(m.steps) || !m.steps.length) fail(`${at}.steps[] required`); return }
      if (!Array.isArray(m.items) || !m.items.length) fail(`${at}.items[] required`)
      m.items.forEach((it, ii) => {
        const p = `${at}.items[${ii}]`
        if (typeof it.q !== 'string' || !it.q.trim()) fail(`${p}.q required`)
        if (m.type === 'mcq' || m.type === 'match') {
          if (!Array.isArray(it.o) || it.o.length < 2) fail(`${p}.o needs ≥2 options`)
          if (!Number.isInteger(it.a) || it.a < 0 || it.a >= it.o.length) fail(`${p}.a out of range`)
        } else if (m.type === 'tf') {
          if (typeof it.a !== 'boolean') fail(`${p}.a must be boolean`)
        } else if (m.type === 'typein') {
          if (!Array.isArray(it.a) || !it.a.length || !it.a.every((s) => typeof s === 'string' && s.trim())) fail(`${p}.a needs ≥1 accepted answer`)
        }
      })
    })
  }
  return true
}

// ─── Public API ──────────────────────────────────────────────────────────────

async function chapterMeta(chapterId) {
  const rows = await db.$queryRawUnsafe(
    `SELECT c.id::text AS id, c.name, c.position, c.class_level, s.name AS subject, s.slug AS subject_slug
       FROM chapters c JOIN subjects s ON s.id = c.subject_id
      WHERE c.id = $1::bigint AND c.deleted_at IS NULL`, chapterId)
  return rows[0] || null
}

// Subjects for a class that have at least one playable chapter, with how many the
// student has finished solo.
async function listSubjects(classLevel, userId) {
  if (!classLevel) return []
  const rows = await db.$queryRawUnsafe(
    `WITH playable AS (
       SELECT c.id, c.subject_id, c.name
         FROM chapters c
        WHERE c.class_level = $1 AND c.deleted_at IS NULL
          AND ( EXISTS (SELECT 1 FROM activities a WHERE a.chapter_id = c.id AND a.status = 'published')
             OR (SELECT count(*) FROM subtopics st JOIN mcq_questions m ON m.subtopic_id = st.id WHERE st.chapter_id = c.id) >= $3
             OR (SELECT count(*) FROM sections se JOIN questions q ON q.section_id = se.id WHERE se.chapter_id = c.id AND q.is_mcq) >= $3 )
     )
     SELECT s.name,
            -- The same subject can exist twice with two slugs, one of them random
            -- (uidbx0g). One card per name; the longest slug is the human one.
            (array_agg(DISTINCT s.slug ORDER BY s.slug))[1] AS any_slug,
            (SELECT slug FROM subjects s2 WHERE s2.name = s.name ORDER BY length(slug) DESC, slug LIMIT 1) AS slug,
            -- Distinct NAMES, to agree with the de-duplicated chapter list.
            count(DISTINCT lower(p.name))::int AS chapters, count(DISTINCT ap.chapter_id)::int AS done
       FROM playable p JOIN subjects s ON s.id = p.subject_id
       LEFT JOIN activity_progress ap ON ap.chapter_id = p.id AND ap.user_id = $2::uuid AND ap.attempts > 0
      GROUP BY s.name
      ORDER BY s.name`, classLevel, userId, MIN_USABLE)
  return rows.map(({ any_slug, ...r }) => ({ ...r, ...themeFor(r.name) }))
}

// Chapters of a subject with whether each is playable and the student's solo best.
async function listChapters(subjectSlug, classLevel, userId) {
  if (!classLevel) return []
  const rows = await db.$queryRawUnsafe(
    `SELECT c.id::text AS id, c.name, c.position,
            EXISTS (SELECT 1 FROM activities a WHERE a.chapter_id = c.id AND a.status = 'published') AS curated,
            ( (SELECT count(*) FROM subtopics st JOIN mcq_questions m ON m.subtopic_id = st.id WHERE st.chapter_id = c.id)
            + (SELECT count(*) FROM sections se JOIN questions q ON q.section_id = se.id WHERE se.chapter_id = c.id AND q.is_mcq) )::int AS bank,
            ap.best_score, ap.best_total, ap.attempts
       FROM chapters c JOIN subjects s ON s.id = c.subject_id
       LEFT JOIN activity_progress ap ON ap.chapter_id = c.id AND ap.user_id = $3::uuid
      WHERE s.name = (SELECT name FROM subjects WHERE slug = $1 LIMIT 1)
        AND c.class_level = $2 AND c.deleted_at IS NULL
      ORDER BY c.position, c.name`, subjectSlug, classLevel, userId)
  // Two subject rows with one name carry near-identical chapter lists. Collapse on
  // the chapter name, keeping whichever copy has more questions behind it.
  const byName = new Map()
  for (const r of rows) {
    const k = String(r.name).trim().toLowerCase()
    const prev = byName.get(k)
    if (!prev || (r.curated && !prev.curated) || (!!r.curated === !!prev.curated && r.bank > prev.bank)) byName.set(k, r)
  }
  return [...byName.values()].sort((a, b) => (a.position ?? 1e9) - (b.position ?? 1e9) || String(a.name).localeCompare(String(b.name))).map((r) => ({
    id: r.id, name: r.name, position: r.position,
    // `bank` counts rows before the renderability filter, so it slightly overstates. A
    // chapter that passes here but assembles thin gets a shorter activity, not a
    // broken one — the assemblers shrink to what they have.
    available: r.curated || r.bank >= MIN_USABLE,
    curated: r.curated,
    best: r.attempts ? { score: r.best_score, total: r.best_total } : null,
    attempts: r.attempts || 0,
  }))
}

// mode: 'board' | 'missions'
async function getActivity(chapterId, mode = 'missions') {
  const chapter = await chapterMeta(chapterId)
  if (!chapter) return null
  const base = {
    chapterId: chapter.id, subject: chapter.subject, classLevel: chapter.class_level,
    kicker: kickerFor(chapter, chapter.subject, chapter.class_level), title: chapter.name, ...themeFor(chapter.subject),
  }

  const curated = await db.$queryRawUnsafe(
    `SELECT spec FROM activities WHERE chapter_id = $1::bigint AND status = 'published' LIMIT 1`, chapterId)
  const spec = curated[0] && curated[0].spec
  if (spec && spec[mode]) {
    const out = { ...base, source: 'curated', mode }
    if (spec.kicker) out.kicker = spec.kicker
    if (spec.title) out.title = spec.title
    if (spec.emoji) out.emoji = spec.emoji
    if (spec.sub) out.sub = spec.sub
    if (mode === 'board') out.board = spec.board
    else { out.missions = spec.missions; out.total = missionsTotal(spec.missions) }
    return out
  }

  const pool = await loadPool(chapterId)
  if (pool.length < MIN_USABLE) return { ...base, source: 'assembled', mode, unavailable: true }
  if (mode === 'board') {
    const board = assembleBoard(pool)
    return board ? { ...base, source: 'assembled', mode, board } : { ...base, source: 'assembled', mode, unavailable: true }
  }
  const missions = assembleMissions(pool)
  return { ...base, source: 'assembled', mode, missions, total: missionsTotal(missions) }
}

// Record a finished SOLO run. Best is kept when the new score is lower — assembled runs
// use different questions each time, so a lower later score is not a regression.
// Compared as a fraction: 16/20 beats 9/10 numerically but is the weaker run.
async function saveResult(userId, chapterId, { score, total }) {
  const t = Math.max(0, Number(total) || 0)
  const s = Math.max(0, Math.min(Number(score) || 0, t))
  await db.$executeRawUnsafe(
    `INSERT INTO activity_progress (user_id, chapter_id, best_score, best_total, last_score, last_total, attempts, updated_at)
     VALUES ($1::uuid, $2::bigint, $3, $4, $3, $4, 1, now())
     ON CONFLICT (user_id, chapter_id) DO UPDATE SET
       last_score = EXCLUDED.last_score, last_total = EXCLUDED.last_total,
       attempts = activity_progress.attempts + 1, updated_at = now(),
       best_score = CASE WHEN EXCLUDED.best_total > 0 AND EXCLUDED.best_score * COALESCE(NULLIF(activity_progress.best_total, 0), 1)
                              >  activity_progress.best_score * EXCLUDED.best_total
                         THEN EXCLUDED.best_score ELSE activity_progress.best_score END,
       best_total = CASE WHEN EXCLUDED.best_total > 0 AND EXCLUDED.best_score * COALESCE(NULLIF(activity_progress.best_total, 0), 1)
                              >  activity_progress.best_score * EXCLUDED.best_total
                         THEN EXCLUDED.best_total ELSE activity_progress.best_total END`,
    userId, chapterId, s, t)
  const row = await db.$queryRawUnsafe(
    `SELECT best_score, best_total, attempts FROM activity_progress WHERE user_id = $1::uuid AND chapter_id = $2::bigint`, userId, chapterId)
  return row[0] || null
}

// Admin / seed: write or replace a curated spec.
async function upsertCurated(chapterId, spec, { status = 'published', source = 'curated' } = {}) {
  validateSpec(spec)
  await db.$executeRawUnsafe(
    `INSERT INTO activities (chapter_id, spec, status, source, updated_at)
     VALUES ($1::bigint, $2::jsonb, $3, $4, now())
     ON CONFLICT (chapter_id) DO UPDATE SET spec = EXCLUDED.spec, status = EXCLUDED.status, source = EXCLUDED.source, updated_at = now()`,
    chapterId, JSON.stringify(spec), status, source)
}

module.exports = {
  listSubjects, listChapters, getActivity, saveResult, upsertCurated, validateSpec,
  loadPool, assembleBoard, assembleMissions, toText, MIN_USABLE,
}
