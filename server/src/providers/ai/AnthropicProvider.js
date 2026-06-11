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

const VISUAL_TYPES = ['DIAGRAM', 'CHART', 'EXAMPLE', 'ANALOGY', 'FORMULA', 'NONE']

// Generous ceiling for a 5–7 slide lesson; well under the ~16K non-streaming
// timeout threshold, so a plain create() call is safe.
const LESSON_MAX_TOKENS = 8000
const DOUBT_MAX_TOKENS = 1024

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
