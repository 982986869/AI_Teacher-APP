'use strict'

const { config } = require('../../config/env')
const { AppError } = require('../../middleware/errorHandler')

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'
const BATCH = 96 // Voyage accepts batches; keep well under request limits.

// Voyage AI embeddings. voyage-3.5-lite defaults to 1024 dims, matching the
// knowledge_chunks vector(1024) column. input_type improves retrieval quality
// ("document" when indexing, "query" when searching).
class VoyageEmbeddingProvider {
  constructor() {
    this.apiKey = config.embeddings.voyageApiKey
    this.model = config.embeddings.model || 'voyage-3.5-lite'
    this.dimension = config.embeddings.dimension || 1024
  }

  _assertKey() {
    if (!this.apiKey) {
      throw new AppError('VOYAGE_API_KEY is not configured. Add it to server/.env to enable RAG.', 503)
    }
  }

  async _embed(inputs, inputType) {
    this._assertKey()
    let res
    try {
      res = await fetch(VOYAGE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          input: inputs,
          model: this.model,
          input_type: inputType,
          output_dimension: this.dimension,
        }),
      })
    } catch (err) {
      throw new AppError(`Voyage embeddings request failed: ${err.message}`, 502)
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new AppError(`Voyage embeddings error (${res.status}). ${detail.slice(0, 200)}`, 502)
    }
    const json = await res.json()
    const data = Array.isArray(json.data) ? json.data : []
    if (data.length !== inputs.length) {
      throw new AppError('Voyage returned a mismatched number of embeddings.', 502)
    }
    // Preserve input order (Voyage returns an `index` per item).
    return data.slice().sort((a, b) => a.index - b.index).map((d) => d.embedding)
  }

  async embedDocuments(texts) {
    const out = []
    for (let i = 0; i < texts.length; i += BATCH) {
      const vectors = await this._embed(texts.slice(i, i + BATCH), 'document')
      out.push(...vectors)
    }
    return out
  }

  async embedQuery(text) {
    const [vector] = await this._embed([text], 'query')
    return vector
  }
}

module.exports = VoyageEmbeddingProvider
