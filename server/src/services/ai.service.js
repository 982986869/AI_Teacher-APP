'use strict'

const { config } = require('../config/env')
const lessonService = require('./lesson.service')
const { getAIProvider } = require('../providers')
const { AppError } = require('../middleware/errorHandler')

const MOCK_MODEL = 'mock-v1'

// ─── Mock data builders ───────────────────────────────────────────────────────

function buildMockLesson(topic, subject, gradeLevel) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
  const t = cap(topic)
  const s = cap(subject)

  return {
    lessonTitle: `Introduction to ${t}`,
    estimatedDuration: '15 minutes',
    summary: `This lesson covers the core concepts of ${t} in ${s} for Grade ${gradeLevel} students. You will learn the definition, key principles, how it works, and where it appears in the real world.`,
    keyTerms: [topic.toLowerCase(), subject.toLowerCase(), 'concept', 'principle', 'application'],
    slides: [
      {
        slideNumber: 1,
        slideTitle: `What is ${t}?`,
        explanation: `${t} is a fundamental concept in ${s}. It describes a specific phenomenon or principle that forms the foundation for more advanced ideas in the subject.`,
        narrationText: `Welcome! Today we are going to explore ${t}. By the time we finish, you will have a clear picture of what it is and why it matters in ${s}.`,
        visualType: 'ANALOGY',
        visualData: {
          realWorldObject: 'A building foundation',
          comparison: `Just like a foundation supports a building, ${t} supports our understanding of ${s}. Without it, the other concepts would have nothing to stand on.`,
        },
      },
      {
        slideNumber: 2,
        slideTitle: 'Core Concepts',
        explanation: `The key ideas behind ${t} include its definition, the conditions under which it applies, what it predicts, and its limitations.`,
        narrationText: `Now let us break down the building blocks. Each concept connects to the others, so pay attention to how they fit together.`,
        visualType: 'EXAMPLE',
        visualData: {
          scenario: `Breaking down ${t} step by step`,
          steps: [
            `Define ${t} clearly`,
            `Identify the conditions where it applies`,
            `Observe what it predicts or explains`,
            `Understand its boundaries and limitations`,
          ],
        },
      },
      {
        slideNumber: 3,
        slideTitle: 'How It Works',
        explanation: `Understanding the mechanism behind ${t} helps us predict outcomes and explain observed phenomena in ${s}.`,
        narrationText: `Here comes the interesting part — the mechanism. Think of this as the engine inside the concept. Let us trace it from input to output.`,
        visualType: 'DIAGRAM',
        visualData: {
          description: `Input-process-output flow for ${t}`,
          label: t,
          components: ['Input / Cause', `${t} in action`, 'Output / Effect'],
        },
      },
      {
        slideNumber: 4,
        slideTitle: 'Real-World Applications',
        explanation: `${t} is used across many domains within ${s} and beyond, from everyday life to advanced technology.`,
        narrationText: `You might be wondering — when will I actually use this? Let me show you some real examples where ${t} plays a key role.`,
        visualType: 'EXAMPLE',
        visualData: {
          scenario: `Where ${t} appears in the real world`,
          steps: [
            `Everyday life: observable in daily activities`,
            `Technology: powers modern devices and systems`,
            `Science: used in research and experiments`,
            `Engineering: applied in design and construction`,
          ],
        },
      },
      {
        slideNumber: 5,
        slideTitle: 'Summary & Key Takeaways',
        explanation: `We covered: what ${t} is, its core principles, how the mechanism works, and where it appears in real life.`,
        narrationText: `Excellent work making it to the end! Let us recap the most important points from today's lesson on ${t}. Keep these in mind — they will help you in future topics.`,
        visualType: 'NONE',
        visualData: {},
      },
    ],
  }
}

function buildMockDoubtAnswer(question, topic) {
  return (
    `Great question about "${question}"! ` +
    `In the context of ${topic}, this connects directly to the core principles we covered. ` +
    `Think about the mechanism we discussed in Slide 3 — the same logic applies here. ` +
    `If you look at the real-world examples in Slide 4, you can see this pattern in action. ` +
    `Would you like me to explain any specific part in more detail?`
  )
}

// ─── Public service functions ─────────────────────────────────────────────────

async function generateLesson({ userId, topic, subject, gradeLevel }) {
  // Create a GENERATING placeholder — this ID is returned immediately in case of failure.
  const { id: lessonId } = await lessonService.createLesson({ userId, topic, subject, gradeLevel })

  try {
    const startTime = Date.now()

    let payload
    let generationModel
    if (config.ai.mockMode) {
      payload = buildMockLesson(topic, subject, gradeLevel)
      generationModel = MOCK_MODEL
    } else {
      payload = await getAIProvider().generateLesson(topic, subject, gradeLevel)
      generationModel = config.ai.lessonModel
    }

    const generationTimeMs = Date.now() - startTime

    await lessonService.updateLessonWithContent(lessonId, {
      ...payload,
      generationModel,
      generationTimeMs,
    })

    return lessonService.getLessonWithSlides(lessonId, userId)
  } catch (err) {
    await lessonService.markLessonFailed(lessonId)
    throw err
  }
}

async function answerDoubt({ userId, lessonId, question, slideIndex }) {
  const lesson = await lessonService.getLessonById(lessonId, userId)
  if (!lesson) throw new AppError('Lesson not found', 404)
  if (lesson.status !== 'READY') {
    throw new AppError('This lesson is not ready yet. Please wait for generation to complete.', 400)
  }

  const session = await lessonService.getOrCreateDoubtSession(lessonId, userId)

  let answer
  if (config.ai.mockMode) {
    await lessonService.addMessage(session.id, { role: 'USER', content: question, slideIndex })
    answer = buildMockDoubtAnswer(question, lesson.topic)
  } else {
    // Real Claude needs the full lesson (with slides) for context and the prior
    // conversation — capture history BEFORE persisting the new question.
    const lessonWithSlides = await lessonService.getLessonWithSlides(lessonId, userId)
    const history = await lessonService.getSessionMessages(session.id)

    await lessonService.addMessage(session.id, { role: 'USER', content: question, slideIndex })

    answer = await getAIProvider().answerDoubt(question, lessonWithSlides, history, slideIndex)
  }

  const assistantMessage = await lessonService.addMessage(session.id, {
    role: 'ASSISTANT',
    content: answer,
    slideIndex: null,
  })

  return { answer, sessionId: session.id, messageId: assistantMessage.id }
}

module.exports = { generateLesson, answerDoubt }
