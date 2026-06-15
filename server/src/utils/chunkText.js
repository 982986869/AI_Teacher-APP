'use strict'

/**
 * Split text into overlapping chunks for embedding. Character-based with a soft
 * preference for breaking on paragraph/sentence/word boundaries near the limit.
 *
 * @param {string} text
 * @param {{ chunkSize?: number, overlap?: number }} opts
 * @returns {string[]}
 */
function chunkText(text, { chunkSize = 1500, overlap = 200 } = {}) {
  const clean = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!clean) return []
  if (clean.length <= chunkSize) return [clean]

  const size = Math.max(200, chunkSize)
  const lap = Math.min(Math.max(0, overlap), Math.floor(size / 2))

  const chunks = []
  let start = 0

  while (start < clean.length) {
    let end = Math.min(start + size, clean.length)

    if (end < clean.length) {
      // Prefer a natural boundary in the back half of the window.
      const slice = clean.slice(start, end)
      const candidates = [
        slice.lastIndexOf('\n\n'),
        slice.lastIndexOf('\n'),
        slice.lastIndexOf('. '),
        slice.lastIndexOf(' '),
      ]
      const breakAt = Math.max(...candidates)
      if (breakAt > size * 0.5) end = start + breakAt + 1
    }

    const piece = clean.slice(start, end).trim()
    if (piece) chunks.push(piece)

    if (end >= clean.length) break
    start = Math.max(end - lap, start + 1) // always make progress
  }

  return chunks
}

module.exports = { chunkText }
