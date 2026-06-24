'use strict'

// Convert solution HTML (NCERT/exemplar) into clean plain text for embedding:
// drop images (incl. base64 data URIs), scripts/styles and tags; keep MathJax
// tex content (strip only the {tex}/{/tex} delimiters); decode common entities;
// collapse whitespace. Embedding base64 blobs is useless and huge, so they go.
function htmlToText(html) {
  let s = String(html || '')
  s = s.replace(/<img[^>]*>/gi, ' ')
  s = s.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
  s = s.replace(/\{tex\}/g, ' ').replace(/\{\/tex\}/g, ' ')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<\/(p|div|li|tr|h[1-6]|section)>/gi, '\n')
  s = s.replace(/<[^>]+>/g, ' ')
  s = s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&times;/gi, '×')
    .replace(/&divide;/gi, '÷')
  s = s.replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return s
}

module.exports = { htmlToText }
