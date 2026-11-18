// scripts/eval-doubts.js
// Golden-set quality eval for the AI Teacher's in-lesson doubt answers.
//
//   node scripts/eval-doubts.js --label baseline [--base http://localhost:5000]
//
// Asks every case in eval/doubts.json through POST /api/ai/ask (the app's request
// shape), has Claude judge each answer 0–2 on four criteria, and writes
// eval/results/<label>.json + .md. Compare two labels to see whether a change helped.
//
// LOCAL ONLY. Every /api/ai/ask call writes language memory, doubt events and mastery
// for the asking student, so running this against AWS would skew a real student's
// record. assertLocalBase() refuses anything that is not localhost.
//
// No new model: the judge uses AI_KNOWLEDGE_MODEL (else AI_DOUBT_MODEL). It is the
// same model family as the answerer, so the .md lists every answer for a human skim.

const fs = require('fs')
const path = require('path')

const CRITERIA = ['correct', 'onTopic', 'rules', 'teaching']

function assertLocalBase(url) {
  let host
  try { host = new URL(url).hostname } catch (_) { throw new Error(`Not a URL: ${url}`) }
  if (host !== 'localhost' && host !== '127.0.0.1') {
    throw new Error(`eval-doubts runs only against a local server (got ${host}); it writes to the asking student's records.`)
  }
}

function summarise(results) {
  const byCriterion = Object.fromEntries(CRITERIA.map((c) => [c, 0]))
  for (const r of results) for (const c of CRITERIA) byCriterion[c] += Number((r.scores || {})[c]) || 0
  const total = CRITERIA.reduce((s, c) => s + byCriterion[c], 0)
  return { cases: results.length, total, max: results.length * CRITERIA.length * 2, byCriterion }
}

const JUDGE_SYSTEM = `You grade one answer given by an AI school teacher to a student's question asked in the middle of a lesson.
Score each criterion 0, 1 or 2:
- correct: the science/maths/facts are right and nothing false or contradictory is said (2 = fully right, 0 = any real error).
- onTopic: it answers what was asked, in the context of the lesson and the student's class (not a different topic; depth suits the class).
- rules: follows the house rules: replies in the EXPECTED LANGUAGE; gender-neutral (never assumes the student is a girl or a boy); no invented memories or compliments; no false promises/guarantees; does not claim to see or not see slides; short, spoken style; not cut off mid-way.
- teaching: teaches well: direct, clear, corrects a wrong premise first, guides homework instead of doing it, checks understanding when it fits.
Also respect the case's MUST DO and MUST NOT lists.
Reply with JSON only: {"correct":n,"onTopic":n,"rules":n,"teaching":n,"note":"one short sentence"}`

