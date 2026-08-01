'use strict'

const Anthropic = require('@anthropic-ai/sdk')
const AIProvider = require('./AIProvider')
const { config } = require('../../config/env')
const { AppError } = require('../../middleware/errorHandler')
const {
  buildLessonSystemPrompt,
  buildLessonUserPrompt,
} = require('../../prompts/lessonGeneration.prompt')
const {
  buildDoubtSystemPrompt,
  buildDoubtMessages,
} = require('../../prompts/doubtResolution.prompt')
const {
  INTENTS,
  buildIntentSystemPrompt,
  buildIntentMessages,
} = require('../../prompts/intentClassify.prompt')
const {
  buildTeacherSystemPrompt,
  buildTeacherMessages,
} = require('../../prompts/teacherResponse.prompt')
const {
  buildQuizSystemPrompt,
  buildGradeSystemPrompt,
  buildGradeMessages,
} = require('../../prompts/quizGrading.prompt')
const {
  buildKnowledgeSystemPrompt,
  buildStructuredKnowledgeSystemPrompt,
  buildExtendedKnowledgeSystemPrompt,
  buildSolvePhotoSystemPrompt,
  buildKnowledgeMessages,
} = require('../../prompts/knowledgeAnswer.prompt')
const { normalizeAnimation } = require('../../utils/slideAnimation')

const VISUAL_TYPES = ['DIAGRAM', 'CHART', 'EXAMPLE', 'ANALOGY', 'FORMULA', 'NONE']

// Generous ceiling for a 5–7 slide lesson; well under the ~16K non-streaming
// timeout threshold, so a plain create() call is safe.
const LESSON_MAX_TOKENS = 8000
// When adaptive thinking is on, the budget must cover BOTH the thinking tokens and
// the lesson JSON, so it needs real headroom. A budget this large would risk an
// HTTP timeout on a plain create(), so the thinking path streams and collects the
// final message (see _createLessonMessage).
const LESSON_MAX_TOKENS_THINKING = 32000
const EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max']
const DOUBT_MAX_TOKENS = 1024
const INTENT_MAX_TOKENS = 60
// Teacher replies are at most ~5 short lines; a tight ceiling keeps generation fast.
const TEACHER_MAX_TOKENS = 450
// A grounded knowledge answer is capped at ~180 words (plain) or a small JSON lesson.
const KNOWLEDGE_MAX_TOKENS = 900
// Transcribing an uploaded page (PDF/photo) can be dense — allow room for a full page.
const EXTRACT_MAX_TOKENS = 8000

// Image mime types Claude vision accepts. PDFs use the `document` content block.
const VISION_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

class AnthropicProvider extends AIProvider {
  constructor() {
    super()
    // Client is created lazily so the server starts without ANTHROPIC_API_KEY set.
    this._client = null
    this.lessonModel = config.ai.lessonModel
    this.doubtModel = config.ai.doubtModel
    // Two different jobs, so two different keys — they used to share
    // AI_KNOWLEDGE_MODEL and pulled it in opposite directions.
    //
    // Cheap, fast model for small deterministic sub-tasks (intent classification,
    // quiz drafting, answer grading) — these do NOT need the tutoring model's depth,
    // so routing them to Haiku cuts latency + cost with no quality loss. answerDoubt
    // runs while the student is waiting mid-lesson, so latency matters most here.
    this.cheapModel = config.ai.cheapModel || config.ai.doubtModel
    // The RAG/knowledge answer + document extraction model. This one wants the
    // OPPOSITE of cheap: extractDocumentText has to hold a whole uploaded PDF, and
    // the answer functions must stay grounded in the retrieved material. Pick a
    // model with a large context window — a 200K one silently truncates a big PDF
    // and the answers are then built from half the material, with no error raised.
    // Falls back to the lesson model (higher quality) if AI_KNOWLEDGE_MODEL is unset.
    this.knowledgeModel = config.ai.knowledgeModel || config.ai.lessonModel
    // Deeper reasoning for lesson planning (adaptive thinking + effort). Off-switch
    // and effort are env-driven; an unsupported model is handled at call time.
    this.lessonThinking = config.ai.lessonThinking === 'adaptive'
    this.lessonEffort = EFFORT_LEVELS.includes(config.ai.lessonEffort) ? config.ai.lessonEffort : 'high'
  }

