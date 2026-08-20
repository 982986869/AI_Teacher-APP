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
  // CORS cannot be wildcarded alongside credentials: true. Unset in production now means
  // "deny cross-origin" rather than the old "*", which is a real tightening — but NOT a
  // boot failure, because the native app and the admin portal's server-side rewrite send
  // no Origin header and are unaffected by CORS either way. Warn loudly so a genuinely
  // browser-based caller isn't left guessing why it is being blocked.
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
    console.warn(
      '[config] ALLOWED_ORIGINS is unset in production — cross-origin browser requests\n' +
      '         will be denied. The native app and the admin portal (server-side rewrite)\n' +
      '         send no Origin header, so they are unaffected. Set ALLOWED_ORIGINS to a\n' +
      '         comma-separated list (e.g. https://admin.ailernova.com) if a browser needs\n' +
      '         to call this API directly. It can no longer be "*": that is invalid\n' +
      '         alongside credentials: true and browsers reject it.'
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
    // Small deterministic sub-tasks — intent classification, quiz drafting, answer
    // grading. Short in, short out, and answerDoubt runs while the student waits,
    // so this wants the cheapest fast model. Falls back to AI_DOUBT_MODEL.
    cheapModel: process.env.AI_CHEAP_MODEL,
    // RAG answering + document extraction. Wants the opposite of cheapModel: a large
    // context window (a whole uploaded PDF has to fit) and good grounding. Falls back
    // to AI_LESSON_MODEL. Keep this separate from AI_CHEAP_MODEL — one value cannot
    // serve both without degrading one of them.
    knowledgeModel: process.env.AI_KNOWLEDGE_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,

    // Lesson planning is the hardest reasoning task, so it runs with adaptive
    // thinking by default for deeper derivations/pedagogy (Opus 4.6+ / Sonnet 4.6+).
    // Set AI_LESSON_THINKING=off if the configured model does not support it — the
    // provider also auto-falls back on a 400, so a mismatch never loses a lesson.
    // 'adaptive' | 'off'.
    lessonThinking: (process.env.AI_LESSON_THINKING || 'adaptive').toLowerCase(),
    // Reasoning depth/effort for lesson planning. low | medium | high | xhigh | max.
    lessonEffort: (process.env.AI_LESSON_EFFORT || 'high').toLowerCase(),
  },

  // Text-to-speech for the live teacher voice. One consistent, natural female
  // voice for every device/user. PRIMARY = ElevenLabs, and DELIBERATELY with no
  // fallback: the teacher has one voice, and a lesson that silently switches to a
  // different one mid-way is worse than a lesson that reports it cannot speak.
  //
  // ⚠ That choice means the key is load-bearing. No ELEVENLABS_API_KEY, or a spent
  // quota, and narration stops — the app drops to on-device TTS, which sounds like
  // a different teacher. Kokoro (free, self-hosted) and OpenAI are still reachable
  // by setting TTS_PROVIDER, they are just no longer automatic safety nets.
  tts: {
    provider: process.env.TTS_PROVIDER || 'elevenlabs', // 'elevenlabs' | 'kokoro' (self-hosted, free) | 'openai'

    // Kokoro (self-hosted) — free, no API key. Only used when TTS_PROVIDER=kokoro.
    kokoroUrl: process.env.KOKORO_URL || 'http://localhost:8880',
    kokoroVoice: process.env.KOKORO_VOICE || 'af_sarah',

    // OpenAI — only used when TTS_PROVIDER=openai, and disabled without a key.
    // `instructions` only applies to the steerable gpt-4o-mini-tts model.
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.TTS_MODEL || 'gpt-4o-mini-tts',
    voice: process.env.TTS_VOICE || 'coral',
    format: process.env.TTS_FORMAT || 'mp3',
    instructions: process.env.TTS_INSTRUCTIONS
      || 'You are a warm, calm and confident female school teacher speaking to one student. Speak clearly at a relaxed classroom pace, with natural pauses at full stops. Sound encouraging and patient — never rushed, dramatic or robotic.',
    maxChars: parseInt(process.env.TTS_MAX_CHARS, 10) || 1200,
    // Reported to the admin console. On ElevenLabs there is no fallback, so this
    // is only true with a key — the console must not claim a voice that cannot speak.
    enabled: (process.env.TTS_PROVIDER || 'elevenlabs') === 'elevenlabs'
      ? !!process.env.ELEVENLABS_API_KEY
      : true,

    // ── ElevenLabs — the teacher's voice ──────────────────────────────────────
    // PAID: a free ElevenLabs plan cannot use the TTS API at all (it answers 402
    // paid_plan_required), so the key must belong to a paying account.
    //
    // ⚠ The voice id below is a VOICE LIBRARY voice. A library voice has to be
    // added to the account ("Add to my voices") before the API will accept its id;
    // until then every request comes back as a 404 for that voice.
    elevenApiKey: process.env.ELEVENLABS_API_KEY,
    elevenVoiceId: process.env.ELEVENLABS_VOICE_ID || 'Ghr5KCyOzBvJpcdBbJhE',
    elevenModel: process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5', // cheap + low-latency
  },

  // HeyGen real-time streaming avatar (WebRTC/LiveKit) for the live teacher video.
  // Real per-minute cost (~$0.20/min), so this is OFF by default and gated per-request
  // to req.scope.tester (TESTER_EMAILS) on top of `enabled` — see routes/avatar.js.
  // Still being iterated on (see docs/plan) — not wired into the client yet.
  avatar: {
    heygenApiKey: process.env.HEYGEN_API_KEY,
    heygenAvatarId: process.env.HEYGEN_AVATAR_ID,
    sessionDurationSec: parseInt(process.env.HEYGEN_SESSION_DURATION_SEC, 10) || 600,
    idleTimeoutSec: parseInt(process.env.HEYGEN_IDLE_TIMEOUT_SEC, 10) || 300,
    quality: process.env.HEYGEN_QUALITY || 'medium',
    enabled: process.env.HEYGEN_ENABLED === 'true',
    maxConcurrentSessions: parseInt(process.env.HEYGEN_MAX_CONCURRENT, 10) || 4,
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
    // 0.2 was far too permissive — near-irrelevant chunks (~0.2 cosine) passed the
    // gate and became "context", so the model answered from noise (hallucination).
    // Real matches sit ~0.6-0.73, so 0.35 admits genuine hits and rejects noise.
    minSimilarity: process.env.RAG_MIN_SIMILARITY ? parseFloat(process.env.RAG_MIN_SIMILARITY) : 0.35,
    chunkSize: parseInt(process.env.RAG_CHUNK_SIZE, 10) || 1500,
    chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP, 10) || 200,
    maxUploadBytes: parseInt(process.env.KNOWLEDGE_MAX_UPLOAD_BYTES, 10) || 5000000,
  },

  // CORS. A wildcard origin is INVALID together with credentials: true — browsers
  // reject `Access-Control-Allow-Origin: *` on any credentialed request, which silently
  // broke the admin portal, and leaving it wildcard in production is also wide open.
  // So: explicit list when ALLOWED_ORIGINS is set; in dev, reflect any origin (valid
  // with credentials, since the header echoes the caller); in production, no origin is
  // allowed unless configured — validateEnv() below refuses to start without it.
  cors: {
    origins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
      : (process.env.NODE_ENV !== 'production' ? true : []),
  },

  // Feature flags. Default OFF — with every flag OFF the app behaves exactly as
  // it does today. Flip only after the matching rollout step (e.g. persistChecks
  // needs the nullable Slide.check/reteach columns applied via `prisma db push`).
  flags: {
    persistChecks: process.env.PERSIST_CHECKS === 'true',
    // Gates the in-lesson check → durable mastery loop (server resolves the concept and
    // folds the outcome into student_concepts). OFF = the /check endpoint accepts but
    // never writes mastery (recorded:false) — exactly today's behaviour.
    diagnosticGate: process.env.DIAGNOSTIC_GATE === 'true',
  },
}

module.exports = { validateEnv, config }
