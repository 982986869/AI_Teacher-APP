'use strict'

// Quality score (pure). Combines correctness, clarity, difficulty fit, uniqueness
// and grammar into a single 0..1 score. Only questions at/above QUALITY_MIN
// become permanently ACTIVE (see pipeline).

function clamp01(x) { return Math.max(0, Math.min(1, x)) }

// clarity: penalise too-short / too-long stems and reward a clear interrogative.
function clarityScore(text) {
  const t = String(text || '').trim()
  const len = t.length
  let s = 1
  if (len < 6) s -= 0.5
  if (len > 160) s -= 0.3
  if (!/[?=]/.test(t)) s -= 0.15           // a question should ask or set up an equation
  if (/\b(\w+)\s+\1\b/i.test(t)) s -= 0.1   // accidental word repetition
  return clamp01(s)
}

// grammar: lightweight surface checks.
function grammarScore(text) {
  const t = String(text || '')
  let s = 1
  if (/\s{2,}/.test(t.trim())) s -= 0.15            // double spaces
  if (/^[a-z]/.test(t.trim())) s -= 0.1             // lowercase start
  const open = (t.match(/\(/g) || []).length
  const close = (t.match(/\)/g) || []).length
  if (open !== close) s -= 0.2                       // unbalanced parens
  return clamp01(s)
}

// uniqueness is supplied by the dedup layer (1 - nearest jaccard/cosine).
function computeQuality({ normalized, validationScore = 1, uniqueness = 1, targetDifficulty } = {}) {
  if (!normalized) return { score: 0, breakdown: { correctness: 0 } }

  const correctness = clamp01(validationScore)                       // structural + guardrail
  const clarity = clarityScore(normalized.questionText)
  const grammar = grammarScore(normalized.questionText)
  const difficultyFit = targetDifficulty
    ? (normalized.difficulty === targetDifficulty ? 1 : 0.6)
    : 1
  const uniq = clamp01(uniqueness)

  const breakdown = { correctness, clarity, grammar, difficultyFit, uniqueness: uniq }
  const score =
    correctness * 0.40 +
    uniq * 0.20 +
    clarity * 0.15 +
    difficultyFit * 0.15 +
    grammar * 0.10

  return { score: +clamp01(score).toFixed(3), breakdown }
}

module.exports = { computeQuality, clarityScore, grammarScore }