  _getClient() {
    if (!this._client) {
      if (!config.ai.anthropicApiKey) {
        throw new AppError(
          'ANTHROPIC_API_KEY is not configured. Add it to server/.env to enable AI features.',
          503
        )
      }
      if (!this.lessonModel || !this.doubtModel) {
        throw new AppError(
          'AI_LESSON_MODEL and AI_DOUBT_MODEL must be set in server/.env to enable AI features.',
          503
        )
      }
      this._client = new Anthropic({ apiKey: config.ai.anthropicApiKey })
    }
    return this._client
  }

  async generateLesson(topic, subject, gradeLevel, profile = {}) {
    const client = this._getClient()
    const system = buildLessonSystemPrompt()
    const messages = [{ role: 'user', content: buildLessonUserPrompt(topic, subject, gradeLevel, profile) }]

    const message = await this._createLessonMessage(client, system, messages)
    const raw = extractText(message)
    return parseAndValidateLesson(raw)
  }

  // Runs the lesson request, with adaptive thinking + effort when enabled. The
  // thinking path streams (large max_tokens would risk an HTTP timeout on a plain
  // create()) and collects the final message; extractText ignores the thinking
  // blocks and keeps only the JSON text. If the configured model rejects the
  // thinking/effort params (older tier → 400), we fall back once to a plain
  // non-streaming request so a lesson is never lost to a config mismatch.
  async _createLessonMessage(client, system, messages) {
    if (this.lessonThinking) {
      try {
        const stream = client.messages.stream({
          model: this.lessonModel,
          max_tokens: LESSON_MAX_TOKENS_THINKING,
          thinking: { type: 'adaptive' },
          output_config: { effort: this.lessonEffort },
          system,
          messages,
        })
        const msg = await stream.finalMessage()
        // If thinking ate the budget and the JSON was cut off, don't return partial
        // JSON (it would fail parsing with a misleading "invalid format" error) —
        // fall through to the plain path, where the whole budget goes to the lesson.
        if (!msg || msg.stop_reason !== 'max_tokens') return msg
        console.warn('[AnthropicProvider] lesson thinking response truncated (max_tokens); retrying without thinking.')
      } catch (err) {
        // A 400 means "this model can't do adaptive thinking/effort"; a client-side
        // error (no HTTP status — e.g. an older SDK stream parser) is also safe to
        // retry plain. Genuine server errors (401/403/429/5xx) are real failures and
        // must propagate rather than trigger a second doomed request.
        if (err?.status && err.status !== 400) throw translateProviderError(err, 'lesson generation')
        console.warn('[AnthropicProvider] lesson thinking path failed; retrying without thinking. Set AI_LESSON_THINKING=off to silence this.', err?.message || '')
      }
    }

    let msg
    try {
      msg = await client.messages.create({
        model: this.lessonModel,
        max_tokens: LESSON_MAX_TOKENS,
        system,
        messages,
      })
    } catch (err) {
      throw translateProviderError(err, 'lesson generation')
    }
    // Distinct, actionable error instead of the downstream "invalid JSON" 502.
    if (msg && msg.stop_reason === 'max_tokens') {
      throw new AppError('The lesson was too long to fit — please try a more specific topic.', 502)
    }
    return msg
  }

  async answerDoubt(question, lessonContext, history = [], slideIndex) {
    const client = this._getClient()

    let message
    try {
      message = await client.messages.create({
        model: this.doubtModel,
        max_tokens: DOUBT_MAX_TOKENS,
        system: buildDoubtSystemPrompt(lessonContext),
        messages: buildDoubtMessages(history, question, slideIndex),
      })
    } catch (err) {
      throw translateProviderError(err, 'doubt answering')
    }

    const answer = extractText(message).trim()
    if (!answer) {
      throw new AppError('The AI returned an empty answer. Please try again.', 502)
    }
    return answer
  }

