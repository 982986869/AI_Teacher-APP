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

  ai: {
    provider: process.env.AI_PROVIDER || 'anthropic',
    mockMode: process.env.MOCK_AI === 'true',
    lessonModel: process.env.AI_LESSON_MODEL,
    doubtModel: process.env.AI_DOUBT_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },

  cors: {
    origins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
      : '*',
  },
}

module.exports = { validateEnv, config }
