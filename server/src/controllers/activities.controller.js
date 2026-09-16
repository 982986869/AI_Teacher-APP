'use strict'

const ApiResponse = require('../utils/ApiResponse')
const svc = require('../services/activities.service')
const { resolveClassNum } = require('../services/personalization/enforce')

// Same class resolution as the rest of content browsing: honour ?class= (any "7" /
// "Class 7" form, for the any-class picker) and fall back to the student's own class.
const classOf = (req) => {
  const m = String(req.query.class || '').match(/\d{1,2}/)
  return m ? parseInt(m[0], 10) : resolveClassNum(req)
}

async function subjects(req, res, next) {
  try {
    return ApiResponse.success(res, await svc.listSubjects(classOf(req), req.user.id))
  } catch (e) { return next(e) }
}

async function chapters(req, res, next) {
  try {
    return ApiResponse.success(res, await svc.listChapters(req.params.subjectSlug, classOf(req), req.user.id))
  } catch (e) { return next(e) }
}

async function activity(req, res, next) {
  try {
    if (!/^\d+$/.test(String(req.params.chapterId))) return ApiResponse.error(res, 'Invalid chapter', 400)
    const mode = req.query.mode === 'board' ? 'board' : 'missions'
    const a = await svc.getActivity(req.params.chapterId, mode)
    if (!a) return ApiResponse.error(res, 'Chapter not found', 404)
    return ApiResponse.success(res, a)
  } catch (e) { return next(e) }
}

// A finished SOLO run. Board games are a whole-class event on one device and are not
// anybody's personal score, so they are not recorded here.
async function result(req, res, next) {
  try {
    if (!/^\d+$/.test(String(req.params.chapterId))) return ApiResponse.error(res, 'Invalid chapter', 400)
    const { score, total } = req.body || {}
    if (!Number.isFinite(Number(score)) || !Number.isFinite(Number(total)) || Number(total) <= 0) {
      return ApiResponse.error(res, 'score and total are required', 422)
    }
    const saved = await svc.saveResult(req.user.id, req.params.chapterId, { score, total })
    return ApiResponse.success(res, saved, 'Saved')
  } catch (e) { return next(e) }
}

module.exports = { subjects, chapters, activity, result }