  // Classify a student message into one of the 8 intents + detect language.
  // Uses the fast doubt model with a tiny token budget. Falls back gracefully.
  async classifyIntent(text) {
    const client = this._getClient()
    let message
    try {
      message = await client.messages.create({
        model: this.cheapModel,
        max_tokens: INTENT_MAX_TOKENS,
        system: buildIntentSystemPrompt(),
        messages: buildIntentMessages(text),
      })
    } catch (err) {
      throw translateProviderError(err, 'intent classification')
    }
    const parsed = parseJsonObject(extractText(message), 'intent')
    const intent = INTENTS.includes(parsed.intent) ? parsed.intent : 'concept_explanation'
    const language = ['en', 'hi', 'hinglish'].includes(parsed.language) ? parsed.language : 'en'
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5
    return { intent, language, confidence }
  }

  // Generate the grounded, teacher-style answer for a classified turn.
  async generateTeacherResponse({ intent, language, contexts, lesson, history, question, slideIndex, level, mode, strategy, studentContext, gradeLevel }) {
    const client = this._getClient()
    let message
    try {
      message = await client.messages.create({
        model: this.doubtModel,
        max_tokens: TEACHER_MAX_TOKENS,
        system: buildTeacherSystemPrompt({ intent, language, contexts, lesson, level, mode, strategy, studentContext, gradeLevel }),
        messages: buildTeacherMessages(history, question, slideIndex),
      })
    } catch (err) {
      throw translateProviderError(err, 'teacher response')
    }
    const answer = extractText(message).trim()
    if (!answer) throw new AppError('The AI returned an empty answer. Please try again.', 502)
    return answer
  }

  // Streaming variant — calls onText(delta) per chunk, resolves with the full text.
  async streamTeacherResponse({ intent, language, contexts, lesson, history, question, slideIndex, level, mode, strategy, studentContext, gradeLevel }, onText) {
    const client = this._getClient()
    const stream = client.messages.stream({
      model: this.doubtModel,
      max_tokens: TEACHER_MAX_TOKENS,
      system: buildTeacherSystemPrompt({ intent, language, contexts, lesson, level, mode, strategy, studentContext, gradeLevel }),
      messages: buildTeacherMessages(history, question, slideIndex),
    })
    stream.on('text', (t) => { try { if (typeof onText === 'function') onText(t) } catch (e) { /* ignore sink errors */ } })
    let final
    try {
      final = await stream.finalMessage()
    } catch (err) {
      throw translateProviderError(err, 'teacher response (stream)')
    }
    const answer = extractText(final).trim()
    if (!answer) throw new AppError('The AI returned an empty answer. Please try again.', 502)
    return answer
  }

  // Generate one quiz question + its model answer (grounded in chapter material).
  async generateQuiz({ subject, chapter, contexts, level, language }) {
    const client = this._getClient()
    let message
    try {
      message = await client.messages.create({
        model: this.cheapModel,
        max_tokens: 400,
        system: buildQuizSystemPrompt({ subject, chapter, contexts, level, language }),
        messages: [{ role: 'user', content: 'Set the quiz question now.' }],
      })
    } catch (err) {
      throw translateProviderError(err, 'quiz generation')
    }
    const parsed = parseJsonObject(extractText(message), 'quiz')
    return { question: String(parsed.question || '').trim(), answer: String(parsed.answer || '').trim() }
  }

  // Grade a student's answer against the expected one. Returns verdict + feedback.
  async gradeAnswer({ question, expectedAnswer, studentAnswer, language, studentMemory }) {
    const client = this._getClient()
    let message
    try {
      message = await client.messages.create({
        model: this.cheapModel,
        max_tokens: 300,
        system: buildGradeSystemPrompt({ question, expectedAnswer, language, studentMemory }),
        messages: buildGradeMessages(studentAnswer),
      })
    } catch (err) {
      throw translateProviderError(err, 'answer grading')
    }
    const parsed = parseJsonObject(extractText(message), 'grade')
    const verdict = ['correct', 'partial', 'incorrect'].includes(parsed.verdict) ? parsed.verdict : 'partial'
    return { verdict, feedback: String(parsed.feedback || '').trim() }
  }

