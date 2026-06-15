'use strict'

const { config } = require('../config/env')
const lessonService = require('./lesson.service')
const { getAIProvider } = require('../providers')
const { AppError } = require('../middleware/errorHandler')
const { normalizeAnimation } = require('../utils/slideAnimation')

const MOCK_MODEL = 'mock-v1'

// Build animation hints (steps/sequence/highlights) for a mock slide from its
// visualType/visualData. animationType, voiceCue and subtitleChunks come from
// the slide itself and normalizeAnimation().
function buildMockAnimation(slide) {
  const v = slide.visualData || {}
  const steps = [
    { order: 1, action: 'fadeIn', target: 'title', durationMs: 400, description: `Reveal the title "${slide.slideTitle}"` },
  ]
  const visualSequence = []
  const highlightTargets = []
  let appearAtMs = 600

  if (slide.visualType === 'DIAGRAM') {
    const comps = Array.isArray(v.components) ? v.components : []
    comps.forEach((c, i) => {
      steps.push({ order: steps.length + 1, action: 'reveal', target: `component:${i}`, durationMs: 450, description: `Reveal "${c}"` })
      visualSequence.push({ order: i + 1, element: `component:${i}`, appearAtMs })
      appearAtMs += 600
    })
  } else if (slide.visualType === 'EXAMPLE') {
    const stepList = Array.isArray(v.steps) ? v.steps : []
    stepList.forEach((_, i) => {
      steps.push({ order: steps.length + 1, action: 'revealStep', target: `step:${i}`, durationMs: 450, description: `Reveal step ${i + 1}` })
      visualSequence.push({ order: i + 1, element: `step:${i}`, appearAtMs })
      appearAtMs += 550
    })
  } else if (slide.visualType === 'FORMULA') {
    steps.push({ order: steps.length + 1, action: 'buildUp', target: 'formula', durationMs: 700, description: 'Build the formula term by term' })
    visualSequence.push({ order: 1, element: 'formula', appearAtMs })
    const vars = Array.isArray(v.variables) ? v.variables : []
    vars.forEach((vr) => highlightTargets.push({ ref: `variable:${vr.symbol}`, label: `${vr.symbol} = ${vr.meaning}`, emphasis: 'pulse' }))
  } else if (slide.visualType === 'ANALOGY') {
    steps.push({ order: steps.length + 1, action: 'zoomIn', target: 'analogy', durationMs: 600, description: 'Bring the analogy into focus' })
    highlightTargets.push({ ref: 'realWorldObject', label: v.realWorldObject || '', emphasis: 'glow' })
  } else if (slide.visualType === 'CHART') {
    steps.push({ order: steps.length + 1, action: 'growBars', target: 'chart', durationMs: 700, description: 'Animate the bars growing in' })
    visualSequence.push({ order: 1, element: 'chart', appearAtMs })
  }

  return { animationSteps: steps, visualSequence, highlightTargets }
}

