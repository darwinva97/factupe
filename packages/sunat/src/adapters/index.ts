/**
 * SUNAT Adapters
 *
 * Export all available SUNAT adapters.
 *
 * @module sunat/adapters
 */

export { BaseSunatAdapter } from './base'
export { MockAdapter, type MockAdapterConfig } from './mock'

// Re-export types
export type {
  SunatAdapter,
  SunatResponse,
  SunatStatusResponse,
  DocumentWithItems,
  AdapterConfig,
} from '../types'

import type { SunatAdapter, AdapterConfig, SunatProvider } from '../types'
import { MockAdapter } from './mock'

/**
 * Create a SUNAT adapter based on provider type
 *
 * @param provider - Provider type
 * @param config - Adapter configuration
 * @returns SUNAT adapter instance
 *
 * @example
 * ```ts
 * const adapter = createAdapter('mock', {
 *   environment: 'beta',
 *   ruc: '20123456789',
 * })
 * ```
 */
export function createAdapter(provider: SunatProvider, config: AdapterConfig): SunatAdapter {
  switch (provider) {
    case 'mock':
      return new MockAdapter(config)

    case 'direct':
      // TODO: Implement direct SUNAT adapter
      throw new Error('Direct SUNAT adapter not implemented yet. Use mock for development.')

    case 'nubefact':
      // TODO: Implement Nubefact adapter
      throw new Error('Nubefact adapter not implemented yet. Use mock for development.')

    case 'efact':
      // TODO: Implement eFact adapter
      throw new Error('eFact adapter not implemented yet. Use mock for development.')

    default:
      throw new Error(`Unknown SUNAT provider: ${provider}`)
  }
}
