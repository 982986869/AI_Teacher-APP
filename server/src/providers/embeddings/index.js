'use strict'

const { config } = require('../../config/env')

let _provider = null

// Singleton embedding provider, selected by EMBEDDING_PROVIDER (default: voyage).
function getEmbeddingProvider() {
  if (_provider) return _provider

  switch (config.embeddings.provider) {
    case 'voyage': {
      const VoyageEmbeddingProvider = require('./VoyageEmbeddingProvider')
      _provider = new VoyageEmbeddingProvider()
      break
    }
    default:
      throw new Error(
        `Unknown embedding provider: "${config.embeddings.provider}". Supported values: voyage`
      )
  }

  return _provider
}

module.exports = { getEmbeddingProvider }
