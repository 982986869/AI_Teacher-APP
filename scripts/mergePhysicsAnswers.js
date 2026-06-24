'use strict'

// Merge physics_practice subtopic data (topic_id per question) with the pulled
// physics answer key (id -> correctOptionId + explanation) into per-chapter
// <chapter>.by_topic.json — NO network/fetch, no account attempts.
// Output is consumed by scripts/importMcqPractice.js (Physics source).

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const DIR = path.join(ROOT, 'src', 'data', 'physics_practice')
const JSON_DIR = path.join(DIR, 'json')
const KEY = require(path.join(ROOT, 'src', 'data', 'physics_questions', 'answer_key.json'))

let chapters = 0, subs = 0, qs = 0, withAns = 0
for (const f of fs.readdirSync(JSON_DIR).filter((x) => x.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(JSON_DIR, f), 'utf8'))
  const topics = new Map() // topicId -> { topicId, topicName, questions: [] }
  for (const q of j.questions || []) {
    const ans = KEY[String(q.id)] || {}
    const tId = q.topic_id
    if (!topics.has(tId)) topics.set(tId, { topicId: tId, topicName: q.topic_name, questions: [] })
    topics.get(tId).questions.push({
      id: q.id,
      question: q.question,
      difficulty: q.difficulty_label || null,
      options: q.options, // [{ id, option }]
      topicId: tId,
      topicName: q.topic_name,
      correctOptionId: ans.correctOptionId != null ? ans.correctOptionId : null,
      explanation: ans.explanation || null,
    })
    qs++
    if (ans.correctOptionId != null) withAns++
  }
  const out = { chapter_id: j.chapter_id, chapter_name: j.chapter_name, topics: [...topics.values()] }
  fs.writeFileSync(path.join(DIR, f.replace(/\.json$/, '.by_topic.json')), JSON.stringify(out, null, 2))
  chapters++
  subs += topics.size
  console.log(`✓ ${j.chapter_name}: ${topics.size} subtopics, ${(j.questions || []).length} questions`)
}
console.log(`\nDONE: ${chapters} chapters, ${subs} subtopics, ${qs} questions, ${withAns} with answer`)
