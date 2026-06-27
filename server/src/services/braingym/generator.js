'use strict'

// ─── Question Generation Agent ──────────────────────────────────────────────
// Produces NEW questions that test the SAME learning objective as the seed bank
// but with fresh values / scenarios / wording. Two engines:
//   • LLM engine  — Anthropic Claude, strict JSON, hard class guardrails in the
//                   prompt. Used when an API key is configured and MOCK_AI is off.
//   • Fallback    — deterministic, grade-safe numeric generator. Always available
//                   (offline, tests, and as recovery when the LLM fails).
// Every candidate is later run through validator + dedup + quality before saving.

const { config } = require('../../config/env')
const { CATEGORIES, BLOOM_BY_CATEGORY, PROMPT_VERSION, DIFFICULTY_LEVEL } = require('./constants')
const { parseGrade, gradeNum, CLASS_CONCEPTS, allowedConceptsFor } = require('./grade')

// ── deterministic RNG (so generation is reproducible in tests, varied in prod) ─
function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1))

// Operand magnitude grows with difficulty — but the OPERATION (the class concept)
// never changes, so a "challenge" Class 9 question is still Class 9.
const SCALE = { easy: 1, medium: 2, hard: 3, challenge: 4 }

// Pick a concept guaranteed to be in the student's class list (keeps guardrail green).
function pickConcept(grade, category) {
  const num = gradeNum(grade)
  const list = CLASS_CONCEPTS[num] || CLASS_CONCEPTS[9]
  const idx = Math.max(0, CATEGORIES.indexOf(category)) % list.length
  return list[idx]
}

// ── Numeric template pools per category. Each returns { text, value }. ────────
function genFluency(rng, s, num) {
  const a = randInt(rng, 2 * s, 9 * s)
  const b = randInt(rng, 2 * s, 9 * s)
  const ops = [
    { t: `${a} + ${b} = ?`, v: a + b },
    { t: `${a + b} − ${b} = ?`, v: a },
    { t: `${a} × ${b} = ?`, v: a * b },
    { t: `${a * b} ÷ ${b} = ?`, v: a },
  ]
  return ops[randInt(rng, 0, ops.length - 1)]
}
function genUnderstanding(rng, s, num) {
  const choices = []
  // percentage (Class ≥7)
  if (num >= 7) { const p = [10, 15, 20, 25][randInt(rng, 0, 3)]; const base = 20 * randInt(rng, 1, 5 * s); choices.push({ t: `${p}% of ${base} = ?`, v: (p * base) / 100 }) }
  // squares / roots (Class ≥8)
  if (num >= 8) { const n = randInt(rng, 2 + s, 6 + 2 * s); choices.push({ t: `${n}² = ?`, v: n * n }); choices.push({ t: `√${n * n} = ?`, v: n }) }
  // halves / doubles (all classes)
  const e = 2 * randInt(rng, 1, 6 * s); choices.push({ t: `Half of ${e} = ?`, v: e / 2 }); choices.push({ t: `Double of ${e} = ?`, v: e * 2 })
  return choices[randInt(rng, 0, choices.length - 1)]
}
function genReasoning(rng, s, num) {
  const start = randInt(rng, 1, 5 * s)
  const d = randInt(rng, 1, 3 * s)
  const variants = [
    { t: `Next: ${start}, ${start + d}, ${start + 2 * d}, ?`, v: start + 3 * d },     // arithmetic seq
    { t: `If ${randInt(rng, 2, 4)}x = ${2 * (start + d)}, x = ?`, v: null },           // linear eq (filled below)
  ]
  // geometric for higher difficulty
  if (s >= 2) { const r = 2 + (s >= 3 ? 1 : 0); variants.push({ t: `Next: ${start}, ${start * r}, ${start * r * r}, ?`, v: start * r * r * r }) }
  const pick = variants[randInt(rng, 0, variants.length - 1)]
  if (pick.v == null) { const k = randInt(rng, 2, 4); const x = randInt(rng, 2, 6 * s); return { t: `If ${k}x = ${k * x}, x = ?`, v: x } }
  return pick
}
function genApplication(rng, s, num) {
  const variants = [
    () => { const sp = 10 * randInt(rng, 1, 3 * s); const h = randInt(rng, 2, 5); return { t: `A car travels ${sp} km/h for ${h} hours. Distance = ? km`, v: sp * h } },
    () => { const w = randInt(rng, 2 * s, 6 * s); const l = randInt(rng, 2 * s, 6 * s); return { t: `A rectangle is ${l} by ${w}. Area = ?`, v: l * w } },
    () => { const cost = randInt(rng, 3, 9 * s); const pay = 10 * Math.ceil((cost + 1) / 10) + 10 * s; return { t: `An item costs ₹${cost}. You pay ₹${pay}. Change = ?`, v: pay - cost } },
    () => { const p = [10, 20, 25][randInt(rng, 0, 2)]; const price = 20 * randInt(rng, 1, 5 * s); return { t: `A ₹${price} item has ${p}% off. You save ₹?`, v: (p * price) / 100 } },
  ]
  return variants[randInt(rng, 0, variants.length - 1)]()
}

