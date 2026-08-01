'use strict'

const { AppError } = require('../middleware/errorHandler')

// Supported upload kinds. Plain text/markdown are read directly; PDFs and images
// (photographed textbook pages, screenshots) are transcribed via Claude vision so
// they can be chunked + embedded like any other material.
const TEXT_MIME = ['text/plain', 'text/markdown', 'text/x-markdown']
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const PDF_MIME = ['application/pdf']

const EXT_KIND = {
  txt: 'text',
  text: 'text',
  md: 'markdown',
  markdown: 'markdown',
  pdf: 'pdf',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  webp: 'image',
  gif: 'image',
}

function extOf(filename) {
  const m = /\.([a-z0-9]+)$/i.exec(String(filename || '').trim())
  return m ? m[1].toLowerCase() : ''
}

// Classify an upload into a kind ('text' | 'markdown' | 'pdf' | 'image') or null
// if unsupported. Trusts the extension first, then falls back to the MIME type
// (some clients send application/octet-stream for .md or a bare photo).
function classifyUpload({ mimeType, filename } = {}) {
  const byExt = EXT_KIND[extOf(filename)]
  if (byExt) return byExt

  const mt = String(mimeType || '').toLowerCase()
  if (TEXT_MIME.includes(mt)) return mt.includes('markdown') ? 'markdown' : 'text'
  if (PDF_MIME.includes(mt)) return 'pdf'
  if (IMAGE_MIME.includes(mt)) return 'image'
  return null
}

// True when we can extract text from this upload.
function isSupportedUpload({ mimeType, filename } = {}) {
  return classifyUpload({ mimeType, filename }) !== null
}

// Extract plain text from an uploaded file buffer. Text/markdown are decoded
// locally; PDFs and images are transcribed by the AI provider's vision model.
// ASYNC — callers must await.
async function extractText(buffer, { mimeType, filename } = {}) {
  if (!Buffer.isBuffer(buffer)) {
    throw new AppError('Invalid upload buffer.', 422)
  }
  const kind = classifyUpload({ mimeType, filename })
  if (!kind) {
    throw new AppError('Unsupported file type. Upload a .txt, .md, .pdf, or an image (jpg/png/webp).', 415)
  }

  if (kind === 'text' || kind === 'markdown') {
    // Strip a UTF-8 BOM if present, then decode.
    return buffer.toString('utf8').replace(/^﻿/, '')
  }

  if (kind === 'pdf') {
    // Text-based PDFs (NCERT, most textbooks/notes) → extract ALL text locally
    // with pdf-parse: fast, complete, free, and NOT capped by any model output
    // limit (the old vision path truncated long chapters). Only genuinely scanned
    // / image-only PDFs fall through to the vision OCR path below.
    let pdfText = ''
    try {
      const { PDFParse } = require('pdf-parse')
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      // pdf-parse inserts "-- N of M --" page-break markers; strip them so the
      // indexed text stays clean.
      pdfText = String(result?.text || '').replace(/\s*--\s*\d+\s*of\s*\d+\s*--\s*/g, '\n\n').trim()
    } catch (_) {
      pdfText = ''
    }
    // A real text PDF yields plenty of characters; a scanned one yields ~nothing.
    if (pdfText.length >= 100) return pdfText
    // else: scanned/image-only PDF → fall through to vision OCR.
  }

  // Image, or scanned PDF → Claude vision transcription. Lazy-require to avoid any
  // import cycle and keep the provider (and its API-key check) off the hot path
  // for plain-text uploads.
  const { getAIProvider } = require('../providers')
  const provider = getAIProvider()
  if (typeof provider.extractDocumentText !== 'function') {
    throw new AppError('The configured AI provider cannot extract text from files.', 501)
  }
  const text = await provider.extractDocumentText({ buffer, mimeType, filename })
  if (!text || !text.trim()) {
    throw new AppError('No readable text could be extracted from this file.', 422)
  }
  return text
}

module.exports = { isSupportedUpload, classifyUpload, extractText }
