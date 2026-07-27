'use strict'

const db = require('../config/database')

// ─── Lesson lifecycle ─────────────────────────────────────────────────────────

async function createLesson({ userId, topic, subject, gradeLevel }) {
  return db.lesson.create({
    data: {
      userId,
      topic,
      subject,
      gradeLevel,
      lessonTitle: '',
      estimatedDuration: '',
      summary: '',
      keyTerms: [],
      status: 'GENERATING',
    },
    select: { id: true },
  })
}

async function updateLessonWithContent(
  lessonId,
  { lessonTitle, estimatedDuration, summary, keyTerms, slides, generationModel, generationTimeMs }
) {
  return db.$transaction(async (tx) => {
    await tx.lesson.update({
      where: { id: lessonId },
      data: {
        lessonTitle,
        estimatedDuration,
        summary,
        keyTerms,
        status: 'READY',
        generationModel: generationModel ?? null,
        generationTimeMs: generationTimeMs ?? null,
      },
    })

    await tx.slide.createMany({
      data: slides.map((s) => ({
        lessonId,
        slideNumber: s.slideNumber,
        slideTitle: s.slideTitle,
        explanation: s.explanation,
        narrationText: s.narrationText,
        visualType: s.visualType,
        visualData: s.visualData,
        // Animation metadata (optional — defaults applied upstream by normalizeAnimation)
        animationType: s.animationType ?? null,
        animationSteps: s.animationSteps ?? [],
        subtitleChunks: s.subtitleChunks ?? [],
        visualSequence: s.visualSequence ?? [],
        highlightTargets: s.highlightTargets ?? [],
        voiceCue: s.voiceCue ?? null,
        // ── RESUME-PERSISTENCE (opt-in): uncomment the next two lines AFTER running
        //    `cd server && npx prisma db push` so the check/reteach columns exist.
        //    Until then, fresh generation already delivers them via the ai.service
        //    overlay; only a RESUMED lesson lacks them (client falls back gracefully).
        // check: s.check ?? null,
        // reteach: s.reteach ?? null,
      })),
    })
  })
}

async function markLessonFailed(lessonId) {
  await db.lesson.update({
    where: { id: lessonId },
    data: { status: 'FAILED' },
  })
}

// Deletes a lesson the user owns. Slides, doubt sessions, and messages cascade
// via onDelete: Cascade. Returns true if a row was deleted, false otherwise.
async function deleteLesson(lessonId, userId) {
  const { count } = await db.lesson.deleteMany({
    where: { id: lessonId, userId },
  })
  return count > 0
}

// ─── Lesson queries ───────────────────────────────────────────────────────────

const SLIDE_SELECT = {
  id: true,
  slideNumber: true,
  slideTitle: true,
  explanation: true,
  narrationText: true,
  visualType: true,
  visualData: true,
  animationType: true,
  animationSteps: true,
  subtitleChunks: true,
  visualSequence: true,
  highlightTargets: true,
  voiceCue: true,
  // RESUME-PERSISTENCE (opt-in): uncomment AFTER `prisma db push` adds the columns.
  // check: true,
  // reteach: true,
}

async function getLessonWithSlides(lessonId, userId) {
  return db.lesson.findFirst({
    where: { id: lessonId, userId },
    select: {
      id: true,
      topic: true,
      subject: true,
      gradeLevel: true,
      lessonTitle: true,
      estimatedDuration: true,
      summary: true,
      keyTerms: true,
      status: true,
      generationModel: true,
      generationTimeMs: true,
      createdAt: true,
      updatedAt: true,
      slides: {
        select: SLIDE_SELECT,
        orderBy: { slideNumber: 'asc' },
      },
    },
  })
}

// Admin (owner-agnostic) read of any lesson + its ordered slides. READ-ONLY — used by the
// Admin AI Teacher "watch exactly as the student" preview. Same shape as getLessonWithSlides
// so the real student player can replay it unchanged; no userId filter (admin sees any lesson).
async function getLessonWithSlidesAdmin(lessonId) {
  return db.lesson.findFirst({
    where: { id: lessonId },
    select: {
      id: true,
      topic: true,
      subject: true,
      gradeLevel: true,
      lessonTitle: true,
      estimatedDuration: true,
      summary: true,
      keyTerms: true,
      status: true,
      generationModel: true,
      generationTimeMs: true,
      createdAt: true,
      updatedAt: true,
      slides: {
        select: SLIDE_SELECT,
        orderBy: { slideNumber: 'asc' },
      },
    },
  })
}

// Lightweight fetch for doubt/ownership checks — does not load slides.
async function getLessonById(lessonId, userId) {
  return db.lesson.findFirst({
    where: { id: lessonId, userId },
    select: {
      id: true,
      topic: true,
      subject: true,
      gradeLevel: true,
      lessonTitle: true,
      status: true,
    },
  })
}

async function getUserLessons(userId, { page, limit }) {
  const skip = (page - 1) * limit

  const [lessons, total] = await Promise.all([
    db.lesson.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        topic: true,
        subject: true,
        gradeLevel: true,
        lessonTitle: true,
        estimatedDuration: true,
        status: true,
        createdAt: true,
      },
    }),
    db.lesson.count({ where: { userId } }),
  ])

  return {
    lessons,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// ─── Doubt session ────────────────────────────────────────────────────────────

async function getOrCreateDoubtSession(lessonId, userId) {
  let session = await db.doubtSession.findFirst({ where: { lessonId, userId } })
  if (!session) {
    session = await db.doubtSession.create({ data: { lessonId, userId } })
  }
  return session
}

async function addMessage(doubtSessionId, { role, content, slideIndex }) {
  return db.message.create({
    data: {
      doubtSessionId,
      role,
      content,
      slideIndex: slideIndex ?? null,
    },
    select: {
      id: true,
      role: true,
      content: true,
      slideIndex: true,
      createdAt: true,
    },
  })
}

// Prior conversation for a session, oldest first — fed to the AI as context.
async function getSessionMessages(doubtSessionId) {
  return db.message.findMany({
    where: { doubtSessionId },
    orderBy: { createdAt: 'asc' },
    select: { role: true, content: true },
  })
}

async function getDoubtHistory(lessonId, userId) {
  const session = await db.doubtSession.findFirst({
    where: { lessonId, userId },
    select: {
      id: true,
      createdAt: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          slideIndex: true,
          createdAt: true,
        },
      },
    },
  })

  if (!session) return { sessionId: null, messages: [] }
  return { sessionId: session.id, messages: session.messages }
}

module.exports = {
  createLesson,
  updateLessonWithContent,
  markLessonFailed,
  deleteLesson,
  getLessonWithSlides,
  getLessonWithSlidesAdmin,
  getLessonById,
  getUserLessons,
  getOrCreateDoubtSession,
  addMessage,
  getSessionMessages,
  getDoubtHistory,
}
