'use strict'

function langLine(language) {
  if (language === 'hi') return 'Ask/answer in Hindi.'
  if (language === 'hinglish') return 'Ask/answer in natural Hinglish (Roman script).'
  return 'Ask/answer in clear English.'
}

const DIFFICULTY = {
  beginner: 'Make it EASY — test ONE basic definition or single fact. The goal is to build confidence.',
  intermediate: 'Make it MEDIUM — test understanding or application of one concept, not just recall.',
  advanced: 'Make it CHALLENGING — test deeper reasoning, a tricky case, or a short one-step calculation.',
}

// Generate ONE quiz question + its model answer, grounded in the chapter material.
function buildQuizSystemPrompt({ subject, chapter, contexts = [], level = 'intermediate', language = 'en' }) {
  const ctx = contexts.slice(0, 4).map((c, i) => `[${i + 1}] ${String(c.content).slice(0, 500)}`).join('\n---\n')
  return `You are a teacher setting ONE short quiz question for a student on ${subject}${chapter ? ` — ${chapter}` : ''}.
${ctx ? `Base it ONLY on this material:\n${ctx}\n` : 'Use standard curriculum knowledge.\n'}
DIFFICULTY (${level}): ${DIFFICULTY[level] || DIFFICULTY.intermediate}
RULES:
- Exactly ONE focused question the student can answer in 1-2 lines. One concept only, no multi-part questions, no trick.
- ${langLine(language)}
- No preamble.
Return ONLY this JSON: {"question":"<the question>","answer":"<the correct answer in 1-2 short lines>"}`
}

// Grade the student's answer against the expected answer. Fair + encouraging.
// `studentMemory` (optional) is a number-free tone hint so the feedback can gently
// reference the student's history ("similar slip earlier, but you're much closer now").
function buildGradeSystemPrompt({ question, expectedAnswer, language = 'en', studentMemory = null }) {
  const memoryLine = studentMemory
    ? `\nTEACHER MEMORY (set the TONE only; you are a teacher who remembers this student) — ${studentMemory}\n`
    + 'NEVER expose any score, percentage, or "mastery/confidence" label — speak in plain human encouragement.\n'
    : ''
  return `You are a kind, fair teacher grading a student's spoken answer.

QUESTION: ${question}
CORRECT ANSWER: ${expectedAnswer}
${memoryLine}
Judge the student's reply (sent as the next message):
- "correct"   = the core idea is right, even if the wording differs.
- "partial"   = partly right or missing a key part.
- "incorrect" = wrong, off-topic, or empty ("I don't know").

${langLine(language)}
Feedback rules: 1-2 SHORT lines. Say plainly if it's right or not, then the key point they missed (if any). Warm, no preamble, no "Great question". When it's wrong or partial, stay encouraging and never discouraging.
Return ONLY this JSON: {"verdict":"correct|partial|incorrect","feedback":"<1-2 short lines>"}`
}

const buildGradeMessages = (studentAnswer) => [{ role: 'user', content: String(studentAnswer || '(no answer)') }]

module.exports = { buildQuizSystemPrompt, buildGradeSystemPrompt, buildGradeMessages }
