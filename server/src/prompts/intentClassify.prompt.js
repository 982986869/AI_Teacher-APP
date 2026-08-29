'use strict'

const INTENTS = [
  'concept_explanation',
  'doubt',
  'formula',
  'example_request',
  'quiz_request',
  'revision',
  'greeting',
  'stop_lesson',
  'off_topic',
  'unclear',
]

// Cheap, deterministic pre-classifier for obvious cases — saves an LLM call.
// Returns { intent, language } or null when not confident.
function quickIntent(rawText) {
  const text = String(rawText || '').trim()
  if (!text || text.length < 2) return { intent: 'unclear', language: 'en' }

  const t = text.toLowerCase()
  const language = detectLanguage(text)

  if (/\b(quiz|test me|ask me|practice question|mcq|take a test|sawal pucho|test lo)\b/.test(t)) {
    return { intent: 'quiz_request', language }
  }
  if (/\b(revise|revision|recap|summary|summarise|summarize|quick recap|dohra|repeat the chapter)\b/.test(t)) {
    return { intent: 'revision', language }
  }
  if (/\b(formula|equation)\b|\bformula (do|bata|de do)\b/.test(t)) {
    return { intent: 'formula', language }
  }
  if (/\b(example|examples|ek example|koi example|for example|e\.?g\.?)\b/.test(t) && /\b(give|show|do|bata|de|chahiye|want)\b/.test(t)) {
    return { intent: 'example_request', language }
  }
  // Wanting to stop. Checked BEFORE greeting, because "ok bye", "no thanks" and
  // "bas" all read as acknowledgements on their own — and getting this wrong means
  // carrying on teaching someone who has asked you to stop, which is the worse
  // error of the two. Deliberately narrow: it must be an explicit wish to stop,
  // not mere reluctance ("this is hard", "I'm tired") which deserves encouragement.
  if (/\b(i (don'?t|do not|dont) want to (study|learn|read)|not in the mood|no more (study|lesson|class)|stop the (lesson|class)|end the (lesson|class)|stop teaching|i'?m done|im done|that'?s enough|thats enough|enough for (today|now)|leave it for (today|now)|no more questions|close the lesson|exit the lesson)\b/.test(t)
      || /\b(padhna nahi|nahi padhna|padhai band|band karo|bas karo|bas ho gaya|ab bas|mood nahi|aaj nahi|rehne do|chhod do|nahi chahiye padhai)\b/.test(t)
      || /(पढ़ाई बंद|नहीं पढ़ना|बस करो|बंद करो|अभी नहीं)/.test(text)) {
    return { intent: 'stop_lesson', language }
  }
  // Greetings & acknowledgements get a WARM, continuity-aware reply (not the
  // dismissive "stay on topic" line) — that first hello is where the teacher must
  // feel human. Genuine off-topic (games/food/chit-chat) still falls to off_topic.
  if (/^(hi+|hello+|hey+|yo|namaste|good morning|good evening|good afternoon|thanks|thank you|thank u|thik hai|theek hai|ok|okay|k|bye|good night|gn)\b[.! ]*$/.test(t)) {
    return { intent: 'greeting', language }
  }
  // Clear "explain X" style openers are concept_explanation — settle by rule so we
  // skip the classify LLM call on the most common request (big latency win).
  // (Checked AFTER formula/example/quiz/revision, so "what is the formula" → formula.)
  if (/^(explain|define|describe|teach me|tell me about|what is|what are|what's|whats|what does)\b/.test(t)) {
    return { intent: 'concept_explanation', language }
  }
  // Otherwise let the LLM decide between concept_explanation / doubt / unclear.
  return null
}

// Lightweight language heuristic. The LLM refines it, but this is a safe default.
function detectLanguage(rawText) {
  const text = String(rawText || '')
  if (/[ऀ-ॿ]/.test(text)) return 'hi' // Devanagari
  const hinglish = /\b(kaise|kyun|kyu|kya|kaisa|nahi|hai|hain|samajh|matlab|batao|bata|karo|karke|wala|wali|mujhe|ye|yeh|woh|kar|hota|hoti|diya|nikalega|chahiye|namaste|namaskar|dhanyavaad|shukriya|alvida)\b/i
  if (hinglish.test(text)) return 'hinglish'
  return 'en'
}

// LLM classifier prompt — used only when quickIntent is not confident.
function buildIntentSystemPrompt() {
  return `You label a student's message to an AI teacher with EXACTLY ONE intent and detect the language. Output JSON only.

INTENTS:
- concept_explanation: wants a topic/concept explained ("explain X", "what is X", "how does X work").
- doubt: a specific confusion about something being studied ("why is it like this", "I don't get this step", "ye kaise hua").
- formula: asks for a formula or equation.
- example_request: explicitly asks for an example.
- quiz_request: wants to be tested or asked questions.
- revision: wants a quick recap / summary of a topic.
- greeting: a greeting, thanks, or acknowledgement ("hi", "hello", "namaste", "thanks", "ok", "bye").
- stop_lesson: the student explicitly wants to STOP studying now ("I don't want to study", "that's enough for today", "stop the lesson", "padhna nahi hai", "bas karo"). Reluctance or fatigue alone ("this is hard", "I'm tired", "I don't get it") is NOT stop_lesson — those are doubt or concept_explanation.
- off_topic: not about studies (games, food, chit-chat) — but NOT greetings.
- unclear: too vague, empty, or garbled to classify.

LANGUAGE:
- "en"  = English.
- "hi"  = Hindi (Devanagari or fully romanised Hindi).
- "hinglish" = Hindi-English mix written in Roman script (e.g. "ye diagonal kaise niklega").

Return ONLY this JSON and nothing else:
{"intent":"<one of the intents>","language":"en|hi|hinglish","confidence":0.0}`
}

function buildIntentMessages(text) {
  return [{ role: 'user', content: String(text || '').slice(0, 1000) }]
}

module.exports = {
  INTENTS,
  quickIntent,
  detectLanguage,
  buildIntentSystemPrompt,
  buildIntentMessages,
}
