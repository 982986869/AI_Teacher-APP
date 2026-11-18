// When the model runs out of tokens mid-reply, the teacher's answer (what is shown
// and saved) ends at the last full sentence instead of mid-word.
const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')

const AnthropicProvider = require('../src/providers/ai/AnthropicProvider')

const cutMessage = { content: [{ type: 'text', text: 'Oxygen comes from water. Then the plant splits wa' }], stop_reason: 'max_tokens' }
const args = { intent: 'doubt', language: 'en', contexts: [], lesson: null, history: [], question: 'Where does oxygen come from?' }

test('generateTeacherResponse trims a max_tokens cut to the last full sentence', async () => {
  const p = new AnthropicProvider()
  let sent
  p._getClient = () => ({ messages: { create: async (req) => { sent = req; return cutMessage } } })
  const answer = await p.generateTeacherResponse(args)
  assert.equal(answer, 'Oxygen comes from water.')
  assert.equal(sent.max_tokens, 700)
})

test('streamTeacherResponse trims the returned text, uses the board budget', async () => {
  const p = new AnthropicProvider()
  let sent
  p._getClient = () => ({ messages: { stream: (req) => {
    sent = req
    const s = new EventEmitter()
    s.finalMessage = async () => cutMessage
    return s
  } } })
  const answer = await p.streamTeacherResponse({ ...args, board: true }, () => {})
  assert.equal(answer, 'Oxygen comes from water.')
  assert.equal(sent.max_tokens, 900)
})

test('a complete reply is left alone', async () => {
  const p = new AnthropicProvider()
  p._getClient = () => ({ messages: { create: async () => ({ content: [{ type: 'text', text: 'Done. All of it' }], stop_reason: 'end_turn' }) } })
  assert.equal(await p.generateTeacherResponse(args), 'Done. All of it')
})
