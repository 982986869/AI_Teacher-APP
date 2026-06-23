'use strict'

const { config } = require('../config/env')
const { getAIProvider } = require('../providers')
const { retrieve, canonicalSubject } = require('./retriever.service')
const memory = require('./memory.service')
const mastery = require('./mastery.service')
const planner = require('./planner.service')
const lessonService = require('./lesson.service')
const { applyGuard } = require('../utils/responseGuard')
const { quickIntent } = require('../prompts/intentClassify.prompt')

// Grounding floor (config default 0.2 is too low). Below this we answer from
// general knowledge instead of curriculum.
const GROUND_FLOOR = 0.4
// Escalating re-explanation strategies when a student doesn't understand.
const STRATEGY_ORDER = ['simpler', 'analogy', 'example', 'step_by_step']
// Intents that end with an understanding check ("Clear?").
const CHECK_INTENTS = new Set(['concept_explanation', 'doubt', 'formula'])
const ENGAGE_INTENTS = new Set(['concept_explanation', 'doubt', 'formula', 'example_request'])

const LINES = {
  off_topic: {
    en: "Let's stay on the topic. Ask me something about your lesson. Clear?",
    hi: 'अभी पढ़ाई पर ध्यान देते हैं। अपने पाठ के बारे में कुछ पूछो। ठीक है?',
    hinglish: 'Abhi padhai pe focus karte hain. Lesson ke baare me kuch poochho. Theek hai?',
  },
  unclear: {
    en: "I didn't quite catch that. Can you ask it in one short line?",
    hi: 'मैं समझ नहीं पाई। एक छोटी लाइन में फिर से पूछो?',
    hinglish: 'Samajh nahi aaya. Ek chhoti line me phir se poochho?',
  },
  resume: { en: "Let's continue.", hi: 'चलो आगे बढ़ते हैं।', hinglish: 'Chalo, aage badhte hain.' },
  understood: { en: "Good. Let's continue.", hi: 'बहुत बढ़िया! चलो आगे बढ़ते हैं।', hinglish: 'Shabaash! Chalo aage badhte hain.' },
  giveUp: {
    en: "No worries — let's come back to this later. Ask me anything else.",
    hi: 'कोई बात नहीं — इसे बाद में देखेंगे। और कुछ पूछो।',
    hinglish: 'Koi baat nahi — ye baad me dekhte hain. Aur kuch poochho.',
  },
}
const line = (key, language) => (LINES[key] && (LINES[key][language] || LINES[key].en)) || ''

function cannedReply(intent, language, { lessonId, slideIndex, via }) {
  return {
    intent, language, intentVia: via, mode: 'canned',
    grounded: false, source: 'none', confidence: 0, sources: [],
    answer: line(intent, language), expecting: null, pending: null,
    resumeCue: lessonId ? line('resume', language) : null, resumeSlideIndex: slideIndex ?? null,
  }
}

function buildSources(chunks) {
  const seen = new Map()
  for (const c of chunks) {
    const chapter = c.metadata && c.metadata.chapter ? c.metadata.chapter : null
    const key = `${c.sourceTitle}::${chapter || ''}`
    if (!seen.has(key) || c.similarity > seen.get(key).similarity) {
      seen.set(key, { title: c.sourceTitle, chapter, similarity: Math.round(c.similarity * 100) / 100 })
    }
  }
  return [...seen.values()].sort((a, b) => b.similarity - a.similarity).slice(0, 4)
}

