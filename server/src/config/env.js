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
    knowledgeModel: process.env.AI_KNOWLEDGE_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },

  // Knowledge (RAG) layer. Validated lazily at call time so the server starts
  // without embedding credentials configured.
  embeddings: {
    provider: process.env.EMBEDDING_PROVIDER || 'voyage',
    model: process.env.EMBEDDING_MODEL || 'voyage-3.5',
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
