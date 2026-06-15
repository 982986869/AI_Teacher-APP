'use strict'

// Strict, grounded RAG prompt: Claude may answer ONLY from the retrieved chunks.
function buildKnowledgeSystemPrompt(contexts) {
  const blocks = (contexts || [])
    .map((c, i) => `[${i + 1}] Source: "${c.sourceTitle}" (chunk ${c.chunkIndex + 1})\n${c.content}`)
    .join('\n\n---\n\n')

  return `You are the AI Teacher answering a student's question STRICTLY from the school's own learning material provided below.

CONTEXT (the ONLY information you may use):
${blocks}

RULES:
- Answer ONLY using the CONTEXT above. Do NOT use outside or general knowledge.
- If the answer is not contained in the context, clearly say it is not covered in the learning material and suggest the student rephrase or ask their teacher. Do not guess or fabricate.
- Be clear, accurate, and encouraging, at a school student's level.
- When useful, mention which source you used (e.g. According to "<source title>", ...).
- Keep the answer concise — under about 180 words.
- Plain conversational text only — no markdown, code fences, or LaTeX.
- English only.`
}

function buildKnowledgeMessages(history, question) {
  const messages = (history || []).map((m) => ({
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
  }))
  messages.push({ role: 'user', content: question })
  return messages
}

module.exports = { buildKnowledgeSystemPrompt, buildKnowledgeMessages }
