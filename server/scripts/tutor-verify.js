'use strict'

// Live verification of the tutor additions (Mistake Book + Revision Calendar +
// Analytics composition) against the REAL DB.  node scripts/tutor-verify.js
process.env.MOCK_AI = 'true'
require('dotenv').config()

const db = require('../src/config/database')
const mistakeBook = require('../src/services/mistakeBook.service')
const mastery = require('../src/services/mastery.service')
const memory = require('../src/services/memory.service')
const braingym = require('../src/services/braingym.service')
const teacherBridge = require('../src/services/braingym/teacherBridge')

async function main() {
  let user = await db.user.findFirst({ where: { name: 'BrainGym Verify' }, select: { id: true } })
  if (!user) user = await db.user.create({ data: { name: 'BrainGym Verify', grade: 'Class 9' }, select: { id: true } })
  const userId = user.id

  // 1. MISTAKE BOOK — capture a wrong generated question, verify enrichment + dedup ─
  const gq = await db.$queryRawUnsafe(`SELECT id, "questionText", answer FROM generated_questions WHERE grade='Class 9' LIMIT 1`)
  let mistakeOk = false
  if (gq.length) {
    const qid = gq[0].id
    await mistakeBook.captureWrong({ userId, source: 'braingym', grade: 'Class 9', items: [{ id: qid, source: 'generated', category: 'reasoning', difficulty: 'easy', isCorrect: false, answerGiven: '999' }] })
    let open = await mistakeBook.getUnresolved(userId, { limit: 10 })
    const row1 = open.find((m) => m.questionText === gq[0].questionText)
    console.log('mistake captured →', row1 && { q: row1.questionText.slice(0, 40), your: row1.studentAnswer, correct: row1.correctAnswer, timesWrong: row1.timesWrong })
    // re-miss → timesWrong increments, stays unresolved
    await mistakeBook.captureWrong({ userId, source: 'braingym', grade: 'Class 9', items: [{ id: qid, source: 'generated', category: 'reasoning', difficulty: 'easy', isCorrect: false, answerGiven: '888' }] })
    open = await mistakeBook.listMistakes(userId, { status: 'unresolved', limit: 10 })
    const row2 = open.find((m) => m.questionText === gq[0].questionText)
    console.log('after re-miss → timesWrong:', row2 && row2.timesWrong)
    await mistakeBook.resolveMistake(userId, row2.id)
    const after = await mistakeBook.listMistakes(userId, { status: 'resolved', limit: 10 })
    const resolved = after.find((m) => m.id === row2.id)
    console.log('resolved status:', resolved && resolved.status, '| open now:', await mistakeBook.countOpen(userId))
    mistakeOk = !!(row1 && row1.correctAnswer != null && row2 && row2.timesWrong >= 2 && resolved && resolved.status === 'resolved')
  } else {
    console.log('(no generated questions yet — run braingym-verify first)')
  }

  // 2. REVISION CALENDAR — the lifecycle-verify left a Forgotten Maths concept ─────
  const cal = await mastery.getRevisionCalendar(userId, { subject: 'Maths' })
  console.log('revision calendar → dueCount:', cal.dueCount, '| top due:', cal.due[0] && `${cal.due[0].concept} (${cal.due[0].state}, ${cal.due[0].retention}%)`)

  // 3. ANALYTICS composition (same calls the /analytics endpoint makes) ────────────
  const [summary, profile, skills, bg, open] = await Promise.all([
    memory.getSummary(userId).catch(() => ({})),
    mastery.getLearningProfile(userId).catch(() => ({})),
    teacherBridge.getBrainGymSkillSummary(db, userId).catch(() => ({ phrasings: [] })),
    braingym.getProgress(userId).catch(() => ({})),
    mistakeBook.countOpen(userId).catch(() => 0),
  ])
  console.log('analytics → conceptStates:', JSON.stringify(profile.byState || {}))
  console.log('analytics → brainGym xp/quizzes/streak:', bg.totalXp, bg.quizzesCompleted, bg.currentStreak, '| skillSignals:', (skills.phrasings || []).length, '| openMistakes:', open, '| streak:', summary.learningStreak)

  const ok = mistakeOk && cal.dueCount >= 1 && profile.byState
  console.log(ok ? '\n✅ TUTOR VERIFY PASSED' : '\n❌ TUTOR VERIFY FAILED')
  await db.$disconnect()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => { console.error('VERIFY ERROR', e); process.exit(1) })
