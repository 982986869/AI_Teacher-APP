// What is SPOKEN on the streaming path: the text after the last sentence boundary is
// held back until the stream ends, and dropped if the reply was cut by max_tokens —
// so a cut reply is never spoken mid-word ("…splits wa").
const test = require('node:test')
const assert = require('node:assert/strict')

const agent = require('../src/services/agent.service')
const providers = require('../src/providers')
const lessonService = require('../src/services/lesson.service')
const retriever = require('../src/services/retriever.service')

function stub(t, { pieces, stopReason }) {
  const orig = { gp: providers.getAIProvider, byId: lessonService.getLessonById, ws: lessonService.getLessonWithSlides, r: retriever.retrieve }
  t.after(() => { providers.getAIProvider = orig.gp; lessonService.getLessonById = orig.byId; lessonService.getLessonWithSlides = orig.ws; retriever.retrieve = orig.r })
  lessonService.getLessonById = async () => null
  lessonService.getLessonWithSlides = async () => null
  retriever.retrieve = async () => ({ chunks: [], grounded: false, topSimilarity: 0 })
  providers.getAIProvider = () => ({
    classifyIntent: async () => ({ intent: 'doubt', language: 'en', confidence: 0.9 }),
    streamTeacherResponse: async (args, onText, meta) => {
      for (const p of pieces) onText(p)
      if (meta) meta.stopReason = stopReason
      return pieces.join('')
    },
  })
}
const q = { userId: null, text: 'where does the oxygen come from in this process', subject: 'Science' }

for (const board of [false, true]) {
  test(`cut reply is not spoken mid-word (board=${board})`, async (t) => {
    stub(t, { pieces: ['Oxygen comes ', 'from water. Then the plant spl', 'its wa'], stopReason: 'max_tokens' })
    const spoken = []
    await agent.askStream({ ...q, board }, { onDelta: (d) => spoken.push(d) })
    const said = spoken.join('')
    assert.match(said, /Oxygen comes from water\./)
    assert.doesNotMatch(said, /spl|its wa/)
  })

  test(`a complete reply is spoken in full (board=${board})`, async (t) => {
    stub(t, { pieces: ['Oxygen comes ', 'from water. It is relea', 'sed by leaves'], stopReason: 'end_turn' })
    const spoken = []
    await agent.askStream({ ...q, board }, { onDelta: (d) => spoken.push(d) })
    assert.match(spoken.join(''), /Oxygen comes from water\.\s*It is released by leaves/)
  })
}
