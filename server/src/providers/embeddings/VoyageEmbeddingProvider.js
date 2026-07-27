'use strict'

const { config } = require('../../config/env')
const { AppError } = require('../../middleware/errorHandler')

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings'
const BATCH = 96 // Voyage accepts batches; keep well under request limits.

// Query embeddings are DETERMINISTIC per text, so caching them in-process removes a
// Voyage network round-trip (~50–200ms) from the critical path whenever the same
// question/topic is asked again — which is common (re-asks, revisits, chapter tags).
// Bounded LRU (per server instance; horizontally safe — each instance warms its own
// hot set; swap for Redis if a shared cache is ever needed).
const QCACHE = new Map()
const QCACHE_MAX = 1000

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
    const key = String(text || '')
    const hit = QCACHE.get(key)
    if (hit) { QCACHE.delete(key); QCACHE.set(key, hit); return hit } // LRU bump on hit
    const [vector] = await this._embed([key], 'query')
    QCACHE.set(key, vector)
    if (QCACHE.size > QCACHE_MAX) QCACHE.delete(QCACHE.keys().next().value) // evict oldest
    return vector
  }

  // Batched query-type embeddings. Used for short LABELS (concept names) that are
  // matched against user queries — both sides must share the 'query' input space,
  // otherwise even an exact-name match scores low (the document/query asymmetry is
  // designed for short-query-vs-long-document, not label-vs-label).
  async embedQueries(texts) {
    const out = []
    for (let i = 0; i < texts.length; i += BATCH) {
      const vectors = await this._embed(texts.slice(i, i + BATCH), 'query')
      out.push(...vectors)
    }
    return out
  }
}

module.exports = VoyageEmbeddingProvider