// Rule-based understanding signal: did the student get it, not get it, or move on?
// Negations are checked FIRST so "nahi samajh aaya" (didn't understand) is not
// mis-read as "samajh aaya" (understood).
function classifyUnderstanding(text) {
  const t = String(text || '').trim().toLowerCase()
  if (/\b(nahi|nhi|nai|not|don'?t|dont|confus(ed|ing)?|samjha nahi)\b/.test(t)
    || /^(no|nope|nah|repeat|again|phir se|still)\b/.test(t)
    || /(nahi (aaya|samjha|samajh)|samajh nahi|not (clear|understood)|don'?t (get|understand)|still confus)/.test(t)) return 'not_understood'
  if (/^(yes|yeah|yep|yup|ok|okay|k|got ?it|clear|cleared|understood|haan|haa|ha|theek|thik|done|next|continue|aage|right|good|great|samajh)\b/.test(t)
    || /\b(samajh (gaya|gya|aaya|liya)|got it|understood|makes sense|clear hai)\b/.test(t)) return 'understood'
  return 'other'
}

function logEngagement({ userId, subject, intent, contexts }) {
  if (userId && subject && ENGAGE_INTENTS.has(intent)) {
    const ch = contexts[0] && contexts[0].metadata && contexts[0].metadata.chapter
    memory.recordEvent({ userId, type: 'doubt', subject: canonicalSubject(subject), chapter: ch || '' }).catch(() => {})
  }
}

// Lesson context + concurrent intent/retrieval.
async function prepareTurn({ userId, question, subject, gradeLevel, lessonId }) {
  let lesson = null
  if (lessonId) {
    lesson = await lessonService.getLessonById(lessonId, userId).catch(() => null)
    if (lesson && !subject) subject = lesson.subject
    if (lesson && !gradeLevel) gradeLevel = lesson.gradeLevel
  }
  const quick = quickIntent(question)
  const intentP = quick
    ? Promise.resolve({ intent: quick.intent, language: quick.language, confidence: 0.9, via: 'rules' })
    : config.ai.mockMode
      ? Promise.resolve({ intent: 'concept_explanation', language: 'en', confidence: 0.5, via: 'mock' })
      : getAIProvider().classifyIntent(question).then((r) => ({ ...r, via: 'llm' }))
  const retrieveP = retrieve({ query: question, subject, gradeLevel, minSimilarity: GROUND_FLOOR })
    .catch(() => ({ chunks: [], grounded: false, topSimilarity: 0 }))
  const [intentRes, retrieval] = await Promise.all([intentP, retrieveP])
  return { lesson, subject, gradeLevel, intentRes, retrieval }
}

function teachingResponse({ intent, language, level, via, retrieval, contexts, guarded, lessonId, slideIndex, question, subject }) {
  const wantsCheck = CHECK_INTENTS.has(intent)
  const concept = retrieval.concept || null
  return {
    intent, language, level, intentVia: via, mode: 'teach',
    grounded: retrieval.grounded,
    source: retrieval.grounded ? 'curriculum' : 'model_knowledge',
    confidence: retrieval.topSimilarity, confidenceTier: retrieval.confidenceTier,
    concept: concept ? { name: concept.name, chapter: concept.chapter } : null,
    prereqConcepts: retrieval.prereqConcepts || [],
    sources: buildSources(contexts),
    answer: guarded.text, guard: guarded.flags,
    // Understanding-check loop: ask "Clear?" and wait for the student's signal.
    expecting: wantsCheck ? 'understanding' : null,
    pending: wantsCheck
      ? { kind: 'understanding', topic: question, subject: canonicalSubject(subject), language, attempts: 0, strategy: 'direct', conceptId: concept ? concept.id : null }
      : null,
    resumeCue: lessonId ? line('resume', language) : null, resumeSlideIndex: slideIndex ?? null,
  }
}

// ── Quiz grading loop ─────────────────────────────────────────────────────────
// Pick difficulty from the student's record on this chapter: struggling → easier,
// strong → harder. Falls back to the requested level when there's no history.
function pickQuizLevel(stat, requested = 'intermediate') {
  if (!stat || (stat.quizTotal === 0 && stat.mistakes === 0)) return requested
  if (stat.mistakes >= 2 || (stat.accuracy != null && stat.accuracy < 0.5)) return 'beginner'
  if (stat.accuracy != null && stat.accuracy >= 0.8 && stat.quizTotal >= 2) return 'advanced'
  return requested === 'advanced' ? 'advanced' : 'intermediate'
}

async function startQuiz({ userId, subject, retrieval, level, language, lessonId, slideIndex }) {
  const contexts = retrieval.grounded ? retrieval.chunks : []
  const chapter = (contexts[0] && contexts[0].metadata && contexts[0].metadata.chapter) || null

  let quizLevel = level
  if (userId && subject && chapter) {
    const stat = await memory.getChapterStat(userId, canonicalSubject(subject), chapter).catch(() => null)
    quizLevel = pickQuizLevel(stat, level)
  }

  const concept = retrieval.concept || null
  let quiz
  if (config.ai.mockMode) quiz = { question: `Quick question on ${subject}: state one key idea you remember.`, answer: '(any reasonable key idea)' }
  else quiz = await getAIProvider().generateQuiz({ subject, chapter, contexts, level: quizLevel, language })
  const guarded = applyGuard(quiz.question, { language })
  return {
    intent: 'quiz_request', language, level, quizLevel, mode: 'quiz',
    grounded: retrieval.grounded, source: retrieval.grounded ? 'curriculum' : 'model_knowledge',
    confidence: retrieval.topSimilarity, confidenceTier: retrieval.confidenceTier,
    concept: concept ? { name: concept.name, chapter: concept.chapter } : null,
    sources: buildSources(contexts),
    answer: guarded.text, guard: guarded.flags,
    expecting: 'quiz_answer',
    pending: { kind: 'quiz', question: quiz.question, answer: quiz.answer, subject: canonicalSubject(subject), chapter, language, level: quizLevel, conceptId: concept ? concept.id : null },
    resumeCue: null, resumeSlideIndex: slideIndex ?? null,
  }
}

async function handleQuizAnswer({ userId, studentAnswer, pending, lessonId, slideIndex }) {
  const language = pending.language || 'en'
  let verdict = 'partial'
  let feedback = ''
  if (config.ai.mockMode) { verdict = /correct|right|yes/i.test(studentAnswer) ? 'correct' : 'partial'; feedback = 'Noted.' }
  else {
    const g = await getAIProvider().gradeAnswer({ question: pending.question, expectedAnswer: pending.answer, studentAnswer, language })
    verdict = g.verdict; feedback = g.feedback
  }
  if (userId && pending.subject) {
    memory.recordEvent({
      userId, type: 'quiz', subject: canonicalSubject(pending.subject), chapter: pending.chapter || '',
      detail: { correct: verdict === 'correct', verdict, question: pending.question },
    }).catch(() => {})
  }
  // Learning loop: quiz result updates concept mastery.
  if (userId && pending.conceptId) {
    mastery.updateMastery({ userId, conceptId: pending.conceptId, signal: verdict === 'correct' ? 'quiz_correct' : 'quiz_wrong' }).catch(() => {})
  }
  const reveal = verdict === 'correct' ? '' : `\nCorrect answer: ${pending.answer}`
  const guarded = applyGuard(`${feedback}${reveal}`, { language })
  return {
    intent: 'quiz_answer', language, mode: 'quiz_grading', verdict,
    grounded: true, source: 'curriculum', confidence: 0, sources: [],
    answer: guarded.text, guard: guarded.flags, expecting: null, pending: null,
    resumeCue: lessonId ? line('resume', language) : null, resumeSlideIndex: slideIndex ?? null,
  }
}

// ── Understanding loop + adaptive re-explanation ──────────────────────────────
function understoodReply(pending, { userId, lessonId, slideIndex }) {
  const language = pending.language || 'en'
  // Learning loop: understanding it lifts concept mastery.
  if (userId && pending.conceptId) {
    mastery.updateMastery({ userId, conceptId: pending.conceptId, signal: 'understood' }).catch(() => {})
  }
  return {
    intent: 'understanding_ok', language, mode: 'understanding',
    grounded: false, source: 'none', confidence: 0, sources: [],
    answer: line('understood', language), expecting: null, pending: null,
    resumeCue: lessonId ? line('resume', language) : null, resumeSlideIndex: slideIndex ?? null,
  }
}

async function reExplain({ userId, pending, level, lessonId, slideIndex }) {
  const language = pending.language || 'en'
  const attempts = (pending.attempts || 0) + 1
  // Learning loop: the first "I didn't get it" lowers concept mastery (once).
  if (userId && pending.conceptId && attempts === 1) {
    mastery.updateMastery({ userId, conceptId: pending.conceptId, signal: 'not_understood' }).catch(() => {})
  }
  if (attempts > STRATEGY_ORDER.length) {
    return {
      intent: 'understanding', language, mode: 'understanding',
      grounded: false, source: 'none', confidence: 0, sources: [],
      answer: line('giveUp', language), expecting: null, pending: null,
      resumeCue: lessonId ? line('resume', language) : null, resumeSlideIndex: slideIndex ?? null,
    }
  }
  const strategy = STRATEGY_ORDER[attempts - 1]
  const retrieval = await retrieve({ query: pending.topic, subject: pending.subject, minSimilarity: GROUND_FLOOR })
    .catch(() => ({ chunks: [], grounded: false, topSimilarity: 0 }))
  const contexts = retrieval.grounded ? retrieval.chunks : []
  let raw
  if (config.ai.mockMode) raw = `Let me try another way (${strategy}). ${pending.topic}. Clear now?`
  else raw = await getAIProvider().generateTeacherResponse({
    intent: 'concept_explanation', language, contexts, lesson: null, history: [], question: pending.topic, level, strategy,
  })
  const guarded = applyGuard(raw, { language })
  return {
    intent: 'concept_explanation', language, level, mode: 're_explain', strategy,
    grounded: retrieval.grounded, source: retrieval.grounded ? 'curriculum' : 'model_knowledge',
    confidence: retrieval.topSimilarity, sources: buildSources(contexts),
    answer: guarded.text, guard: guarded.flags,
    expecting: 'understanding', pending: { ...pending, attempts, strategy },
    resumeCue: null, resumeSlideIndex: slideIndex ?? null,
  }
}

// ── Main entry (non-streaming) ────────────────────────────────────────────────
async function ask(params) {
  const { userId, text, lessonId, slideIndex, history = [], level = 'intermediate', pending = null } = params
  const question = String(text || '').trim()
  if (!question) {
    return { intent: 'unclear', language: 'en', mode: 'canned', grounded: false, source: 'none', confidence: 0, sources: [], answer: line('unclear', 'en'), expecting: null, pending: null, resumeCue: null }
  }

  // Continuation turns first (carry state via `pending`).
  if (pending && pending.kind === 'quiz') {
    return handleQuizAnswer({ userId, studentAnswer: question, pending, lessonId, slideIndex })
  }
  if (pending && pending.kind === 'understanding') {
    const u = classifyUnderstanding(question)
    if (u === 'understood') return understoodReply(pending, { userId, lessonId, slideIndex })
    if (u === 'not_understood') return reExplain({ userId, pending, level, lessonId, slideIndex })
    // 'other' → a new question; fall through and drop the understanding loop.
  }

  let { subject, gradeLevel } = params
  const prep = await prepareTurn({ userId, question, subject, gradeLevel, lessonId })
  subject = prep.subject; gradeLevel = prep.gradeLevel
  const { lesson, intentRes, retrieval } = prep
  const { intent, language, via } = intentRes

  if (intent === 'off_topic' || intent === 'unclear') return cannedReply(intent, language, { lessonId, slideIndex, via })
  if (intent === 'quiz_request') return startQuiz({ userId, subject, retrieval, level, language, lessonId, slideIndex })

  const contexts = retrieval.grounded ? retrieval.chunks : []
  const trimmedHistory = Array.isArray(history) ? history.slice(-8) : []
  let rawAnswer
  if (config.ai.mockMode) {
    rawAnswer = contexts.length
      ? `Here is the key idea. ${String(contexts[0].content).split('\n').slice(1).join(' ').slice(0, 160)} Clear?`
      : "This isn't in your material yet. Ask me about your topic and I'll explain it. Clear?"
  } else {
    rawAnswer = await getAIProvider().generateTeacherResponse({ intent, language, contexts, lesson, history: trimmedHistory, question, slideIndex, level })
  }
  const guarded = applyGuard(rawAnswer, { language })
  logEngagement({ userId, subject, intent, contexts })
  // Learning loop: engaging a concept is a (soft) signal on its mastery.
  if (userId && retrieval.concept && ENGAGE_INTENTS.has(intent)) {
    mastery.updateMastery({ userId, conceptId: retrieval.concept.id, signal: 'doubt' }).catch(() => {})
  }
  return teachingResponse({ intent, language, level, via, retrieval, contexts, guarded, lessonId, slideIndex, question, subject })
}

// ── Streaming entry — streams the teaching answer token-by-token ──────────────
async function askStream(params, { onMeta, onDelta } = {}) {
  const { userId, text, lessonId, slideIndex, history = [], level = 'intermediate', pending = null } = params
  const question = String(text || '').trim()
  const emit = (res) => { if (onMeta) onMeta({ intent: res.intent, mode: res.mode, grounded: res.grounded }); if (onDelta) onDelta(res.answer); return res }

  // Non-streamable branches (empty, continuation) → produce via ask(), emit once.
  if (!question || (pending && (pending.kind === 'quiz' || pending.kind === 'understanding'))) {
    return emit(await ask(params))
  }

  let { subject, gradeLevel } = params
  const prep = await prepareTurn({ userId, question, subject, gradeLevel, lessonId })
  subject = prep.subject; gradeLevel = prep.gradeLevel
  const { lesson, intentRes, retrieval } = prep
  const { intent, language, via } = intentRes

  if (intent === 'off_topic' || intent === 'unclear') return emit(cannedReply(intent, language, { lessonId, slideIndex, via }))
  if (intent === 'quiz_request') return emit(await startQuiz({ userId, subject, retrieval, level, language, lessonId, slideIndex }))

  const contexts = retrieval.grounded ? retrieval.chunks : []
  if (onMeta) onMeta({ intent, language, grounded: retrieval.grounded, source: retrieval.grounded ? 'curriculum' : 'model_knowledge', confidence: retrieval.topSimilarity, sources: buildSources(contexts) })

  let raw
  if (config.ai.mockMode) {
    raw = contexts.length ? `Here is the key idea. Clear?` : "This isn't in your material yet. Clear?"
    if (onDelta) onDelta(raw)
  } else {
    raw = await getAIProvider().streamTeacherResponse(
      { intent, language, contexts, lesson, history: history.slice(-8), question, slideIndex, level },
      (t) => { if (onDelta) onDelta(t) }
    )
  }
  const guarded = applyGuard(raw, { language })
  logEngagement({ userId, subject, intent, contexts })
  return teachingResponse({ intent, language, level, via, retrieval, contexts, guarded, lessonId, slideIndex, question, subject })
}

// ── Weak-topic revision mode ──────────────────────────────────────────────────
// Picks the weakest chapter (via the planner), gives a short recap, then opens a
// quiz on it — so revision immediately feeds the quiz-grading + memory loops.
async function startRevision({ userId, subject }) {
  const plan = await planner.recommendNext(userId, subject)
  const focusSubject = plan.subject || (subject ? canonicalSubject(subject) : null)
  const focusChapter = plan.chapter || null
  const language = 'en'
  const level = 'intermediate'

  const query = `${focusChapter || focusSubject || ''} key concepts to revise`.trim()
  const retrieval = await retrieve({ query, subject: focusSubject, minSimilarity: GROUND_FLOOR })
    .catch(() => ({ chunks: [], grounded: false, topSimilarity: 0 }))
  const contexts = retrieval.grounded ? retrieval.chunks : []

  let recap
  let quiz
  if (config.ai.mockMode) {
    recap = `Quick revision of ${focusChapter || focusSubject}. Remember the key ideas.`
    quiz = { question: `What is one key point of ${focusChapter || focusSubject}?`, answer: '(any key point)' }
  } else {
    recap = await getAIProvider().generateTeacherResponse({
      intent: 'revision', language, contexts, lesson: null, history: [],
      question: `Revise ${focusChapter || focusSubject} — only the key points`, level,
    })
    quiz = await getAIProvider().generateQuiz({ subject: focusSubject, chapter: focusChapter, contexts, level, language })
  }
  const gRecap = applyGuard(recap, { language })
  const gQuiz = applyGuard(quiz.question, { language })

  return {
    mode: 'revision', intent: 'revision', language, level,
    focus: { action: plan.action, subject: focusSubject, chapter: focusChapter, reason: plan.reason },
    weakChapters: plan.weakChapters,
    grounded: retrieval.grounded, source: retrieval.grounded ? 'curriculum' : 'model_knowledge',
    confidence: retrieval.topSimilarity, sources: buildSources(contexts),
    recap: gRecap.text,
    answer: `${gRecap.text}\n\nQuick check — ${gQuiz.text}`,
    expecting: 'quiz_answer',
    pending: { kind: 'quiz', question: quiz.question, answer: quiz.answer, subject: focusSubject, chapter: focusChapter, language, level },
  }
}

module.exports = { ask, askStream, startRevision, classifyUnderstanding, GROUND_FLOOR }
