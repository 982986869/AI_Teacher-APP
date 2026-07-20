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
async function uploadImage(buffer, { contentType, originalName } = {}) {
  const sb = client()
  if (!sb) throw new Error('Image storage is not configured on the server (set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).')
  const ext = safeExt(originalName, contentType)
  const path = `questions/${crypto.randomBytes(16).toString('hex')}.${ext}`
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

module.exports = { uploadImage, isConfigured, BUCKET }
