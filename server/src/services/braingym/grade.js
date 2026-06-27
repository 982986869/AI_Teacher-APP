'use strict'

// ─── CLASS-LEVEL GUARDRAIL ──────────────────────────────────────────────────
// The single most important rule of this system: a student must NEVER receive a
// question that uses concepts above their class. Difficulty scales WITHIN the
// class (a "hard Class 9" question stays Class 9). Lower-class concepts are only
// allowed when explicitly marked as prerequisite revision.
//
// This module is pure (no DB / no network) so the guardrail is fully testable.

// Parse any grade representation into a canonical { num, className }.
//   "Class 9", "class 9", "9", "G9", "Grade 9", "IX", 9  →  { num: 9, className: 'Class 9' }
const ROMAN = { i: 1, v: 5, x: 10 }
function romanToInt(s) {
  let total = 0
  const t = s.toLowerCase()
  for (let i = 0; i < t.length; i++) {
    const cur = ROMAN[t[i]]
    const next = ROMAN[t[i + 1]]
    if (cur == null) return null
    total += next && cur < next ? -cur : cur
  }
  return total || null
}

function parseGrade(input, fallbackNum = 9) {
  if (input == null) return { num: fallbackNum, className: `Class ${fallbackNum}` }
  if (typeof input === 'number' && Number.isFinite(input)) {
    const n = clampGrade(input)
    return { num: n, className: `Class ${n}` }
  }
  const raw = String(input).trim()
  // Digits anywhere ("Class 10", "G12", "grade-11").
  const digits = raw.match(/\d{1,2}/)
  if (digits) {
    const n = clampGrade(parseInt(digits[0], 10))
    return { num: n, className: `Class ${n}` }
  }
  // Roman numeral fallback ("IX", "XII").
  const roman = romanToInt(raw.replace(/[^ivxIVX]/g, ''))
  if (roman) {
    const n = clampGrade(roman)
    return { num: n, className: `Class ${n}` }
  }
  return { num: fallbackNum, className: `Class ${fallbackNum}` }
}

function clampGrade(n) {
  if (!Number.isFinite(n)) return 9
  return Math.max(1, Math.min(12, Math.round(n)))
}

function gradeNum(input) {
  return parseGrade(input).num
}

// ─── Allowed concepts per class (NCERT-aligned, Maths / Mental-Math) ─────────
// Each class lists the concept NAMES that may appear at that class. Generation
// and validation both consult this. A concept is only allowed if it belongs to
// the student's own class (or a lower class, when isPrerequisite is set).
const CLASS_CONCEPTS = {
  6:  ['Whole numbers', 'Basic operations', 'Fractions', 'Decimals', 'Ratio and proportion (intro)', 'Perimeter and area (basics)'],
  7:  ['Integers', 'Fractions and decimals', 'Simple equations', 'Ratio and proportion', 'Percentage', 'Perimeter and area'],
  8:  ['Linear equations in one variable', 'Exponents and powers', 'Squares and square roots', 'Cubes and cube roots', 'Percentage and profit/loss', 'Mensuration: area & perimeter', 'Direct and inverse proportion'],
  9:  ['Number system (squares, cubes, roots)', 'Polynomials (evaluation)', 'Linear equations in two variables', 'Exponents and powers', 'Percentage', 'Ratio and proportion', 'Mensuration: area & perimeter', 'Statistics (mean)'],
  10: ['Real numbers', 'Quadratic evaluation', 'Arithmetic progression (nth term)', 'Trigonometric ratios (standard angles)', 'Probability (simple)', 'Coordinate geometry (distance)', 'Mensuration: surface area & volume', 'Percentage and interest'],
  11: ['Sequences and series (AP/GP sum)', 'Permutations and combinations (basic)', 'Logarithm evaluation', 'Straight lines (slope)', 'Sets and relations', 'Trigonometric identities', 'Binomial theorem (term)'],
  12: ['Derivative of polynomial (power rule)', 'Definite integral of polynomial', 'Probability (basic)', 'Matrices (2x2 determinant)', 'Continuity (evaluation)', 'Vectors (dot product)', 'Application of derivatives (rate)'],
}

