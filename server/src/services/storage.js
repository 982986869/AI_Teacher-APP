'use strict'

// Uploads content images (question / option diagrams authored in the admin app) to
// Supabase Storage and returns a public URL that gets embedded as <img src> in the
// question/option HTML — students already render that HTML, so no student-side change.
//
// Config (server .env):
//   SUPABASE_URL              e.g. https://<project-ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY service-role key (server-only; never ship to the client)
//   SUPABASE_STORAGE_BUCKET   public bucket name (default: content-images)
// If the keys are absent the upload endpoint reports a clear "not configured" error
// instead of crashing — every other feature keeps working.

const crypto = require('crypto')
const { createClient } = require('@supabase/supabase-js')

const URL = process.env.SUPABASE_URL || ''
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'content-images'

const isConfigured = () => !!(URL && KEY)

let _client = null
function client() {
  if (!isConfigured()) return null
  if (!_client) _client = createClient(URL, KEY, { auth: { persistSession: false } })
  return _client
}

const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
const safeExt = (originalName, mime) => {
  const fromName = String(originalName || '').split('.').pop()
  const e = String(fromName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(e)) return e === 'jpeg' ? 'jpg' : e
  return EXT_BY_MIME[String(mime || '').toLowerCase()] || 'jpg'
}

// Upload a Buffer → returns the public URL. Throws with a readable message on failure.
// `folder` groups uploads by feature within the one bucket (questions/, avatars/, …).
async function uploadImage(buffer, { contentType, originalName, folder = 'questions' } = {}) {
  const sb = client()
  if (!sb) throw new Error('Image storage is not configured on the server (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).')
  const ext = safeExt(originalName, contentType)
  const path = `${folder}/${crypto.randomBytes(16).toString('hex')}.${ext}`
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: contentType || 'image/jpeg',
    upsert: false,
    cacheControl: '31536000',
  })
  if (error) throw new Error(error.message || 'Storage upload failed')
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  if (!data || !data.publicUrl) throw new Error('Upload succeeded but no public URL was returned (is the bucket public?).')
  return data.publicUrl
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

// Upload any allowed attachment Buffer → public URL. Same bucket, own folder.
async function uploadFile(buffer, { contentType, originalName, folder = 'uploads' } = {}) {
  const sb = client()
  if (!sb) throw new Error('File storage is not configured on the server (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).')
  const ext = fileExt(originalName, contentType)
  const path = `${folder}/${crypto.randomBytes(16).toString('hex')}.${ext}`
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: false,
    cacheControl: '31536000',
  })
  if (error) throw new Error(error.message || 'Storage upload failed')
  const { data } = sb.storage.from(BUCKET).getPublicUrl(path)
  if (!data || !data.publicUrl) throw new Error('Upload succeeded but no public URL was returned (is the bucket public?).')
  return data.publicUrl
}

module.exports = { uploadImage, uploadFile, isConfigured, BUCKET }
