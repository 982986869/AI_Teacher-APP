'use strict'

const { config } = require('../config/env')

let _provider = null

/**
 * Returns the singleton AI provider instance.
 * The provider is selected by the AI_PROVIDER environment variable.
 */
function getAIProvider() {
  if (_provider) return _provider

  switch (config.ai.provider) {
    case 'anthropic': {
      const AnthropicProvider = require('./ai/AnthropicProvider')
      _provider = new AnthropicProvider()
      break
    }
    default:
      throw new Error(
        `Unknown AI provider: "${config.ai.provider}". ` +
        'Supported values: anthropic'
      )
  }

  return _provider
}

module.exports = { getAIProvider }
