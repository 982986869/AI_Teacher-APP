'use strict'
// Shape-checks the optional `source` of POST /api/ai/lesson/generate. Pure, so the
// rules are unit-tested; ownership/scope checks happen later in books.service.
const { MAX_TOPICS } = require('./books.service')

const KINDS = ['summary', 'topics']
const toInt = (v) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null)

function parseSourceBody(body = {}) {
  const s = body.source
  if (s == null) return { source: null, error: null }
  if (typeof s !== 'object' || Array.isArray(s)) return { source: null, error: 'source must be an object' }
  const chapterId = toInt(s.chapterId)
  if (!chapterId) return { source: null, error: 'source.chapterId must be a positive integer' }
  if (!KINDS.includes(s.kind)) return { source: null, error: 'source.kind must be "summary" or "topics"' }
  if (s.kind === 'summary') return { source: { chapterId, kind: 'summary', topicIds: [] }, error: null }
  if (!Array.isArray(s.topicIds)) return { source: null, error: 'source.topicIds must be an array' }
  const ids = []
  for (const v of s.topicIds) {
    const n = toInt(v)
    if (!n) return { source: null, error: 'source.topicIds must be positive integers' }
    if (!ids.includes(n)) ids.push(n)
  }
  if (ids.length < 1 || ids.length > MAX_TOPICS) return { source: null, error: `Pick 1 to ${MAX_TOPICS} topics.` }
  return { source: { chapterId, kind: 'topics', topicIds: ids }, error: null }
}

module.exports = { parseSourceBody }
