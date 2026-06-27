'use strict'

// End-to-end verification of the Mastery Lifecycle Engine against the REAL DB.
// Practices a concept to mastery, then ages it (lastSeen back-dated) and confirms
// the forgetting curve moves it Mastered → Needs Revision → Forgotten, and that
// the revision scheduler surfaces it.  node scripts/lifecycle-verify.js
process.env.MOCK_AI = 'true'
require('dotenv').config()

const db = require('../src/config/database')
const mastery = require('../src/services/mastery.service')

const SUBJECT = 'Maths'
const CHAPTER = 'Polynomials'
const NAME = 'Lifecycle Test Concept'

async function findState(userId) {
  const all = await mastery.loadConcepts(userId, { subject: SUBJECT })
  return all.find((x) => x.concept === NAME)
}
async function ageTo(userId, conceptId, days) {
  await db.$executeRawUnsafe(
    `UPDATE student_concepts SET "lastSeen" = now() - ($3 || ' days')::interval WHERE "userId" = $1::uuid AND concept_id = $2::uuid`,
    userId, conceptId, String(days),
  )
}

async function main() {
  let user = await db.user.findFirst({ where: { name: 'BrainGym Verify' }, select: { id: true } })
  if (!user) user = await db.user.create({ data: { name: 'BrainGym Verify', grade: 'Class 9' }, select: { id: true } })
  const userId = user.id

  await db.$executeRawUnsafe(
    `INSERT INTO concepts (subject, chapter, name, slug) VALUES ($1,$2,$3,$4) ON CONFLICT (subject, chapter, name) DO NOTHING`,
    SUBJECT, CHAPTER, NAME, 'lifecycle-test-concept',
  )
  const c = await db.$queryRawUnsafe(`SELECT id FROM concepts WHERE subject=$1 AND chapter=$2 AND name=$3`, SUBJECT, CHAPTER, NAME)
  const conceptId = c[0].id

  // 1. Practise to mastery (timed correct answers + a confirmation).
  for (let i = 0; i < 6; i++) await mastery.updateMastery({ userId, conceptId, signal: 'quiz_correct', timeMs: 4000 })
  await mastery.updateMastery({ userId, conceptId, signal: 'understood' })
  const sc = await mastery.getStudentConcept(userId, conceptId)
  console.log('after practice →', { mastery: sc.mastery.toFixed(2), confidence: sc.confidence.toFixed(2), streak: sc.streak, speed: sc.speedScore.toFixed(2), retention: sc.retentionScore.toFixed(2) })

  const fresh = await findState(userId)
  console.log('FRESH    →', fresh.state, `| retention ${fresh.retention}% | "${fresh.phrasing}"`)

  await ageTo(userId, conceptId, 30)
  const aged30 = await findState(userId)
  console.log('+30 days →', aged30.state, `| retention ${aged30.retention}% | "${aged30.phrasing}"`)

  await ageTo(userId, conceptId, 120)
  const aged120 = await findState(userId)
  console.log('+120 days→', aged120.state, `| retention ${aged120.retention}% | "${aged120.phrasing}"`)

  const rev = await mastery.getConceptsNeedingRevision(userId, { subject: SUBJECT })
  const pick = await mastery.pickRevisionConcept(userId, { subject: SUBJECT })
  const prof = await mastery.getLearningProfile(userId, { subject: SUBJECT })
  console.log('needsRevision →', rev.length, 'top:', rev[0] && rev[0].concept)
  console.log('pickRevision  →', pick && pick.concept, '|', pick && pick.phrasing)
  console.log('profile byState →', JSON.stringify(prof.byState))

  const ok = fresh.state === 'Mastered' && aged30.state === 'Needs Revision' && aged120.state === 'Forgotten' && rev.length >= 1 && !!pick
  console.log(ok ? '\n✅ LIFECYCLE VERIFY PASSED' : '\n❌ LIFECYCLE VERIFY FAILED')
  await db.$disconnect()
  process.exit(ok ? 0 : 1)
}

main().catch((e) => { console.error('VERIFY ERROR', e); process.exit(1) })
