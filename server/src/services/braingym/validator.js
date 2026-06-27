'use strict'

// Question Validator (pure). Rejects any question that is structurally broken,
// not numeric (the quiz UI is a numeric keypad), mismatched to the request, or —
// critically — OUT OF GRADE. Returns { valid, score(0..1), errors, warnings, normalized }.

const { CATEGORIES, DIFFICULTIES, BLOOM_BY_CATEGORY, DIFFICULTY_LEVEL } = require('./constants')
const { isConceptAllowed, detectOutOfGradeConcepts, gradeNum, parseGrade } = require('./grade')

const num = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v)
  return null
}
const norm = (s) => String(s ?? '').trim().toLowerCase()

function validateQuestion(q, ctx = {}) {
  const errors = []
  const warnings = []
  const {
    grade,
    category,
    difficulty,
    subject = 'Mental Math',
    allowPrereq = false,
  } = ctx

  if (!q || typeof q !== 'object') {
    return { valid: false, score: 0, errors: ['not_an_object'], warnings, normalized: null }
  }

  const questionText = String(q.questionText ?? q.q ?? '').trim()
  if (!questionText) errors.push('empty_question')

  // ── Options & single correct answer ───────────────────────────────────────
  const options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()) : []
  if (options.length !== 4) errors.push('need_exactly_4_options')
  if (new Set(options.map(norm)).size !== options.length) errors.push('duplicate_options')
  if (options.some((o) => o === '')) errors.push('empty_option')

  const correctOption = Number.isInteger(q.correctOption) ? q.correctOption : -1
  if (correctOption < 0 || correctOption > 3) errors.push('correctOption_out_of_range')

  const answer = String(q.answer ?? '').trim()
  if (!answer) errors.push('missing_answer')

  // exactly one option equals the answer, and it is the marked correct one
  if (options.length === 4 && answer) {
    const matches = options.map((o, i) => (norm(o) === norm(answer) ? i : -1)).filter((i) => i >= 0)
    if (matches.length !== 1) errors.push('answer_must_match_exactly_one_option')
    else if (matches[0] !== correctOption) errors.push('correctOption_does_not_point_to_answer')
  }

  // ── Numeric requirement (the Brain Gym quiz uses a numeric keypad) ─────────
  const answerValue = num(q.answerValue != null ? q.answerValue : answer)
  if (answerValue == null) errors.push('answer_not_numeric')

  // ── Category / difficulty match ───────────────────────────────────────────
  const cat = norm(q.category)
  if (!CATEGORIES.includes(cat)) errors.push('invalid_category')
  else if (category && cat !== norm(category)) errors.push('category_mismatch')

  const diff = norm(q.difficulty)
  if (!DIFFICULTIES.includes(diff)) errors.push('invalid_difficulty')
  else if (difficulty && diff !== norm(difficulty)) errors.push('difficulty_mismatch')

  // ── CLASS-LEVEL GUARDRAIL ─────────────────────────────────────────────────
  const studentNum = gradeNum(grade)
  const qGradeNum = gradeNum(q.grade ?? grade)
  if (q.grade != null && qGradeNum !== studentNum && !(allowPrereq && qGradeNum < studentNum)) {
    errors.push('grade_mismatch')
  }
  // concept must be allowed for the student's class (prereq lets lower classes in)
  if (!isConceptAllowed(q.concept, grade, { isPrerequisite: !!q.isPrerequisite && allowPrereq })) {
    errors.push('concept_out_of_grade')
  }
  // scan the visible text + explanation + options for higher-class formulas
  const scanText = [questionText, q.explanation, ...options].join('  ')
  const outOfGrade = detectOutOfGradeConcepts(scanText, grade)
  if (outOfGrade.length) {
    errors.push(`advanced_syllabus:${outOfGrade.map((h) => h.term).join(',')}`)
  }

  // ── Soft quality signals (reduce score, not hard rejects) ─────────────────
  const explanation = String(q.explanation ?? '').trim()
  if (!explanation) warnings.push('missing_explanation')
  else if (answer && !norm(explanation).includes(norm(answer))) warnings.push('explanation_omits_answer')
  if (!Array.isArray(q.hints) || q.hints.length === 0) warnings.push('no_hints')

  const valid = errors.length === 0
  // score: full marks minus soft penalties; 0 if invalid.
  const score = valid ? Math.max(0, 1 - warnings.length * 0.12) : 0

  const normalized = valid ? {
    category: cat,
    grade: parseGrade(q.grade ?? grade).className,
    subject,
    chapter: String(q.chapter ?? '').trim(),
    topic: String(q.topic ?? '').trim(),
    concept: String(q.concept ?? '').trim(),
    difficulty: diff,
    level: DIFFICULTY_LEVEL[diff] || 1,
    questionText,
    answer,
    answerValue,
    options,
    correctOption,
    explanation,
    hints: Array.isArray(q.hints) ? q.hints.map(String) : [],
    bloomLevel: norm(q.bloomLevel) || BLOOM_BY_CATEGORY[cat] || 'understand',
    estimatedTimeSec: Number.isFinite(q.estimatedTimeSec) ? q.estimatedTimeSec : 30,
    isPrerequisite: !!q.isPrerequisite && allowPrereq,
  } : null

  return { valid, score: +score.toFixed(3), errors, warnings, normalized }
}

module.exports = { validateQuestion }
