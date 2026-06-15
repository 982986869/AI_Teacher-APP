'use strict'

const { config } = require('../../config/env')

let _provider = null

/**
 * Returns the singleton embedding provider, selected by EMBEDDING_PROVIDER.
 * Add new providers (e.g. OpenAI) by extending the switch below.
 */
function getEmbeddingProvider() {
  if (_provider) return _provider

  switch (config.embeddings.provider) {
    case 'voyage': {
      const VoyageProvider = require('./VoyageProvider')
      _provider = new VoyageProvider()
      break
    }
    // case 'openai': {  // future — text-embedding-3-small (1536 dims)
    //   const OpenAIProvider = require('./OpenAIProvider')
    //   _provider = new OpenAIProvider()
    //   break
    // }
    default:
      throw new Error(
        `Unknown EMBEDDING_PROVIDER: "${config.embeddings.provider}". Supported values: voyage`
      )
  }

  return _provider
}

module.exports = { getEmbeddingProvider }
