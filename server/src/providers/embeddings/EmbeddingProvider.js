'use strict'

/**
 * Abstract base class every embedding provider must implement.
 * Swap providers by adding a class here and updating EMBEDDING_PROVIDER.
 */
class EmbeddingProvider {
  /** Vector dimension this provider/model produces (must match the DB column). */
  get dimension() {
    throw new Error(`${this.constructor.name} must implement dimension`)
  }

  /**
   * Embed a batch of document chunks (for ingestion).
   * @param {string[]} texts
   * @returns {Promise<number[][]>} one vector per input, same order
   */
  async embedDocuments(texts) {
    throw new Error(`${this.constructor.name} must implement embedDocuments()`)
  }

  /**
   * Embed a single search query (for retrieval).
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async embedQuery(text) {
    throw new Error(`${this.constructor.name} must implement embedQuery()`)
  }
}

module.exports = EmbeddingProvider
