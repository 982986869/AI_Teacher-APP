'use strict'

// Offline seed bank (the original 400 questions), loaded once. Generated from the
// frontend source of truth by scripts/build-braingym-seed.js. Seed questions are
// grade-agnostic mental arithmetic and are always safe to serve.

const path = require('path')
const { signature } = require('./dedup')

let SEED = []
try {
  SEED = require(path.resolve(__dirname, '../../data/brainGymSeed.json'))
} catch {
  SEED = []
}

// Precompute lookups.
const BY_CATEGORY = {}
const SIGNATURES = new Set()
const SIG_TO_SEED = new Map()
for (const item of SEED) {
  ;(BY_CATEGORY[item.skill] || (BY_CATEGORY[item.skill] = [])).push(item)
  const sig = signature(item.q)
  SIGNATURES.add(sig)
  SIG_TO_SEED.set(sig, item)
}

function fisherYates(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

// Filter by category (skill) and optionally level, excluding already-seen seedIds.
// Widens gracefully if a bucket is too small (mirrors the frontend behaviour).
function pickSeed({ category, level, count = 5, excludeSeedIds = new Set() } = {}) {
  const all = BY_CATEGORY[category] || []
  const tiers = [
    all.filter((x) => x.level === level),
    all,
    SEED, // last resort: any category
  ]
  let pool = tiers.find((t) => t.length >= count) || all
  const fresh = pool.filter((x) => !excludeSeedIds.has(x.seedId))
  const usable = fresh.length >= count ? fresh : pool

  return fisherYates(usable).slice(0, count).map((x) => ({
    source: 'seed',
    seedId: x.seedId,
    category: x.skill,
    difficulty: null,
    level: x.level,
    questionText: x.q,
    q: x.q,
    answer: String(x.answer),
    answerValue: x.answer,
    grade: null,
  }))
}

// Sample seed texts for a category (used as anti-copy examples in the LLM prompt).
function seedExamples(category, n = 6) {
  const all = BY_CATEGORY[category] || []
  return fisherYates(all).slice(0, n).map((x) => x.q)
}

module.exports = { SEED, BY_CATEGORY, SIGNATURES, SIG_TO_SEED, pickSeed, seedExamples }
