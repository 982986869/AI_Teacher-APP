// A bare follow-up ("why?") right after an answer is a real question about that
// answer — with chat history it must be taught, not met with "I didn't catch that".
const test = require('node:test')
const assert = require('node:assert/strict')

const agent = require('../src/services/agent.service')
const providers = require('../src/providers')
const lessonService = require('../src/services/lesson.service')
const retriever = require('../src/services/retriever.service')

function stubAll(t) {
  const orig = { gp: providers.getAIProvider, byId: lessonService.getLessonById, ws: lessonService.getLessonWithSlides, r: retriever.retrieve }
  t.after(() => { providers.getAIProvider = orig.gp; lessonService.getLessonById = orig.byId; lessonService.getLessonWithSlides = orig.ws; retriever.retrieve = orig.r })
  lessonService.getLessonById = async () => null
  lessonService.getLessonWithSlides = async () => null
  retriever.retrieve = async () => ({ chunks: [], grounded: false, topSimilarity: 0 })
  providers.getAIProvider = () => ({
    classifyIntent: async () => ({ intent: 'unclear', language: 'en', confidence: 0.4 }),
    generateTeacherResponse: async () => 'Because light gives the energy to make food.',
  })
}

const history = [
  { role: 'USER', content: 'Do plants need sunlight for photosynthesis?' },
  { role: 'ASSISTANT', content: 'Yes. Plants need sunlight because light gives the energy to make food.' },
]

test('"why?" with history is answered as a doubt', async (t) => {
  stubAll(t)
  const res = await agent.ask({ userId: null, text: 'why?', subject: 'Science', history })
  assert.equal(res.answer, 'Because light gives the energy to make food.')
  assert.equal(res.intent, 'doubt')
})

test('an unclear message with NO history still gets the "ask again" line', async (t) => {
  stubAll(t)
  const res = await agent.ask({ userId: null, text: 'why?', subject: 'Science', history: [] })
  assert.equal(res.intent, 'unclear')
})
