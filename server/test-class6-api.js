'use strict'
// Ad-hoc: exercise the resources + mcqPractice service layer for Class 6 Science
// exactly as the HTTP controllers do, to prove the existing APIs serve the new data.
const fs = require('fs')
const path = require('path')
// load DATABASE_URL from server/.env into process.env (no dotenv dependency)
const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8')
const m = env.match(/^DATABASE_URL=(.*)$/m)
process.env.DATABASE_URL = m[1].trim().replace(/^["']|["']$/g, '')

const resources = require('./src/services/resources.service')
const mcq = require('./src/services/mcqPractice.service')

const CH = 'electricity-and-circuits'
const OT_CH = 'food-where-does-it-come-from-deleted'

;(async () => {
  const subs = await resources.listSubjects()
  const sci = subs.find((s) => s.slug === 'science')
  console.log('GET /resources/subjects            → Science present:', !!sci, sci || '')

  const chapters = await mcq.listChaptersWithContent('science', 6)
  console.log(`GET /mcq-practice/science/chapters?class=6   → ${chapters.length} chapters, e.g. "${chapters[0]?.name}"`)

  const subtopics = await mcq.listSubtopics('science', CH, 6)
  console.log(`GET /mcq-practice/science/${CH}/subtopics?class=6 → subtopics:`, subtopics.map((s) => `${s.name}(${s.count ?? s.questionCount ?? '?'})`).join(', '))

  const test = await mcq.getChapterTest('science', CH, 6)
  const q0 = test[0]
  console.log(`GET /mcq-practice/science/${CH}/test?class=6 → ${test.length} MCQs`)
  if (q0) console.log(`    Q1: "${(q0.question || '').slice(0, 55)}"  correctIdx=${q0.correct}`)

  const notes = await resources.getNotesByPath('science', CH, 6)
  console.log(`GET /resources/notes/science/${CH}?class=6 → ${notes ? notes.blocks.length + ' note-blocks, first="' + notes.blocks[0]?.title + '"' : 'null'}`)

  const online = await resources.getQuestionsByPath('science', OT_CH, 'online_test', 6)
  console.log(`GET /resources/content/science/${OT_CH}/online_test?class=6 → ${online ? online.length + ' questions' : 'null'}`)

  process.exit(0)
})().catch((e) => { console.error('ERR:', e.message); process.exit(1) })