const GEN_BY_CATEGORY = {
  fluency: genFluency, understanding: genUnderstanding, reasoning: genReasoning, application: genApplication,
}

// Build 4 numeric options around the correct value (unique, mostly non-negative).
function buildOptions(rng, value) {
  const set = new Set([value])
  const offsets = [1, -1, 2, -2, 3, value, 5, -3, 10]
  let oi = 0
  while (set.size < 4 && oi < offsets.length * 2) {
    const off = offsets[oi % offsets.length] + (oi >= offsets.length ? randInt(rng, 1, 4) : 0)
    const cand = value + off
    if (cand !== value && cand >= 0) set.add(cand)
    oi += 1
  }
  while (set.size < 4) set.add(value + set.size + randInt(rng, 1, 9)) // guarantee 4
  const opts = [...set].slice(0, 4)
  // shuffle deterministically
  for (let i = opts.length - 1; i > 0; i--) { const j = randInt(rng, 0, i);[opts[i], opts[j]] = [opts[j], opts[i]] }
  const correctOption = opts.indexOf(value)
  return { options: opts.map(String), correctOption }
}

// Deterministic, grade-safe candidate. salt varies output across runs.
function fallbackGenerate({ category, grade, difficulty, subject = 'Mental Math', count = 1, salt = 0 }) {
  const num = gradeNum(grade)
  const cls = parseGrade(grade).className
  const s = SCALE[difficulty] || 1
  const gen = GEN_BY_CATEGORY[category] || genFluency
  const concept = pickConcept(grade, category)
  const out = []
  const seen = new Set()
  let i = 0
  let guard = 0
  while (out.length < count && guard < count * 30) {
    guard += 1
    const rng = mulberry32(hashSeed(`${category}|${cls}|${difficulty}|${salt}|${i}`))
    i += 1
    const { t, v } = gen(rng, s, num)
    if (v == null || !Number.isFinite(v) || seen.has(t)) continue
    seen.add(t)
    const { options, correctOption } = buildOptions(rng, v)
    out.push({
      category,
      grade: cls,
      subject,
      chapter: concept,
      topic: concept,
      concept,
      difficulty,
      level: DIFFICULTY_LEVEL[difficulty] || 1,
      questionText: t,
      answer: String(v),
      answerValue: v,
      options,
      correctOption,
      explanation: `The correct answer is ${v}. ${concept} — compute step by step to reach ${v}.`,
      hints: ['Identify the operation in the question.', `This tests: ${concept}.`],
      bloomLevel: BLOOM_BY_CATEGORY[category] || 'understand',
      estimatedTimeSec: 20 + s * 8,
      isPrerequisite: false,
      _engine: 'fallback',
    })
  }
  return out
}

// Defuse prompt-injection: example questions are interpolated into the prompt as
// bullet lines, so strip newlines/backticks/braces and truncate. (Nothing the
// student types ever reaches this prompt — category is an enum, grade comes from
// the profile — but seed/generated texts are sanitised as defence in depth.)
function safeExample(s) {
  return String(s == null ? '' : s)
    .replace(/[\r\n`]+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
}

// ── LLM prompt (strict JSON, hard class guardrails) ──────────────────────────
function buildPrompt({ category, grade, difficulty, subject, count, allowedConcepts, seedExamples = [], avoidTexts = [] }) {
  const cls = parseGrade(grade).className
  return [
    `You are an expert ${subject} question author for Indian school students.`,
    `Generate ${count} NEW practice question(s) for the BrainGym "${category}" skill.`,
    '',
    'HARD CONSTRAINTS (a violation makes the question unusable):',
    `1. The student is in ${cls}. Use ONLY ${cls} syllabus. NEVER use any concept,`,
    `   formula or notation from a higher class (no higher-class trigonometry,`,
    `   logarithms, calculus, matrices, vectors, etc. unless they belong to ${cls}).`,
    `2. "Difficulty" means difficulty WITHIN ${cls}. A "${difficulty}" question must`,
    `   still be a ${cls} question — do NOT raise the syllabus to make it harder.`,
    `3. Allowed concepts for this student: ${allowedConcepts.join('; ')}.`,
    `   Pick the question's "concept" from this list.`,
    '4. The answer MUST be a single NUMBER (the quiz uses a numeric keypad).',
    '5. Provide exactly 4 options, exactly one correct, with no duplicates.',
    '6. Do NOT copy these existing questions — create fresh values/wording:',
    ...seedExamples.slice(0, 6).map((q) => `   - ${safeExample(q)}`),
    avoidTexts.length ? '7. Also avoid duplicating any of these recent questions:' : '',
    ...avoidTexts.slice(0, 8).map((q) => `   - ${safeExample(q)}`),
    '',
    'Return STRICT JSON only — an array of objects, no prose, with this shape:',
    '[{',
    `  "category": "${category}", "grade": "${cls}", "subject": "${subject}",`,
    '  "chapter": "...", "topic": "...", "concept": "<from allowed list>",',
    `  "difficulty": "${difficulty}", "questionText": "...",`,
    '  "answer": "<number>", "answerValue": <number>,',
    '  "options": ["<n>","<n>","<n>","<n>"], "correctOption": <0-3>,',
    '  "explanation": "...", "hints": ["...","..."],',
    '  "bloomLevel": "understand|apply|analyze", "estimatedTimeSec": <int>',
    '}]',
  ].filter(Boolean).join('\n')
}

function parseLLMJson(text) {
  if (!text) return []
  // strip code fences, grab the first JSON array
  const cleaned = String(text).replace(/```json|```/g, '')
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start === -1 || end === -1 || end <= start) {
    // maybe a single object
    const os = cleaned.indexOf('{'); const oe = cleaned.lastIndexOf('}')
    if (os === -1 || oe <= os) return []
    try { return [JSON.parse(cleaned.slice(os, oe + 1))] } catch { return [] }
  }
  try {
    const arr = JSON.parse(cleaned.slice(start, end + 1))
    return Array.isArray(arr) ? arr : [arr]
  } catch { return [] }
}

