'use strict'

// Split text into overlapping chunks by character length, preferring to break on
// a paragraph/sentence/word boundary near the limit so chunks stay coherent.
function chunkText(text, { chunkSize = 1500, overlap = 200 } = {}) {
  const clean = String(text || '').replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trim()
  if (!clean) return []
  if (clean.length <= chunkSize) return [clean]

  const chunks = []
  let start = 0
  while (start < clean.length) {
    let end = Math.min(start + chunkSize, clean.length)

    if (end < clean.length) {
      // Prefer a clean boundary in the last 40% of the window.
      const floor = start + Math.floor(chunkSize * 0.6)
      const para = clean.lastIndexOf('\n\n', end)
      const nl = clean.lastIndexOf('\n', end)
      const sentence = clean.lastIndexOf('. ', end)
      const space = clean.lastIndexOf(' ', end)
      const brk = Math.max(para, nl, sentence, space)
      if (brk > floor) end = brk
    }

    const piece = clean.slice(start, end).trim()
    if (piece) chunks.push(piece)
    if (end >= clean.length) break
    start = Math.max(end - overlap, start + 1)
  }
  return chunks
}

module.exports = { chunkText }
