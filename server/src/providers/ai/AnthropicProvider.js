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

  async generateLesson(topic, subject, gradeLevel) {
    const client = this._getClient()

    let message
    try {
      message = await client.messages.create({
        model: this.lessonModel,
        max_tokens: LESSON_MAX_TOKENS,
        system: buildLessonSystemPrompt(),
        messages: [{ role: 'user', content: buildLessonUserPrompt(topic, subject, gradeLevel) }],
      })
    } catch (err) {
      throw translateProviderError(err, 'lesson generation')
    }

    const raw = extractText(message)
    const payload = parseAndValidateLesson(raw)
    return payload
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
  async generateTeacherResponse({ intent, language, contexts, lesson, history, question, slideIndex, level, strategy }) {
    const client = this._getClient()
    let message
    try {
      message = await client.messages.create({
        model: this.doubtModel,
        max_tokens: TEACHER_MAX_TOKENS,
        system: buildTeacherSystemPrompt({ intent, language, contexts, lesson, level, strategy }),
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
  async streamTeacherResponse({ intent, language, contexts, lesson, history, question, slideIndex, level, strategy }, onText) {
    const client = this._getClient()
    const stream = client.messages.stream({
      model: this.doubtModel,
      max_tokens: TEACHER_MAX_TOKENS,
      system: buildTeacherSystemPrompt({ intent, language, contexts, lesson, level, strategy }),
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
  async gradeAnswer({ question, expectedAnswer, studentAnswer, language }) {
    const client = this._getClient()
    let message
    try {
      message = await client.messages.create({
        model: this.doubtModel,
        max_tokens: 300,
        system: buildGradeSystemPrompt({ question, expectedAnswer, language }),
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

    return {
      slideNumber: i + 1,
      slideTitle: slide.slideTitle,
      explanation: slide.explanation,
      narrationText: slide.narrationText,
      visualType: slide.visualType,
      visualData,
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
