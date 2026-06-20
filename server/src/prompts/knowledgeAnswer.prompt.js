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
- If the answer is not contained in the context, reply with EXACTLY this sentence and nothing else: "This topic is not covered in the uploaded learning material." Do not guess or fabricate.
- Be clear, accurate, and encouraging, at a school student's level.
- When useful, mention which source you used (e.g. According to "<source title>", ...).
- Keep the answer concise — under about 180 words.
- Plain conversational text only — no markdown, code fences, or LaTeX.
- English only.`
}

// Structured "animated teaching" variant: same strict grounding, but the model
// returns a JSON lesson breakdown the frontend can reveal step-by-step. Grounding
// rules are identical to the plain prompt — ONLY the CONTEXT may be used.
function buildStructuredKnowledgeSystemPrompt(contexts) {
  const blocks = (contexts || [])
    .map((c, i) => `[${i + 1}] Source: "${c.sourceTitle}" (chunk ${c.chunkIndex + 1})\n${c.content}`)
    .join('\n\n---\n\n')

  return `You are the AI Teacher turning a student's question into a short, animated mini-lesson STRICTLY from the school's own learning material below.

CONTEXT (the ONLY information you may use):
${blocks}

Return a SINGLE JSON object with EXACTLY these keys:
{
  "title": "a short lesson title (max ~8 words)",
  "intro": "1-2 sentence plain-language introduction to the answer",
  "steps": ["short teaching step", "..."],
  "formula": "the single key formula if one applies, else an empty string",
  "example": "a short worked example grounded in the context, else an empty string",
  "quickCheck": "one short question to check understanding, else an empty string"
}

RULES:
- Use ONLY the CONTEXT above. Do NOT use outside or general knowledge. Never invent facts, formulas, or numbers that are not in the context.
- "steps" should have 2 to 5 concise items. Use [] only if a step list truly does not fit.
- Output ONLY the JSON object — no markdown, no code fences, no commentary before or after.
- Keep every field concise, accurate, and at a school student's level. English only.
- If the context does not actually contain the answer, set intro to "This topic is not covered in the uploaded learning material." and leave steps/formula/example/quickCheck empty.`
}

function buildKnowledgeMessages(history, question) {
  const messages = (history || []).map((m) => ({
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
  }))
  messages.push({ role: 'user', content: question })
  return messages
}

module.exports = {
  buildKnowledgeSystemPrompt,
  buildStructuredKnowledgeSystemPrompt,
  buildKnowledgeMessages,
}