// Calls Claude. Returns parsed candidates, or null if LLM is unavailable/failed
// (callers then use the fallback). Never throws. max_tokens is sized by the caller
// so multi-question responses don't truncate (truncated JSON → parse fail → fallback).
async function callLLM(prompt, { maxTokens = 2000 } = {}) {
  if (config.ai.mockMode || config.ai.provider !== 'anthropic' || !config.ai.anthropicApiKey) {
    return null
  }
  try {
    const Anthropic = require('@anthropic-ai/sdk')
    // SDK-level resilience: bounded retries on 429/5xx + a hard request timeout so
    // a hung LLM can never stall a student request (the caller falls back).
    const client = new Anthropic({ apiKey: config.ai.anthropicApiKey, maxRetries: 2, timeout: 20000 })
    const model = config.ai.knowledgeModel || config.ai.doubtModel || config.ai.lessonModel
    const resp = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = (resp.content || []).map((b) => b.text || '').join('')
    return { text, model }
  } catch (err) {
    console.error('[BrainGym] LLM generation failed:', err.message)
    return null
  }
}

// Main entry. Returns { candidates, engine, model }. Always returns something
// usable (falls back deterministically). `llm` is injectable for tests.
async function generateCandidates(req, { llm = callLLM } = {}) {
  const {
    category, grade, difficulty, subject = 'Mental Math', count = 5,
    seedExamples = [], avoidTexts = [], allowPrereq = false,
  } = req
  const allowedConcepts = allowedConceptsFor(grade, { includePrereq: allowPrereq })

  // The LLM is asked for a SANE number (large asks truncate the JSON response and
  // fail to parse). The fallback still over-generates `count` for dedup churn.
  const llmCount = Math.min(count, 8)
  const maxTokens = Math.min(8192, llmCount * 450 + 700)
  const prompt = buildPrompt({ category, grade, difficulty, subject, count: llmCount, allowedConcepts, seedExamples, avoidTexts })
  // Any LLM failure (throw, timeout, junk) must degrade to the deterministic
  // fallback — never propagate out of the generator.
  let llmResult = null
  try { llmResult = await llm(prompt, { maxTokens }) } catch (e) { console.error('[BrainGym] LLM call threw:', e.message); llmResult = null }

  if (llmResult && llmResult.text) {
    const parsed = parseLLMJson(llmResult.text)
      .map((q) => ({ ...q, category, grade: parseGrade(grade).className, subject, difficulty, _engine: 'llm' }))
    if (parsed.length) {
      return { candidates: parsed, engine: 'llm', model: llmResult.model, promptVersion: PROMPT_VERSION }
    }
  }

  // Recovery / offline path — always grade-safe.
  const salt = req.salt != null ? req.salt : 0
  const candidates = fallbackGenerate({ category, grade, difficulty, subject, count, salt })
  return { candidates, engine: 'fallback', model: 'deterministic-fallback', promptVersion: PROMPT_VERSION }
}

// Alias — the pipeline/spec refer to this as generateQuestions.
const generateQuestions = generateCandidates

module.exports = { generateCandidates, generateQuestions, fallbackGenerate, buildPrompt, parseLLMJson, callLLM }
