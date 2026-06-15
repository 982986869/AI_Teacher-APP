'use strict'

const EmbeddingProvider = require('./EmbeddingProvider')
const { config } = require('../../config/env')
const { AppError } = require('../../middleware/errorHandler')

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'
const BATCH_SIZE = 96 // Voyage allows up to 128 inputs/request; stay comfortably under.

class VoyageProvider extends EmbeddingProvider {
  constructor() {
    super()
    this.apiKey = config.embeddings.voyageApiKey
    this.model = config.embeddings.model
    this._dimension = config.embeddings.dimension
  }

  get dimension() {
    return this._dimension
  }

  async _embed(texts, inputType) {
    if (!this.apiKey) {
      throw new AppError(
        'VOYAGE_API_KEY is not configured. Add it to server/.env to enable the knowledge (RAG) layer.',
        503
      )
    }
    if (!Array.isArray(texts) || texts.length === 0) return []

    const out = []
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE)

      let res
      try {
        res = await fetch(VOYAGE_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model: this.model, input: batch, input_type: inputType }),
        })
      } catch (err) {
        throw new AppError('Could not reach the embedding provider. Please try again.', 502)
      }

      if (!res.ok) {
        // Read the body for context but never include the API key.
        const detail = await res.text().catch(() => '')
        if (res.status === 401 || res.status === 403) {
          throw new AppError('Embedding provider authentication failed. Check VOYAGE_API_KEY.', 502)
        }
        if (res.status === 429) {
          throw new AppError('Embedding provider rate limit reached. Please try again shortly.', 503)
        }
        throw new AppError(`Embedding provider error (${res.status}). ${detail.slice(0, 200)}`.trim(), 502)
      }

      const json = await res.json()
      const data = Array.isArray(json?.data) ? [...json.data].sort((a, b) => a.index - b.index) : []
      if (data.length !== batch.length) {
        throw new AppError('Embedding provider returned an unexpected number of vectors.', 502)
      }

      for (const item of data) {
        const vec = item?.embedding
        if (!Array.isArray(vec) || vec.length !== this._dimension) {
          throw new AppError(
            `Embedding dimension mismatch: expected ${this._dimension}, got ${vec?.length}. ` +
            'Set EMBEDDING_DIM to match the model and the vector() column.',
            500
          )
        }
        out.push(vec)
      }
    }
    return out
  }

  async embedDocuments(texts) {
    return this._embed(texts, 'document')
  }

  async embedQuery(text) {
    const [vec] = await this._embed([text], 'query')
    return vec
  }
}

module.exports = VoyageProvider
