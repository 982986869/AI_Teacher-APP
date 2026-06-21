'use strict'

// AI vars (ANTHROPIC_API_KEY, AI_LESSON_MODEL, AI_DOUBT_MODEL) are validated
// lazily at call time so the server starts without AI credentials configured.
const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
]

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Copy server/.env.example → server/.env and fill in the values.'
    )
  }
}

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Google OAuth. Any of these client IDs is accepted as a valid ID-token
  // audience (web for Android idTokens, plus native iOS/Android client IDs).
  google: {
    clientIds: [
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter(Boolean),
  },

  // SMS / phone-OTP (MSG91). When authKey + templateId are present, real OTP
  // SMS are sent and verified via MSG91; otherwise the dev/local OTP path is
  // used (the code is returned to the client as devOtp in development).
  sms: {
    provider: 'msg91',
    authKey: process.env.MSG91_AUTH_KEY,
    templateId: process.env.MSG91_TEMPLATE_ID,
    senderId: process.env.MSG91_SENDER_ID,
    otpExpiryMinutes: parseInt(process.env.MSG91_OTP_EXPIRY_MIN, 10) || 5,
    enabled: !!(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID),
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'anthropic',
    mockMode: process.env.MOCK_AI === 'true',
    lessonModel: process.env.AI_LESSON_MODEL,
    doubtModel: process.env.AI_DOUBT_MODEL,
    knowledgeModel: process.env.AI_KNOWLEDGE_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },

  // OpenAI text-to-speech for the live teacher voice. One consistent, natural
  // female voice for every device/user. Disabled (→ device TTS fallback) when no
  // key is set. `instructions` only applies to the steerable gpt-4o-mini-tts model.
  tts: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.TTS_MODEL || 'gpt-4o-mini-tts',
    voice: process.env.TTS_VOICE || 'coral',
    format: process.env.TTS_FORMAT || 'mp3',
    instructions: process.env.TTS_INSTRUCTIONS
      || 'You are a warm, calm and confident female school teacher speaking to one student. Speak clearly at a relaxed classroom pace, with natural pauses at full stops. Sound encouraging and patient — never rushed, dramatic or robotic.',
    maxChars: parseInt(process.env.TTS_MAX_CHARS, 10) || 1200,
    enabled: !!process.env.OPENAI_API_KEY,
  },

  // Knowledge (RAG) layer. Validated lazily at call time so the server starts
  // without embedding credentials configured.
  embeddings: {
    provider: process.env.EMBEDDING_PROVIDER || 'voyage',
    model: process.env.EMBEDDING_MODEL || 'voyage-3.5-lite',
    dimension: parseInt(process.env.EMBEDDING_DIM, 10) || 1024,
    voyageApiKey: process.env.VOYAGE_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  },

  rag: {
    topK: parseInt(process.env.RAG_TOP_K, 10) || 5,
    minSimilarity: process.env.RAG_MIN_SIMILARITY ? parseFloat(process.env.RAG_MIN_SIMILARITY) : 0.2,
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE, 10) || 1500,
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP, 10) || 200,
    maxUploadBytes: parseInt(process.env.KNOWLEDGE_MAX_UPLOAD_BYTES, 10) || 5000000,
  },

  cors: {
    origins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
      : '*',
  },
}

module.exports = { validateEnv, config }