  // ─── Knowledge / RAG ──────────────────────────────────────────────────────
  // Plain-text grounded answer over retrieved chunks. Answers ONLY from the
  // provided contexts, or returns the exact "not covered" refusal sentence.
  async answerFromKnowledge(question, contexts = [], history = []) {
    const client = this._getClient()
    let message
    try {
      message = await client.messages.create({
        model: this.knowledgeModel,
        max_tokens: KNOWLEDGE_MAX_TOKENS,
        system: buildKnowledgeSystemPrompt(contexts),
        messages: buildKnowledgeMessages(history, question),
      })
    } catch (err) {
      throw translateProviderError(err, 'knowledge answering')
    }
    const answer = extractText(message).trim()
    if (!answer) throw new AppError('The AI returned an empty answer. Please try again.', 502)
    return answer
  }

  // Streaming variant of answerFromKnowledge — calls onText(delta) per chunk and
  // resolves with the full text, so the UI can reveal the reply word-by-word.
  async streamAnswerFromKnowledge(question, contexts = [], history = [], onText) {
    const client = this._getClient()
    const stream = client.messages.stream({
      model: this.knowledgeModel,
      max_tokens: KNOWLEDGE_MAX_TOKENS,
      system: buildKnowledgeSystemPrompt(contexts),
      messages: buildKnowledgeMessages(history, question),
    })
    stream.on('text', (t) => { try { if (typeof onText === 'function') onText(t) } catch (e) { /* ignore sink errors */ } })
    let final
    try {
      final = await stream.finalMessage()
    } catch (err) {
      throw translateProviderError(err, 'knowledge answering (stream)')
    }
    const answer = extractText(final).trim()
    if (!answer) throw new AppError('The AI returned an empty answer. Please try again.', 502)
    return answer
  }

  // Structured "animated mini-lesson" grounded answer. Returns a validated
  // teaching object, or throws so the caller can fall back to the plain answer.
  async answerFromKnowledgeStructured(question, contexts = [], history = []) {
    const client = this._getClient()
    let message
    try {
      message = await client.messages.create({
        model: this.knowledgeModel,
        max_tokens: KNOWLEDGE_MAX_TOKENS,
        system: buildStructuredKnowledgeSystemPrompt(contexts),
        messages: buildKnowledgeMessages(history, question),
      })
    } catch (err) {
      throw translateProviderError(err, 'knowledge answering (structured)')
    }
    return parseAndValidateTeaching(extractText(message))
  }

  // Extended grounded answer — the ONLY path allowed to use general knowledge,
  // for on-demand gap-filling (worked example / full solution / who-gave-this)
  // when the material itself lacks it. Same structured shape as the grounded
  // answer; the client labels it clearly as "beyond your material".
  async answerExtended(question, contexts = [], history = [], gapKind = '') {
    const client = this._getClient()
    let message
    try {
      message = await client.messages.create({
        model: this.knowledgeModel,
        max_tokens: KNOWLEDGE_MAX_TOKENS,
        system: buildExtendedKnowledgeSystemPrompt(contexts, gapKind),
        messages: buildKnowledgeMessages(history, question),
      })
    } catch (err) {
      throw translateProviderError(err, 'knowledge extending')
    }
    return parseAndValidateTeaching(extractText(message))
  }

