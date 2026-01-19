/**
 * Base Adapter
 *
 * Abstract base class for SUNAT adapters.
 *
 * @module sunat/adapters/base
 */

import type {
  SunatAdapter,
  SunatResponse,
  SunatStatusResponse,
  DocumentWithItems,
  AdapterConfig,
} from '../types'

/**
 * Abstract base adapter class
 * Provides common functionality for all SUNAT adapters
 */
export abstract class BaseSunatAdapter implements SunatAdapter {
  protected config: AdapterConfig

  constructor(config: AdapterConfig) {
    this.config = config
  }

  /**
   * Send a document to SUNAT
   */
  abstract sendDocument(document: DocumentWithItems): Promise<SunatResponse>

  /**
   * Query document status by ticket
   */
  abstract queryStatus(ticket: string): Promise<SunatStatusResponse>

  /**
   * Void/Cancel a document
   */
  abstract voidDocument(document: DocumentWithItems, reason: string): Promise<SunatResponse>

  /**
   * Get supported document types
   */
  abstract getSupportedDocuments(): string[]

  /**
   * Get adapter name
   */
  abstract getName(): string

  /**
   * Get the SUNAT environment URL
   */
  protected getSunatUrl(): string {
    if (this.config.environment === 'production') {
      return 'https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService'
    }
    return 'https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService'
  }

  /**
   * Generate document filename for SUNAT
   * Format: RUC-TIPO-SERIE-NUMERO
   */
  protected getDocumentFilename(document: DocumentWithItems): string {
    const ruc = document.tenant?.ruc || this.config.ruc
    return `${ruc}-${document.type}-${document.series}-${document.number}`
  }

  /**
   * Validate document before sending
   */
  protected validateDocument(document: DocumentWithItems): void {
    if (!document.tenant?.ruc) {
      throw new Error('Document must have a tenant with RUC')
    }

    if (!document.customer) {
      throw new Error('Document must have a customer')
    }

    if (!document.items || document.items.length === 0) {
      throw new Error('Document must have at least one item')
    }
  }
}
