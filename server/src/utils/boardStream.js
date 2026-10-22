'use strict'

// Splits the model's streamed answer into spoken text and board elements.
//
// The teacher prompt (teacherResponse.prompt.js, BOARD block) asks the model to write
// drawing commands inline as `[[board:{...json...}]]`, each on its own line right after
// the sentence it illustrates. Streaming hands us that text in arbitrary chunks, so a
// marker can arrive split anywhere — "[[bo" | "ard:{"op":"re" | "ct"...}]]". This parser
// buffers just enough to never emit a partial marker as text, drops anything that is
// not a valid element (see boardElements.js), and swallows the newline that followed a
// marker so a marker on its own line leaves no blank line in the caption.

const { validateElement, MAX_ELEMENTS } = require('./boardElements')

const MARK_OPEN = '[[board:'
const MARK_CLOSE = ']]'
// A marker is one line of JSON. One that has not closed by its newline — or that runs
// past this many characters — is malformed; it is dropped alone, never the text after it.
const MAX_MARKER = 600

// Length of the longest suffix of `s` that is a proper prefix of MARK_OPEN — the part
// that might be the start of a marker whose rest has not arrived yet.
function partialPrefixLen(s) {
  for (let n = Math.min(MARK_OPEN.length - 1, s.length); n > 0; n--) {
    if (MARK_OPEN.startsWith(s.slice(-n))) return n
  }
  return 0
}

function createBoardStreamParser({ onText, onElement, maxElements = MAX_ELEMENTS } = {}) {
  let buf = ''
  let text = ''
  let swallowNewline = false
  const elements = []

  const emit = (s) => {
    if (!s) return
    if (swallowNewline) {
      swallowNewline = false
      if (s[0] === '\n') s = s.slice(1)
      if (!s) return
    }
    text += s
    if (typeof onText === 'function') onText(s)
  }

  const drain = (final) => {
    for (;;) {
      const i = buf.indexOf(MARK_OPEN)
      if (i < 0) {
        const keep = final ? 0 : partialPrefixLen(buf)
        emit(buf.slice(0, buf.length - keep))
        buf = buf.slice(buf.length - keep)
        return
      }
      emit(buf.slice(0, i))
      buf = buf.slice(i)
      const j = buf.indexOf(MARK_CLOSE, MARK_OPEN.length)
      if (j < 0) {
        // Open, not yet closed. A newline before the close means the model never
        // closed this marker (e.g. a single `]`): drop just that line and carry on,
        // so one typo cannot swallow the rest of the answer. Same if it runs away.
        const nl = buf.indexOf('\n', MARK_OPEN.length)
        if (nl >= 0) { buf = buf.slice(nl + 1); continue }
        if (buf.length > MAX_MARKER) { buf = ''; return }
        // Otherwise hold it for the next chunk. At end of stream it is garbage — drop it.
        if (final) buf = ''
        return
      }
      const inner = buf.slice(MARK_OPEN.length, j)
      buf = buf.slice(j + MARK_CLOSE.length)
      swallowNewline = true
      let el = null
      try { el = validateElement(JSON.parse(inner)) } catch (_) { el = null }
      if (el && elements.length < maxElements) {
        elements.push(el)
        if (typeof onElement === 'function') onElement(el)
      }
    }
  }

  return {
    push(chunk) { buf += String(chunk == null ? '' : chunk); drain(false) },
    end() { drain(true) },
    get text() { return text },
    elements,
  }
}

module.exports = { createBoardStreamParser, MARK_OPEN, MARK_CLOSE }
