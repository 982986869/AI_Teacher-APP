'use strict'

// Biology_practice already has subtopics (topic_id) + answers (correct_option_id)
// — no fetching needed. This LOCAL converter turns each flat chapter json into a
// <chapter>.by_topic.json that scripts/importMcqPractice.js can import.

const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'src', 'data', 'biology_practice')
const JSON_DIR = path.join(DIR, 'json')

const files = fs.readdirSync(JSON_DIR).filter((f) => f.endsWith('.json'))
let totalQ = 0
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(JSON_DIR, f), 'utf8'))
  const topics = new Map()
  for (const q of j.questions || []) {
    const tid = q.topic_id
    if (!topics.has(tid)) topics.set(tid, { topicId: tid, topicName: q.topic_name, questions: [] })
    topics.get(tid).questions.push({
      id: q.id,
      question: q.question || q.question_html || '',
      options: (q.options || []).map((o) => ({ id: o.id, option: o.html || o.text || '' })),
      correctOptionId: q.correct_option_id != null ? q.correct_option_id : null,
      explanation: q.explanation || null,
      topicId: tid,
      topicName: q.topic_name,
    })
    totalQ++
  }
  const out = { chapter_id: j.chapter_id, chapter_name: j.chapter_name, topics: [...topics.values()] }
  fs.writeFileSync(path.join(DIR, f.replace(/\.json$/, '.by_topic.json')), JSON.stringify(out, null, 2))
  console.log(`✓ ${j.chapter_name}: ${topics.size} subtopics, ${(j.questions || []).length} q`)
}
console.log(`\nDONE: ${files.length} chapters, ${totalQ} questions → *.by_topic.json`)
