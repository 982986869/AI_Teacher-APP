'use strict'

// Shared normalization for slide animation metadata. Used by BOTH the mock
// generator and the real Claude validator so every slide carries a consistent,
// backward-safe shape — the frontend can ignore these fields entirely and still
// use slideTitle/explanation/narrationText/visualType/visualData.

const ANIMATION_TYPES = ['FADE_IN', 'STEP_REVEAL', 'BUILD_UP', 'TYPEWRITER', 'ZOOM', 'NONE']

// Sensible default animation per visual type when the model omits animationType.
const DEFAULT_BY_VISUAL = {
  FORMULA: 'BUILD_UP',
  DIAGRAM: 'STEP_REVEAL',
  EXAMPLE: 'STEP_REVEAL',
  CHART: 'BUILD_UP',
  ANALOGY: 'FADE_IN',
  NONE: 'FADE_IN',
}

// Split narration into short, caption-sized chunks (~4–14 words) for timed subtitles.
function chunkNarration(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return []

  const sentences = clean.match(/[^.!?]+[.!?]*/g) || [clean]
  const chunks = []
  for (const raw of sentences) {
    const sentence = raw.trim()
    if (!sentence) continue
    const words = sentence.split(' ')
    if (words.length <= 14) {
      chunks.push(sentence)
    } else {
      // Break long sentences into ~12-word chunks so subtitles stay readable.
      for (let i = 0; i < words.length; i += 12) {
        chunks.push(words.slice(i, i + 12).join(' '))
      }
    }
  }
  return chunks
}

function toObjectArray(value) {
  if (!Array.isArray(value)) return []
  return value.filter((x) => x && typeof x === 'object' && !Array.isArray(x))
}

function toStringArray(value) {
  if (!Array.isArray(value)) return []
  return value.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim())
}

/**
 * Produce the normalized animation block for a slide. Missing or malformed fields
 * fall back to defaults derived from the slide, so the response always has a
 * consistent shape. Returns the six animation fields only.
 */
function normalizeAnimation(slide = {}) {
  const animationType = ANIMATION_TYPES.includes(slide.animationType)
    ? slide.animationType
    : (DEFAULT_BY_VISUAL[slide.visualType] || 'FADE_IN')

  const provided = toStringArray(slide.subtitleChunks)
  const subtitleChunks = provided.length ? provided : chunkNarration(slide.narrationText)

  return {
    animationType,
    animationSteps: toObjectArray(slide.animationSteps),
    subtitleChunks,
    visualSequence: toObjectArray(slide.visualSequence),
    highlightTargets: toObjectArray(slide.highlightTargets),
    voiceCue:
      typeof slide.voiceCue === 'string' && slide.voiceCue.trim() ? slide.voiceCue.trim() : null,
  }
}

module.exports = { ANIMATION_TYPES, chunkNarration, normalizeAnimation }
