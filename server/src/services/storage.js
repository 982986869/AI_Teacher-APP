'use strict'

// Stores uploads — question/option diagrams from the admin app, profile photos,
// support-ticket attachments — on this server's disk under server/uploads/, which
// index.js serves at /uploads. Returns an absolute URL (APP_PUBLIC_URL based)
// because the URL is embedded in question HTML and read by the mobile app.
// Names are random and never reused, so /uploads is cached for a year.

const crypto = require('crypto')
const fs = require('fs/promises')
const path = require('path')
const { config } = require('../config/env')

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

// Local disk is always available. Kept so the callers' guard needs no change.
const isConfigured = () => true

async function save(buffer, folder, ext) {
  const rel = `${folder}/${crypto.randomBytes(16).toString('hex')}.${ext}`
  await fs.mkdir(path.join(UPLOAD_DIR, folder), { recursive: true })
  await fs.writeFile(path.join(UPLOAD_DIR, rel), buffer, { flag: 'wx' })
  return `${config.publicUrl}/uploads/${rel}`
}

const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
const safeExt = (originalName, mime) => {
  const fromName = String(originalName || '').split('.').pop()
  const e = String(fromName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(e)) return e === 'jpeg' ? 'jpg' : e
  return EXT_BY_MIME[String(mime || '').toLowerCase()] || 'jpg'
}

// Save an image Buffer → returns its public URL.
// `folder` groups uploads by feature (questions/, avatars/, …).
async function uploadImage(buffer, { originalName, contentType, folder = 'questions' } = {}) {
  return save(buffer, folder, safeExt(originalName, contentType))
}

// Support-ticket attachments are not only images — a parent disputing a charge attaches
// the invoice PDF as often as a screenshot. `safeExt` above deliberately falls back to
// 'jpg' for anything it doesn't recognise (right for a question diagram, wrong for a
// PDF, which would then be stored and served as .jpg), so file uploads get their own
// extension whitelist and content type.
const FILE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'pdf', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx']
const EXT_BY_FILE_MIME = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/heic': 'heic',
}
function fileExt(originalName, mime) {
  const fromName = String(originalName || '').split('.').pop()
  const e = String(fromName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (FILE_EXTS.includes(e)) return e === 'jpeg' ? 'jpg' : e
  const m = String(mime || '').toLowerCase()
  return EXT_BY_FILE_MIME[m] || EXT_BY_MIME[m] || 'bin'
}

// Save any allowed attachment Buffer → public URL. Own folder.
async function uploadFile(buffer, { originalName, contentType, folder = 'uploads' } = {}) {
  return save(buffer, folder, fileExt(originalName, contentType))
}

module.exports = { uploadImage, uploadFile, isConfigured, UPLOAD_DIR }
