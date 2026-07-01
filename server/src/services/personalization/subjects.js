'use strict'

// Single source of truth for which subjects a student may see, by class band + stream.
// Mirrored on the client (src/utils/personalization.js) — keep the two in sync.

const PRIMARY = ['Mathematics', 'English', 'EVS', 'Hindi']                       // 1–5
const MIDDLE = ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi']  // 6–10

const STREAMS = {
  pcm: ['Physics', 'Chemistry', 'Mathematics'],
  pcb: ['Physics', 'Chemistry', 'Biology'],
  pcmb: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  commerce: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English'],
  arts: ['History', 'Political Science', 'Geography', 'Economics', 'English'],
}
// senior class with no stream chosen yet → show the science union (safe default)
const SENIOR_DEFAULT = ['Physics', 'Chemistry', 'Mathematics', 'Biology']

function normalizeStream(s) {
  if (!s) return null
  const t = String(s).toLowerCase().replace(/[^a-z]/g, '')
  if (!t) return null
  if (t.includes('pcmb')) return 'pcmb'
  if (t.includes('pcm')) return 'pcm'
  if (t.includes('pcb')) return 'pcb'
  if (t.includes('commerce') || t.includes('comm')) return 'commerce'
  if (t.includes('art') || t.includes('human')) return 'arts'
  return null
}

function subjectsFor(classNum, stream) {
  if (!classNum) return []
  if (classNum <= 5) return PRIMARY
  if (classNum <= 10) return MIDDLE
  const st = normalizeStream(stream)
  return st && STREAMS[st] ? STREAMS[st] : SENIOR_DEFAULT
}

function isAllowedSubject(subject, classNum, stream) {
  if (!classNum) return true // unknown class → don't block (migration pending)
  if (!subject) return true
  const allowed = subjectsFor(classNum, stream).map((s) => s.toLowerCase())
  return allowed.includes(String(subject).trim().toLowerCase())
}

module.exports = { subjectsFor, isAllowedSubject, normalizeStream, STREAMS }