// ─── Mock lesson (human-teacher style — follows the teaching arc) ──────────────
// Topic-agnostic placeholder used when MOCK_AI=true. Real Claude output is far
// richer and topic-specific; this demonstrates the arc, the warm teacher tone,
// the animationType vocabulary, and the keyPoints-inside-visualData contract.
function buildMockLesson(topic, subject, gradeLevel) {
  const cap = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str)
  const t = cap(topic)
  const s = cap(subject)

  const slides = [
    // 1. HOOK
    {
      slideNumber: 1,
      slideTitle: `A Puzzle to Start: Where Is ${t} Hiding?`,
      explanation: `${t} shows up in everyday life more than you'd think.`,
      narrationText: `Let me start with a little puzzle. Look around you — ${t} is quietly at work in things you see every day, but most people never notice it. By the end of this lesson, you'll spot it everywhere. Curious? Let's dig in.`,
      visualType: 'ANALOGY',
      animationType: 'SHOW_REAL_WORLD_EXAMPLE',
      voiceCue: 'warm and curious',
      visualData: {
        realWorldObject: `Everyday examples of ${t}`,
        comparison: `${t} is like a hidden thread running through ${s} — once you see it, you can't unsee it.`,
        keyPoints: [`${t} is all around us`, `We'll uncover where it hides`],
      },
    },
    // 2. INTUITION
    {
      slideNumber: 2,
      slideTitle: `Let's Build the Picture First`,
      explanation: `Before any rule, get a feel for what ${t} really is.`,
      narrationText: `Before we write anything down, let's just build a picture in your head. Forget formulas for a moment. Imagine ${t} as something you can see and touch. Getting this feeling first makes everything later click into place.`,
      visualType: 'ANALOGY',
      animationType: 'ZOOM_IN_CONCEPT',
      voiceCue: 'calm and reassuring',
      visualData: {
        realWorldObject: `A simple mental model of ${t}`,
        comparison: `Picture ${t} the way you'd picture a familiar everyday object — simple, visible, and easy to hold in your mind.`,
        keyPoints: [`Intuition comes before the formula`, `Picture it before you define it`],
      },
    },
    // 3. CORE IDEA
    {
      slideNumber: 3,
      slideTitle: `The One Big Idea Behind ${t}`,
      explanation: `At its heart, ${t} is really just one key idea.`,
      narrationText: `Here's the heart of it. Strip everything else away, and ${t} comes down to a single, clear idea. If you remember just one thing today, remember this one — everything else is built on top of it.`,
      visualType: 'DIAGRAM',
      animationType: 'DRAW_SHAPE',
      voiceCue: 'clear and confident',
      visualData: {
        description: `The core idea of ${t}, shown simply`,
        label: t,
        components: ['Start', `The key idea of ${t}`, 'Result'],
        keyPoints: [`One core idea sits at the center`, `Everything else builds on it`],
      },
    },
    // 4. BUILD CONCEPT
    {
      slideNumber: 4,
      slideTitle: `Building It Up, One Step at a Time`,
      explanation: `Add the pieces of ${t} gradually, in order.`,
      narrationText: `Now let's grow that idea, one piece at a time. Notice how each step leans on the one before it — that's how real understanding is built. Take it slow; there's no rush.`,
      visualType: 'EXAMPLE',
      animationType: 'REVEAL_STEPS',
      voiceCue: 'encouraging and steady',
      visualData: {
        scenario: `How the parts of ${t} fit together`,
        steps: [
          `Start from the core idea`,
          `Add the condition that makes ${t} work`,
          `See what it lets you predict or do`,
          `Notice where it stops working`,
        ],
        keyPoints: [`Each step builds on the last`, `Understanding beats memorizing`],
      },
    },
    // 5. FORMULA / FORMALIZE
    {
      slideNumber: 5,
      slideTitle: `Now We Can Write the Rule`,
      explanation: `With the intuition in place, here is ${t} as a short rule.`,
      narrationText: `Because you already feel how ${t} works, the formula won't scare you — it's just a short way of writing what you already understand. Read it as a sentence, not as scary symbols.`,
      visualType: 'FORMULA',
      animationType: 'BUILD_FORMULA',
      voiceCue: 'precise and friendly',
      visualData: {
        formula: 'input + condition -> result',
        variables: [
          { symbol: 'input', meaning: 'what you start with' },
          { symbol: 'condition', meaning: `what makes ${t} apply` },
          { symbol: 'result', meaning: 'what you get out' },
        ],
        explanation: `This rule is just the core idea of ${t} written in short form.`,
        keyPoints: [`The formula restates the intuition`, `Read it as a sentence`],
      },
    },
    // 6. WORKED EXAMPLE
    {
      slideNumber: 6,
      slideTitle: `Let's Solve One Together`,
      explanation: `Apply ${t} to a concrete example, step by step.`,
      narrationText: `Let's actually use it. I'll walk through an example slowly, the same way I'd do it on the board. Watch each step — then you'll be ready to try one on your own.`,
      visualType: 'EXAMPLE',
      animationType: 'STEP_BY_STEP_EQUATION',
      voiceCue: 'methodical and supportive',
      visualData: {
        scenario: `A worked example using ${t}`,
        steps: [
          `Write down what we know`,
          `Apply the rule of ${t}`,
          `Simplify carefully, one line at a time`,
          `State the final answer clearly`,
        ],
        keyPoints: [`Show every step`, `Neat steps prevent mistakes`],
      },
    },
    // 7. COMMON MISTAKE
    {
      slideNumber: 7,
      slideTitle: `The Mistake Most Students Make`,
      explanation: `A common trap with ${t} — and how to avoid it.`,
      narrationText: `Now, a friendly warning. There's one mistake almost every student makes with ${t}, and I don't want it to catch you. Here's the wrong way, here's why it's wrong, and here's the simple habit that keeps you safe.`,
      visualType: 'EXAMPLE',
      animationType: 'SHOW_COMMON_MISTAKE',
      voiceCue: 'careful and kind',
      visualData: {
        scenario: `A common mistake with ${t}`,
        steps: [
          `The tempting but wrong shortcut`,
          `Why it gives the wrong answer`,
          `The correct approach instead`,
          `A quick habit to avoid the trap`,
        ],
        keyPoints: [`Spot the trap early`, `Build a habit that prevents it`],
      },
    },
    // 8. RECAP
    {
      slideNumber: 8,
      slideTitle: `Quick Recap: What You Now Know`,
      explanation: `The key takeaways from today's lesson on ${t}.`,
      narrationText: `Let's lock it in. You pictured ${t}, found its one big idea, built it up, wrote the rule, solved an example, and dodged the common mistake. That's real understanding — not just memorizing. Brilliant work today.`,
      visualType: 'NONE',
      animationType: 'RECAP_CHECKLIST',
      voiceCue: 'warm and celebratory',
      visualData: {
        keyPoints: [
          `${t} starts with one core idea`,
          `Build intuition before the formula`,
          `Apply the rule step by step`,
          `Watch out for the common mistake`,
        ],
      },
    },
  ].map((sl) => {
    const hints = buildMockAnimation(sl)
    return { ...sl, ...normalizeAnimation({ ...sl, ...hints }) }
  })

  return {
    lessonTitle: `${t}: From First Glance to Real Understanding`,
    estimatedDuration: '12 minutes',
    summary: `A step-by-step, teacher-led journey through ${t} in ${s} for Class ${gradeLevel}. We open with a real-life hook, build intuition, reach the one big idea and its rule, work an example together, clear up the most common mistake, and finish with a quick recap.`,
    keyTerms: [topic.toLowerCase(), subject.toLowerCase(), 'intuition', 'core idea', 'common mistake'],
    slides,
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
