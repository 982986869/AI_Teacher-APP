'use strict'

// Deterministic final pass before a teacher reply is sent. Strips filler/AI-tone,
// caps length, normalizes whitespace, and flags a likely language mismatch. Keeps
// the teacher voice tight without an extra LLM round-trip.

const FILLER_OPENERS = [
  'great question', 'good question', 'excellent question', 'that\'s a great question',
  'sure', 'sure!', 'certainly', 'of course', 'absolutely',
  'let me explain', 'let me break it down', 'let me help', 'let me clarify',
  'let\'s dive in', 'let\'s dive deeper', 'let\'s explore', 'let\'s get started',
  'i\'d be happy to', 'i am happy to', 'happy to help', 'no problem',
]

const FILLER_PHRASES = [
  /\bin conclusion\b[:,]?/gi,
  /\bto sum up\b[:,]?/gi,
  /\bto summari[sz]e\b[:,]?/gi,
  /\bimagine a world where\b/gi,
  /\bin many real[- ]world situations\b/gi,
  /\bas an ai\b[^.]*\.?/gi,
  /\bit'?s worth noting that\b/gi,
  /\ba simple mental model (of|is)\b/gi,
]

// A safety ceiling only — answer LENGTH is the prompt's job (about 5 lines, up to 8
// for a worked numerical). Raised from 5, which cut worked steps.
const MAX_LINES = 12

function stripFiller(text) {
  let s = String(text || '').trim()

  // Remove a leading filler opener (optionally followed by punctuation/comma).
  let changed = true
  let stripped = false
  while (changed) {
    changed = false
    const lower = s.toLowerCase()
    for (const opener of FILLER_OPENERS) {
      if (lower.startsWith(opener)) {
        s = s.slice(opener.length).replace(/^[\s,.!:—-]+/, '')
        changed = true
        stripped = true
        break
      }
    }
  }
  // "Great question — this is…" leaves "this is…": restore the sentence's capital.
  // Only after a strip, so a reply that legitimately starts lowercase ("pH is 7") stays.
  if (stripped) s = s.replace(/^[a-z]/, (c) => c.toUpperCase())

  // Remove mid-text AI-tone phrases anywhere.
  for (const re of FILLER_PHRASES) s = s.replace(re, '')

  return s.replace(/[ \t]{2,}/g, ' ').trim()
}

// Strip markdown that would be read aloud literally by TTS (**, *, _, `, #, bullets).
function stripMarkdown(text) {
  let s = String(text || '')
  s = s.replace(/\*\*(.*?)\*\*/g, '$1').replace(/__(.*?)__/g, '$1') // bold
  s = s.replace(/(^|[\s(])[*_]([^*_\n]+)[*_]([\s).,!?]|$)/g, '$1$2$3') // italic
  s = s.replace(/`([^`]+)`/g, '$1') // inline code
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
  s = s.replace(/^\s*[-*•]\s+/gm, '') // bullet markers
  return s
}

function capLines(text) {
  const lines = String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length <= MAX_LINES) return { text: lines.join('\n'), truncated: false }
  // Keep the FIRST lines, in order. Never "first few + last": that silently deleted
  // the middle steps of a worked answer.
  return { text: lines.slice(0, MAX_LINES).join('\n'), truncated: true }
}

// A reply that hit max_tokens stops mid-sentence. End it at the last full sentence
// (., !, ? or the Hindi danda) that is followed by whitespace or the end of the
// text, so "3.14" is not mistaken for a sentence end — or at the last line break,
// since a worked numerical is often written one step per line with no full stop.
// No boundary at all → unchanged.
function trimToLastSentence(text) {
  const s = String(text || '')
  let end = -1
  const re = /[.!?।](?=\s|$)|\n/g
  let m
  while ((m = re.exec(s)) !== null) end = m[0] === '\n' ? m.index : m.index + 1
  return end >= 0 ? s.slice(0, end).trim() : s
}

// The SPOKEN side of the same rule, for a streamed reply. Text is passed on to
// `emit` only up to the last sentence end (as trimToLastSentence) or line break; the
// unfinished tail is held. end(cut): flush the tail, unless the reply was cut by
// max_tokens — then the tail is dropped, so the student never hears "…splits wa".
// Concatenating everything emitted reproduces the text exactly (when not cut).
function createSpokenGate(emit) {
  let held = ''
  const BOUNDARY = /[.!?।](?=\s)|\n/g
  return {
    push(t) {
      held += String(t || '')
      let cut = -1
      let m
      BOUNDARY.lastIndex = 0
      while ((m = BOUNDARY.exec(held)) !== null) cut = m.index + 1
      if (cut > 0) { const out = held.slice(0, cut); held = held.slice(cut); emit(out) }
    },
    end(wasCut) {
      const rest = held
      held = ''
      if (rest && !wasCut) emit(rest)
    },
  }
}

// Heuristic language-mismatch flag (does NOT rewrite — the prompt owns language).
function languageFlag(text, expected) {
  const hasDevanagari = /[ऀ-ॿ]/.test(text)
  if (expected === 'en' && hasDevanagari) return 'expected_en_got_devanagari'
  if (expected === 'hi' && !hasDevanagari) return 'expected_hi_got_roman'
  return null
}

// Run all guards. Returns { text, flags }.
function applyGuard(rawAnswer, { language = 'en' } = {}) {
  const noFiller = stripFiller(rawAnswer)
  const removedFiller = noFiller !== String(rawAnswer || '').trim()
  const clean = stripMarkdown(noFiller)
  const capped = capLines(clean)
  const langFlag = languageFlag(capped.text, language)

  let text = capped.text
  if (!text) text = String(rawAnswer || '').trim() // never return empty

  return {
    text,
    flags: { removedFiller, truncated: capped.truncated, languageFlag: langFlag },
  }
}

module.exports = { applyGuard, stripFiller, capLines, trimToLastSentence, createSpokenGate, MAX_LINES }
