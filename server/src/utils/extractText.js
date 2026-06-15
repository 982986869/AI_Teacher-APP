'use strict'

// Phase 1 supports plain text and markdown only (no PDF/DOCX).
const ALLOWED_MIME = new Set([
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/octet-stream', // browsers often send .md as octet-stream
])

const ALLOWED_EXT = ['txt', 'md', 'markdown']

function isSupportedUpload({ mimeType, filename }) {
  const ext = String(filename || '').toLowerCase().split('.').pop()
  return ALLOWED_MIME.has(mimeType) || ALLOWED_EXT.includes(ext)
}

// Decode an uploaded buffer to UTF-8 text.
function extractText(buffer) {
  if (!Buffer.isBuffer(buffer)) return ''
  return buffer.toString('utf-8')
}

module.exports = { ALLOWED_MIME, ALLOWED_EXT, isSupportedUpload, extractText }
