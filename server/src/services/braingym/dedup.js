'use strict'

// Duplicate detection (pure). Two layers:
//   1. signature()  — canonical hash for O(1) exact / formatting-only duplicates.
//   2. jaccard()    — token-shingle overlap for reworded near-duplicates.
//   3. cosineSim()  — embedding similarity (when vectors are available).
// Different NUMERIC VALUES are intentionally NOT duplicates — that is exactly the
// "fresh variant" we want (same objective, new numbers).

const crypto = require('crypto')
const { DEDUP } = require('./constants')

// Canonical text: lowercase, unify operator glyphs, collapse whitespace, keep
// digits (so "2+2" ≠ "3+3") but drop incidental punctuation.
function canonical(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[×✕*]/g, 'x')
    .replace(/[÷]/g, '/')
    .replace(/[−–—]/g, '-')
    .replace(/[?？.！!,:;'"()]/g, ' ')
    .replace(/([+\-x/=])/g, ' $1 ') // normalise operator spacing: "2+2" == "2 + 2"
    .replace(/\s+/g, ' ')
    .trim()
}

function signature(text) {
  return crypto.createHash('sha1').update(canonical(text)).digest('hex')
}

// Word + number tokens for shingling.
function tokens(text) {
  return canonical(text).split(' ').filter(Boolean)
}

function jaccard(a, b) {
  const sa = new Set(tokens(a))
  const sb = new Set(tokens(b))
  if (sa.size === 0 && sb.size === 0) return 1
  let inter = 0
  for (const t of sa) if (sb.has(t)) inter += 1
  const union = sa.size + sb.size - inter
  return union === 0 ? 0 : inter / union
}

function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

// Is `candidateText` a duplicate of any item in `existing` (array of {text}|string)?
// Uses exact-signature first, then token Jaccard. Returns {duplicate, reason, score, against}.
function isDuplicate(candidateText, existing = [], { jaccardThreshold = DEDUP.JACCARD_REJECT } = {}) {
  const sig = signature(candidateText)
  let worst = { duplicate: false, reason: null, score: 0, against: null }
  for (const item of existing) {
    const text = typeof item === 'string' ? item : item.text ?? item.questionText ?? item.q
    if (text == null) continue
    if ((typeof item === 'object' && item.signature && item.signature === sig)
        || signature(text) === sig) {
      return { duplicate: true, reason: 'exact', score: 1, against: text }
    }
    const j = jaccard(candidateText, text)
    if (j >= jaccardThreshold) {
      return { duplicate: true, reason: 'jaccard', score: +j.toFixed(3), against: text }
    }
    if (j > worst.score) worst = { duplicate: false, reason: null, score: +j.toFixed(3), against: text }
  }
  return worst
}

// Embedding-based near-duplicate check (when vectors exist).
function isDuplicateByEmbedding(vec, existingVecs = [], { cosineThreshold = DEDUP.COSINE_REJECT } = {}) {
  for (const ev of existingVecs) {
    const v = ev.embedding || ev
    const s = cosineSim(vec, v)
    if (s >= cosineThreshold) return { duplicate: true, score: +s.toFixed(3), against: ev.id ?? null }
  }
  return { duplicate: false, score: 0, against: null }
}

module.exports = { canonical, signature, tokens, jaccard, cosineSim, isDuplicate, isDuplicateByEmbedding }
