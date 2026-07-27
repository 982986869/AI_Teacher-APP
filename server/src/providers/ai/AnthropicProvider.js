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

class AnthropicProvider extends AIProvider {
  constructor() {
    super()
    // Client is created lazily so the server starts without ANTHROPIC_API_KEY set.
    this._client = null
    this.lessonModel = config.ai.lessonModel
    this.doubtModel = config.ai.doubtModel
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
        model: this.doubtModel,
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
  async generateTeacherResponse({ intent, language, contexts, lesson, history, question, slideIndex, level, strategy, studentContext, gradeLevel }) {
    const client = this._getClient()
    let message
    try {
      message = await client.messages.create({
        model: this.doubtModel,
        max_tokens: TEACHER_MAX_TOKENS,
        system: buildTeacherSystemPrompt({ intent, language, contexts, lesson, level, strategy, studentContext, gradeLevel }),
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
  async streamTeacherResponse({ intent, language, contexts, lesson, history, question, slideIndex, level, strategy, studentContext, gradeLevel }, onText) {
    const client = this._getClient()
    const stream = client.messages.stream({
      model: this.doubtModel,
      max_tokens: TEACHER_MAX_TOKENS,
      system: buildTeacherSystemPrompt({ intent, language, contexts, lesson, level, strategy, studentContext, gradeLevel }),
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
        model: this.doubtModel,
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
        model: this.doubtModel,
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

// Map an Anthropic SDK error into a clean operational AppError. The API key is
// never included in the message, so nothing sensitive leaks to the client.
function translateProviderError(err, context) {
  if (err instanceof AppError) return err

  const status = typeof err?.status === 'number' ? err.status : null

  if (status === 401 || status === 403) {
    return new AppError('AI provider authentication failed. Check ANTHROPIC_API_KEY.', 502)
  }
  if (status === 429) {
    return new AppError('AI provider rate limit reached. Please try again shortly.', 503)
  }
  return new AppError(`AI provider request failed during ${context}. Please try again.`, 502)
}

module.exports = AnthropicProvider
