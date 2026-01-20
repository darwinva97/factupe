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
import { DirectAdapter, type DirectAdapterConfig } from './direct'
import { NubefactAdapter, type NubefactConfig } from './nubefact'

/**
 * Create a SUNAT adapter based on provider type
 *
 * @param provider - Provider type
 * @param config - Adapter configuration
 * @returns SUNAT adapter instance
 *
 * @example Mock adapter (development)
 * ```ts
 * const adapter = createAdapter('mock', {
 *   environment: 'beta',
 *   ruc: '20123456789',
 * })
 * ```
 *
 * @example Direct SUNAT adapter
 * ```ts
 * const adapter = createAdapter('direct', {
 *   environment: 'production',
 *   ruc: '20123456789',
 *   userSol: 'USUARIO',
 *   passwordSol: 'CLAVE',
 *   certificatePath: '/path/to/cert.pfx',
 *   certificatePassword: 'password',
 * })
 * ```
 *
 * @example Nubefact OSE adapter
 * ```ts
 * const adapter = createAdapter('nubefact', {
 *   environment: 'production',
 *   ruc: '20123456789',
 *   apiKey: 'your-api-key',
 * })
 * ```
 */
export function createAdapter(provider: SunatProvider, config: AdapterConfig): SunatAdapter {
  switch (provider) {
    case 'mock':
      return new MockAdapter(config)

    case 'direct':
      // Validate required config for direct adapter
      const directConfig = config as DirectAdapterConfig
      if (!directConfig.certificatePath || !directConfig.certificatePassword) {
        throw new Error('Direct adapter requires certificatePath and certificatePassword')
      }
      if (!directConfig.userSol || !directConfig.passwordSol) {
        throw new Error('Direct adapter requires userSol and passwordSol')
      }
      return new DirectAdapter(directConfig)

    case 'nubefact':
      const nubefactConfig = config as NubefactConfig
      if (!nubefactConfig.apiKey) {
        throw new Error('Nubefact adapter requires apiKey')
      }
      return new NubefactAdapter(nubefactConfig)

    case 'efact':
      // TODO: Implement eFact adapter when needed
      throw new Error('eFact adapter not implemented yet. Use nubefact or direct.')

    default:
      throw new Error(`Unknown SUNAT provider: ${provider}`)
  }
}