// Cumulative allowed concepts for a class = own class only (each class list is
// already self-contained NCERT scope). Prerequisite revision additionally allows
// every lower class's concepts.
function allowedConceptsFor(grade, { includePrereq = false } = {}) {
  const num = gradeNum(grade)
  const own = CLASS_CONCEPTS[num] || []
  if (!includePrereq) return [...own]
  const lower = []
  for (let g = 6; g < num; g++) lower.push(...(CLASS_CONCEPTS[g] || []))
  return [...own, ...lower]
}

// Which class a concept name belongs to (lowest class that lists it). null if unknown.
function conceptGrade(conceptName) {
  if (!conceptName) return null
  const target = String(conceptName).trim().toLowerCase()
  for (let g = 1; g <= 12; g++) {
    const list = CLASS_CONCEPTS[g] || []
    if (list.some((c) => c.toLowerCase() === target)) return g
  }
  return null
}

// Is a concept (by NAME) allowed for this student?
// A concept is allowed if it appears in the student's OWN class list (even if it
// also appears in a lower class). Lower-class-only concepts are allowed solely as
// prerequisite revision. Higher-class / unknown concepts are rejected (fail-closed).
function isConceptAllowed(conceptName, grade, { isPrerequisite = false } = {}) {
  if (!conceptName) return false
  const num = gradeNum(grade)
  const target = String(conceptName).trim().toLowerCase()
  const inClass = (n) => (CLASS_CONCEPTS[n] || []).some((c) => c.toLowerCase() === target)

  if (inClass(num)) return true                 // own class → yes
  if (!isPrerequisite) return false             // not prereq → own class only
  for (let g = 6; g < num; g++) if (inClass(g)) return true // prereq → any lower class
  return false
}

// ─── Forbidden vocabulary scan ──────────────────────────────────────────────
// A question is out-of-grade if its TEXT introduces a concept/formula whose
// minimum NCERT class is above the student's. This catches "requires higher-class
// formulas / advanced syllabus" even when the declared concept looks innocent.
// Keys are matched case-insensitively as substrings — kept specific to avoid
// false positives (e.g. "log " with a trailing space, not bare "log").
const CONCEPT_MIN_GRADE = [
  ['√', 8], ['square root', 8], ['cube root', 8], ['exponent', 8], ['power of', 8],
  ['quadratic', 10], ['discriminant', 10], ['arithmetic progression', 10], ['common difference', 10],
  ['sin ', 10], ['cos ', 10], ['tan ', 10], ['sinθ', 10], ['cosθ', 10], ['tanθ', 10], ['trigonometr', 10],
  ['logarithm', 11], ['log ', 11], ['log(', 11], ['ln ', 11], ['binomial theorem', 11],
  ['permutation', 11], ['combination', 11], ['nCr', 11], ['nPr', 11],
  ['complex number', 11], ['iota', 11], ['conic', 11], ['parabola', 11], ['ellipse', 11], ['hyperbola', 11],
  ['vector', 11], ['dot product', 11], ['cross product', 11], ['slope of', 11],
  ['derivative', 11], ['differentiat', 11], ['dy/dx', 11], ["f'(", 11], ['limit of', 11], ['lim ', 11],
  ['integral', 12], ['integrat', 12], ['∫', 12], ['matrix', 12], ['matrices', 12], ['determinant', 12],
  ['continuity', 12], ['differential equation', 12], ['conditional probability', 12], ['bayes', 12],
]

// Returns the list of out-of-grade markers found in the text (empty = clean).
function detectOutOfGradeConcepts(text, grade) {
  const num = gradeNum(grade)
  const hay = String(text || '').toLowerCase()
  const hits = []
  for (const [term, minGrade] of CONCEPT_MIN_GRADE) {
    if (minGrade > num && hay.includes(term.toLowerCase())) {
      hits.push({ term: term.trim(), minGrade })
    }
  }
  return hits
}

// class ≤5 → Level 1 · 6–8 → Level 2 · ≥9 → Level 3 (mirrors the frontend).
function gradeToLevel(grade) {
  const n = gradeNum(grade)
  if (n <= 5) return 1
  if (n <= 8) return 2
  return 3
}

module.exports = {
  parseGrade, gradeNum, clampGrade, gradeToLevel,
  CLASS_CONCEPTS, allowedConceptsFor, conceptGrade, isConceptAllowed,
  CONCEPT_MIN_GRADE, detectOutOfGradeConcepts,
}
