'use strict'

const db = require('../config/database')
const ApiResponse = require('../utils/ApiResponse')

// GET /api/resources/exemplar?subject=Physics&class=Class%2011&chapter=Gravitation
// Returns the chapter's exemplar sections in the SAME shape the frontend used
// from the static data (getExemplarSections): [{ label, questions: [...] }].
async function getExemplar(req, res, next) {
  try {
    const subject = String(req.query.subject || '').trim()
    const className = String(req.query.class || req.query.className || 'Class 11').trim()
    const chapter = String(req.query.chapter || '').trim()

    if (!subject || !chapter) {
      return ApiResponse.error(res, 'subject and chapter are required', 400)
    }

    const rows = await db.exemplar_solutions.findMany({
      where: { subject, className, chapter },
      orderBy: { position: 'asc' },
    })

    // Rebuild [{ label, questions }] in source order (position is monotonic across
    // sections, so first-seen section order == original order).
    const sections = []
    const indexByLabel = Object.create(null)
    for (const r of rows) {
      if (indexByLabel[r.section] === undefined) {
        indexByLabel[r.section] = sections.length
        sections.push({ label: r.section, questions: [] })
      }
      sections[indexByLabel[r.section]].questions.push({
        q: r.qNumber,
        text: r.text,
        options: Array.isArray(r.options) ? r.options : [],
        solutionLabel: r.solutionLabel,
        solution: r.solution,
        questionImages: Array.isArray(r.questionImages) ? r.questionImages : [],
        solutionImages: Array.isArray(r.solutionImages) ? r.solutionImages : [],
      })
    }

    return ApiResponse.success(res, { subject, className, chapter, sections })
  } catch (err) {
    next(err)
  }
}

module.exports = { getExemplar }