  // Read a homework question from a PHOTO and solve it step by step, returning the
  // same structured teaching object (steps, formula, diagram, final answer). Uses
  // Claude vision — general knowledge is expected, so this is NOT grounded.
  async solveFromImage({ buffer, mimeType, filename, hint }) {
    const client = this._getClient()
    if (!VISION_IMAGE_TYPES.includes(mimeType) && !/\.(jpe?g|png|webp|gif)$/i.test(filename || '')) {
      throw new AppError('Please send a photo (JPG, PNG, or WEBP) of the question.', 415)
    }
    const base64 = buffer.toString('base64')
    const mediaType = VISION_IMAGE_TYPES.includes(mimeType) ? mimeType : 'image/jpeg'

    // The student's typed instruction (which question / how they want it), if any.
    const instruction = String(hint || '').trim().slice(0, 500)
    const userText = instruction
      ? `Read the question in this photo and solve it step by step. The student's instruction: "${instruction}"`
      : 'Read the question in this photo and solve it step by step.'

    let message
    try {
      message = await client.messages.create({
        model: this.knowledgeModel,
        max_tokens: KNOWLEDGE_MAX_TOKENS,
        system: buildSolvePhotoSystemPrompt(),
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: userText },
          ],
        }],
      })
    } catch (err) {
      throw translateProviderError(err, 'solving from photo')
    }
    return parseAndValidateTeaching(extractText(message))
  }

  // Best-effort: infer the school subject from a sample of uploaded material, so
  // file uploads (which usually have no subject tag) still become filterable.
  // Returns a short subject name, or '' if it can't tell. NEVER throws.
  async classifySubject(textSample) {
    try {
      const client = this._getClient()
      const message = await client.messages.create({
        model: this.doubtModel,
        max_tokens: 12,
        system:
          'You label study material with its school subject. Reply with ONLY the subject name in 1-2 words ' +
          '(e.g. Physics, Chemistry, Biology, Mathematics, English, History, Geography, Economics, Computer Science). ' +
          'If it is unclear or mixed, reply exactly: General. No other text.',
        messages: [{ role: 'user', content: String(textSample || '').slice(0, 4000) }],
      })
      const raw = extractText(message).trim().replace(/[."']/g, '')
      if (!raw || /^general$/i.test(raw) || raw.length > 40) return ''
      return raw
    } catch (_) {
      return ''
    }
  }

  // ─── Document extraction (upload → text) ──────────────────────────────────
  // Transcribe an uploaded PDF or photo into plain text using Claude vision, so
  // it can be chunked + embedded like any other material. Returns clean text.
  async extractDocumentText({ buffer, mimeType, filename }) {
    const client = this._getClient()
    const base64 = buffer.toString('base64')

    let sourceBlock
    if (mimeType === 'application/pdf' || /\.pdf$/i.test(filename || '')) {
      sourceBlock = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    } else if (VISION_IMAGE_TYPES.includes(mimeType)) {
      sourceBlock = { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } }
    } else {
      throw new AppError('Unsupported document type for extraction.', 415)
    }

    let message
    try {
      message = await client.messages.create({
        model: this.knowledgeModel,
        max_tokens: EXTRACT_MAX_TOKENS,
        system:
          'You transcribe uploaded learning material into clean plain text so it can be indexed for search. ' +
          'Output ONLY the transcribed content — every heading, paragraph, list, table, formula, and caption, in reading order. ' +
          'Preserve the meaning faithfully; do NOT summarise, add commentary, or invent anything. ' +
          'If a page has no readable text, output nothing for it.',
        messages: [{
          role: 'user',
          content: [
            sourceBlock,
            { type: 'text', text: 'Transcribe all the readable content of this document as plain text.' },
          ],
        }],
      })
    } catch (err) {
      throw translateProviderError(err, 'document extraction')
    }
    return extractText(message).trim()
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Concatenate the text blocks of a Messages API response (ignores any non-text blocks).
function extractText(message) {
  if (!message || !Array.isArray(message.content)) return ''
  return message.content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('')
}

// Pull a JSON object out of the model's text, tolerating ```json fences or
// stray prose around it, then parse it. Throws a clean 502 on malformed JSON.
function parseJsonObject(text, context) {
  let cleaned = String(text).trim()

  // Strip a leading/trailing markdown code fence if present.
  const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  if (fenceMatch) cleaned = fenceMatch[1].trim()

  // Fall back to the outermost { ... } span if there's surrounding text.
  if (!cleaned.startsWith('{')) {
    const first = cleaned.indexOf('{')
    const last = cleaned.lastIndexOf('}')
    if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1)
  }

  try {
    return JSON.parse(cleaned)
  } catch (err) {
    throw new AppError(`The AI returned an invalid ${context} format. Please try again.`, 502)
  }
}

// Optional per-slide comprehension check. Returns a clean object, or undefined if
// missing/invalid (so the client falls back to its own self-check). Never throws —
// a malformed check must never fail the whole lesson.
function normalizeCheck(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return undefined
  const str = (v) => (typeof v === 'string' ? v.trim() : '')
  const question = str(c.question)
  if (!question) return undefined
  const options = Array.isArray(c.options)
    ? c.options.filter((o) => typeof o === 'string' && o.trim()).map((o) => o.trim()).slice(0, 4)
    : []
  const wantsMcq = c.type === 'mcq' && options.length >= 2
  const out = {
    question,
    type: wantsMcq ? 'mcq' : (['conceptual', 'short'].includes(c.type) ? c.type : 'conceptual'),
    answer: str(c.answer),
    hint: str(c.hint),
    misconception: str(c.misconception),
  }
  if (wantsMcq) out.options = options
  // Optional harder follow-up to stretch a student who gets this right.
  const stretch = str(c.stretch)
  if (stretch) out.stretch = stretch
  return out
}

// Optional per-slide adaptive re-teach — what the teacher says if the student gets
// this slide's check WRONG (a genuinely different explanation, not a repeat). Same
// shape the client (reteach.js / LessonBoards) expects: { ack, gap, intro, steps[],
// easyQ }. Returns a clean object, or undefined if there's nothing usable — a
// malformed re-teach must NEVER fail the lesson; the client falls back to its own
// buildReteach() when this is absent.
function normalizeReteach(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return undefined
  const str = (v) => (typeof v === 'string' ? v.trim() : '')
  const steps = Array.isArray(r.steps)
    ? r.steps.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()).slice(0, 5)
    : []
  const out = { ack: str(r.ack), gap: str(r.gap), intro: str(r.intro), steps, easyQ: str(r.easyQ) }
  // Only keep it if it carries a real alternate explanation (steps) or at least a
  // named gap/intro — otherwise it adds nothing over the client fallback.
  if (!out.steps.length && !out.gap && !out.intro) return undefined
  return out
}

