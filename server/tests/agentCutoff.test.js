// With the drawing board on, the shown/saved answer is the board parser's text, not
// the provider's return value — a max_tokens cut must be trimmed there too.
const test = require('node:test')
const assert = require('node:assert/strict')

const agent = require('../src/services/agent.service')
const providers = require('../src/providers')
const lessonService = require('../src/services/lesson.service')
const retriever = require('../src/services/retriever.service')

test('askStream (board) ends a max_tokens reply at the last full sentence', async (t) => {
  const orig = { gp: providers.getAIProvider, byId: lessonService.getLessonById, ws: lessonService.getLessonWithSlides, r: retriever.retrieve }
  t.after(() => { providers.getAIProvider = orig.gp; lessonService.getLessonById = orig.byId; lessonService.getLessonWithSlides = orig.ws; retriever.retrieve = orig.r })
  lessonService.getLessonById = async () => null
  lessonService.getLessonWithSlides = async () => null
  retriever.retrieve = async () => ({ chunks: [], grounded: false, topSimilarity: 0 })
  const cut = 'Oxygen comes from water. Then the plant splits wa'
  providers.getAIProvider = () => ({
    classifyIntent: async () => ({ intent: 'doubt', language: 'en', confidence: 0.9 }),
    streamTeacherResponse: async (args, onText, meta) => { onText(cut); if (meta) meta.stopReason = 'max_tokens'; return 'Oxygen comes from water.' },
  })

  const spoken = []
  const res = await agent.askStream({ userId: null, text: 'where does the oxygen come from in this process', subject: 'Science', board: true }, { onDelta: (d) => spoken.push(d) })
  assert.equal(res.answer, 'Oxygen comes from water.')
})