function parseJudge(text) {
  const m = String(text || '').match(/\{[\s\S]*\}/)
  try {
    const j = JSON.parse(m ? m[0] : '')
    const scores = Object.fromEntries(CRITERIA.map((c) => [c, Math.max(0, Math.min(2, Number(j[c]) || 0))]))
    return { scores, note: String(j.note || '') }
  } catch (_) {
    return { scores: Object.fromEntries(CRITERIA.map((c) => [c, 0])), note: 'judge-parse-failed' }
  }
}

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
  const jwt = require('jsonwebtoken')
  const Anthropic = require('@anthropic-ai/sdk')

  const args = process.argv.slice(2)
  const arg = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def }
  const label = arg('label', 'run')
  const base = arg('base', 'http://localhost:5000')
  assertLocalBase(base)

  const golden = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'eval', 'doubts.json'), 'utf8'))
  const judgeModel = process.env.AI_KNOWLEDGE_MODEL || process.env.AI_DOUBT_MODEL
  const client = new Anthropic()
  const tokens = {}
  const tokenFor = (lesson) => (tokens[lesson.ownerId] ||= jwt.sign({ sub: lesson.ownerId }, process.env.JWT_SECRET, { expiresIn: '30m' }))

  const results = []
  for (const c of golden.cases) {
    const lesson = golden.lessons[c.lesson]
    if (!lesson) { console.warn(`skip ${c.id}: no lesson "${c.lesson}"`); continue }
    const body = { text: c.q, subject: lesson.subject, lessonId: lesson.id, slideIndex: c.slide }
    if (c.history) body.history = c.history
    if (c.pending) body.pending = c.pending
    const t0 = Date.now()
    let status = 0; let answer = ''
    try {
      const res = await fetch(`${base}/api/ai/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenFor(lesson)}` }, body: JSON.stringify(body) })
      status = res.status
      const j = await res.json().catch(() => ({}))
      answer = (j.data && j.data.answer) || j.error || j.message || ''
    } catch (e) { answer = `REQUEST FAILED: ${e.message}` }
    const ms = Date.now() - t0

    let judged
    try {
      const msg = await client.messages.create({
        model: judgeModel, max_tokens: 400, system: JUDGE_SYSTEM,
        messages: [{ role: 'user', content: [
          `STUDENT CLASS: ${lesson.classLevel}  SUBJECT: ${lesson.subject}  EXPECTED LANGUAGE: ${c.expectLang === 'hi' ? 'Hindi (Devanagari)' : 'English'}`,
          c.history ? `EARLIER IN THE CHAT:\n${c.history.map((h) => `${h.role}: ${h.content}`).join('\n')}` : '',
          `QUESTION (student is on slide ${c.slide + 1}): ${c.q}`,
          `MUST DO: ${c.mustDo}`, `MUST NOT: ${c.mustNot}`,
          `TEACHER'S ANSWER:\n${answer}`,
        ].filter(Boolean).join('\n\n') }],
      })
      judged = parseJudge((msg.content || []).map((b) => b.text || '').join(''))
    } catch (e) { judged = { scores: Object.fromEntries(CRITERIA.map((k) => [k, 0])), note: `judge-error: ${e.message}` } }

    const sum = CRITERIA.reduce((s, k) => s + judged.scores[k], 0)
    results.push({ id: c.id, lesson: c.lesson, slide: c.slide, q: c.q, status, ms, answer, ...judged })
    console.log(`${c.id.padEnd(26)} ${String(status).padEnd(4)} ${String(ms).padStart(6)}ms  ${sum}/8  ${judged.note.slice(0, 70)}`)
  }

  const s = summarise(results)
  const msSorted = results.map((r) => r.ms).sort((a, b) => a - b)
  const medianMs = msSorted.length ? msSorted[Math.floor(msSorted.length / 2)] : 0
  const outDir = path.join(__dirname, '..', 'eval', 'results')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify({ label, judgeModel, at: new Date().toISOString(), summary: s, medianMs, results }, null, 2))
  const md = [
    `# Doubt eval: ${label}`, '',
    `Judge: ${judgeModel} · ${new Date().toISOString()} · median ${medianMs} ms`, '',
    '| criterion | score |', '|---|---|',
    ...CRITERIA.map((k) => `| ${k} | ${s.byCriterion[k]} / ${s.cases * 2} |`),
    `| **total** | **${s.total} / ${s.max}** |`, '',
    ...results.map((r) => `## ${r.id} (${CRITERIA.reduce((t, k) => t + r.scores[k], 0)}/8, ${r.ms} ms)\n**Q:** ${r.q}\n\n**A:** ${String(r.answer).replace(/\n/g, ' / ')}\n\n_${r.note}_ · ${CRITERIA.map((k) => `${k} ${r.scores[k]}`).join(' · ')}\n`),
  ].join('\n')
  fs.writeFileSync(path.join(outDir, `${label}.md`), md)
  console.log(`\nTOTAL ${s.total}/${s.max}  ${CRITERIA.map((k) => `${k} ${s.byCriterion[k]}`).join('  ')}  median ${medianMs}ms`)
  console.log(`wrote eval/results/${label}.md`)
}

if (require.main === module) main().catch((e) => { console.error(e.message || e); process.exit(1) })

module.exports = { assertLocalBase, summarise, parseJudge, CRITERIA }