function parseAndValidateLesson(raw) {
  const data = parseJsonObject(raw, 'lesson')

  const invalid = (msg) => new AppError(`The AI returned an incomplete lesson: ${msg}`, 502)

  const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0

  if (!isNonEmptyString(data.lessonTitle)) throw invalid('missing lessonTitle')
  if (!isNonEmptyString(data.estimatedDuration)) throw invalid('missing estimatedDuration')
  if (!isNonEmptyString(data.summary)) throw invalid('missing summary')

  if (!Array.isArray(data.keyTerms) || data.keyTerms.some((t) => typeof t !== 'string')) {
    throw invalid('keyTerms must be an array of strings')
  }

  if (!Array.isArray(data.slides) || data.slides.length === 0) {
    throw invalid('slides must be a non-empty array')
  }

  // Re-number slides sequentially to guarantee the (lessonId, slideNumber) uniqueness
  // constraint holds regardless of what the model emitted.
  const slides = data.slides.map((slide, i) => {
    if (!slide || typeof slide !== 'object') throw invalid(`slide ${i + 1} is not an object`)
    if (!isNonEmptyString(slide.slideTitle)) throw invalid(`slide ${i + 1} missing slideTitle`)
    if (!isNonEmptyString(slide.explanation)) throw invalid(`slide ${i + 1} missing explanation`)
    if (!isNonEmptyString(slide.narrationText)) throw invalid(`slide ${i + 1} missing narrationText`)
    if (!VISUAL_TYPES.includes(slide.visualType)) {
      throw invalid(`slide ${i + 1} has invalid visualType "${slide.visualType}"`)
    }

    const visualData =
      slide.visualData && typeof slide.visualData === 'object' && !Array.isArray(slide.visualData)
        ? slide.visualData
        : {}

    const check = normalizeCheck(slide.check)
    const reteach = normalizeReteach(slide.reteach)

    return {
      slideNumber: i + 1,
      slideTitle: slide.slideTitle,
      explanation: slide.explanation,
      narrationText: slide.narrationText,
      visualType: slide.visualType,
      visualData,
      // Optional LLM-authored comprehension check (concept question). Omitted when
      // absent/invalid so the client falls back to its own self-check.
      ...(check ? { check } : {}),
      // Optional LLM-authored adaptive re-teach for a missed check (a genuinely
      // different explanation). Omitted when absent → client's buildReteach fallback.
      ...(reteach ? { reteach } : {}),
      // Animation metadata — validated/defaulted; safe to ignore on the frontend.
      ...normalizeAnimation(slide),
    }
  })

  return {
    lessonTitle: data.lessonTitle,
    estimatedDuration: data.estimatedDuration,
    summary: data.summary,
    keyTerms: data.keyTerms,
    slides,
  }
}

// The whiteboard shapes the frontend (DiagramRenderer) can actually draw. A
// diagram naming any other shape is dropped, so a bad shape never renders blank.
const DIAGRAM_SHAPES = ['triangle', 'rectangle', 'graph', 'coordinate', 'tree', 'flow']
const GAP_KINDS = ['example', 'solution', 'origin']

