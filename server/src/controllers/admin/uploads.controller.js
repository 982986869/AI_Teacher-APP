'use strict'

// Admin content-image upload — accepts a single image (multer memoryStorage), pushes it
// to Supabase Storage and returns its public URL. The admin app embeds that URL as an
// <img> inside a question/option's HTML, which students already render.

const ApiResponse = require('../../utils/ApiResponse')
const { uploadImage, isConfigured } = require('../../services/storage')

const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'])

async function uploadContentImage(req, res, next) {
  try {
    if (!isConfigured()) return ApiResponse.error(res, 'Image storage is not configured on the server.', 503)
    if (!req.file || !req.file.buffer) return ApiResponse.error(res, 'No image file was uploaded.', 400)
    const mime = String(req.file.mimetype || '').toLowerCase()
    if (!ALLOWED.has(mime)) return ApiResponse.error(res, 'Only JPG, PNG, WebP or GIF images are allowed.', 415)
    const url = await uploadImage(req.file.buffer, { contentType: mime, originalName: req.file.originalname })
    return ApiResponse.success(res, { url }, 'Image uploaded')
  } catch (e) {
    return next(e)
  }
}

module.exports = { uploadContentImage }