// Coerce the model's diagram object into something DiagramRenderer can render, or
// null. Labels are clipped; a shape whose data is too thin to be meaningful (a
// 1-bar graph, a 1-step flow) is dropped rather than drawn misleadingly.
function normalizeDiagram(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null
  const shape = typeof d.shape === 'string' ? d.shape.trim().toLowerCase() : ''
  if (!DIAGRAM_SHAPES.includes(shape)) return null

  const lbl = (v) => (typeof v === 'string' ? v.trim().slice(0, 24) : '')
  const src = (d.data && typeof d.data === 'object' && !Array.isArray(d.data)) ? d.data : {}
  let data = {}

  switch (shape) {
    case 'triangle':
      data = { a: lbl(src.a), b: lbl(src.b), c: lbl(src.c) }
      break
    case 'rectangle':
      data = { topLabel: lbl(src.topLabel), sideLabel: lbl(src.sideLabel) }
      break
    case 'graph': {
      const values = Array.isArray(src.values)
        ? src.values.map(Number).filter((n) => Number.isFinite(n) && n >= 0).slice(0, 4)
        : []
      if (values.length < 2) return null
      data = { values }
      break
    }
    case 'tree':
      data = { root: lbl(src.root), left: lbl(src.left), right: lbl(src.right) }
      break
    case 'flow': {
      const steps = Array.isArray(src.steps)
        ? src.steps.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim().slice(0, 14)).slice(0, 3)
        : []
      if (steps.length < 2) return null
      data = { steps }
      break
    }
    case 'coordinate':
    default:
      data = {}
      break
  }

  const caption = typeof d.caption === 'string' ? d.caption.trim().slice(0, 60) : ''
  return { shape, caption, data }
}

// Keep only recognised, de-duplicated gap tokens.
function normalizeGaps(g) {
  if (!Array.isArray(g)) return []
  return [...new Set(
    g.map((x) => String(x).trim().toLowerCase()).filter((x) => GAP_KINDS.includes(x)),
  )]
}

// Validate the structured knowledge/teaching JSON into a clean object. Throws on
// malformed/empty output so the caller falls back to the plain-text answer.
function parseAndValidateTeaching(raw) {
  const data = parseJsonObject(raw, 'knowledge lesson')
  const str = (v) => (typeof v === 'string' ? v.trim() : '')

  const title = str(data.title)
  const intro = str(data.intro)
  // Need at least a title or an intro to render anything meaningful.
  if (!title && !intro) {
    throw new AppError('The AI returned an empty structured answer.', 502)
  }

  const steps = Array.isArray(data.steps)
    ? data.steps.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()).slice(0, 5)
    : []

  return {
    title: title || 'Explanation',
    intro,
    steps,
    formula: str(data.formula),
    example: str(data.example),
    quickCheck: str(data.quickCheck),
    diagram: normalizeDiagram(data.diagram),
    gaps: normalizeGaps(data.gaps),
  }
}

// Map an Anthropic SDK error into a clean operational AppError. The API key is
// never included in the message, so nothing sensitive leaks to the client.
function translateProviderError(err, context) {
  if (err instanceof AppError) return err

  const status = typeof err?.status === 'number' ? err.status : null
  const apiMessage = String(err?.error?.error?.message || err?.error?.message || err?.message || '')

  if (status === 401 || status === 403) {
    return new AppError('AI provider authentication failed. Check ANTHROPIC_API_KEY.', 502)
  }
  // Billing/credit exhaustion comes back as a 400 invalid_request_error. Retrying
  // will NOT help, so surface it clearly instead of a generic "try again".
  if (/credit balance is too low|billing|purchase credits|insufficient/i.test(apiMessage)) {
    return new AppError(
      'AI is temporarily unavailable: the Anthropic account is out of credits. An admin needs to add credits at console.anthropic.com → Plans & Billing.',
      503,
    )
  }
  if (status === 429) {
    return new AppError('AI provider rate limit reached. Please try again shortly.', 503)
  }
  return new AppError(`AI provider request failed during ${context}. Please try again.`, 502)
}

module.exports = AnthropicProvider
