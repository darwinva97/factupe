/**
 * Mock Adapter
 *
 * Mock SUNAT adapter for development and testing.
 * Simulates SUNAT responses without making actual API calls.
 *
 * @module sunat/adapters/mock
 */

import { BaseSunatAdapter } from '../base'
import type {
  SunatResponse,
  SunatStatusResponse,
  DocumentWithItems,
  AdapterConfig,
} from '../../types'
import { SUNAT_CATALOGS } from '../../types'

/**
 * Mock adapter configuration
 */
export interface MockAdapterConfig extends AdapterConfig {
  /**
   * Simulate delay in milliseconds
   */
  delay?: number

  /**
   * Force specific response status for testing
   */
  forceStatus?: 'accepted' | 'rejected' | 'exception'

  /**
   * Force specific error code for testing
   */
  forceErrorCode?: string
}

/**
 * Mock SUNAT adapter for development and testing
 *
 * @example
 * ```ts
 * const adapter = new MockAdapter({
 *   environment: 'beta',
 *   ruc: '20123456789',
 *   delay: 1000, // Simulate 1 second delay
 * })
 *
 * const response = await adapter.sendDocument(document)
 * ```
 */
export class MockAdapter extends BaseSunatAdapter {
  private mockConfig: MockAdapterConfig

  constructor(config: MockAdapterConfig) {
    super(config)
    this.mockConfig = config
  }

  getName(): string {
    return 'mock'
  }

  getSupportedDocuments(): string[] {
    return [
      SUNAT_CATALOGS.DOCUMENT_TYPES.FACTURA,
      SUNAT_CATALOGS.DOCUMENT_TYPES.BOLETA,
      SUNAT_CATALOGS.DOCUMENT_TYPES.NOTA_CREDITO,
      SUNAT_CATALOGS.DOCUMENT_TYPES.NOTA_DEBITO,
    ]
  }

  async sendDocument(document: DocumentWithItems): Promise<SunatResponse> {
    // Simulate delay
    if (this.mockConfig.delay) {
      await this.delay(this.mockConfig.delay)
    }

    // Validate document
    this.validateDocument(document)

    // Check for forced status
    if (this.mockConfig.forceStatus === 'rejected') {
      return this.createRejectedResponse(this.mockConfig.forceErrorCode || '2010')
    }

    if (this.mockConfig.forceStatus === 'exception') {
      return this.createExceptionResponse()
    }

    // Generate mock successful response
    const hash = this.generateMockHash()
    const filename = this.getDocumentFilename(document)

    return {
      success: true,
      status: 'accepted',
      responseCode: '0',
      responseMessage: `El Comprobante numero ${document.series}-${document.number}, ha sido aceptado`,
      hash,
      notes: [],
      cdrData: this.generateMockCDR(filename, hash),
      xmlSigned: this.generateMockSignedXML(document),
    }
  }

  async queryStatus(ticket: string): Promise<SunatStatusResponse> {
    // Simulate delay
    if (this.mockConfig.delay) {
      await this.delay(this.mockConfig.delay)
    }

    // Mock: tickets always return accepted
    return {
      status: 'accepted',
      responseCode: '0',
      responseMessage: 'Proceso completado correctamente',
    }
  }

  async voidDocument(document: DocumentWithItems, reason: string): Promise<SunatResponse> {
    // Simulate delay
    if (this.mockConfig.delay) {
      await this.delay(this.mockConfig.delay)
    }

    const filename = this.getDocumentFilename(document)

    return {
      success: true,
      status: 'accepted',
      responseCode: '0',
      responseMessage: `El documento ${filename} ha sido anulado correctamente. Motivo: ${reason}`,
      ticket: `ticket_${Date.now()}`,
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private generateMockHash(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let hash = ''
    for (let i = 0; i < 44; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return hash
  }

  private generateMockCDR(filename: string, hash: string): string {
    return Buffer.from(
      `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2">
  <ID>${filename}</ID>
  <ResponseCode>0</ResponseCode>
  <Description>El Comprobante ha sido aceptado</Description>
  <DigestValue>${hash}</DigestValue>
</ApplicationResponse>`
    ).toString('base64')
  }

  private generateMockSignedXML(document: DocumentWithItems): string {
    // Return a mock signed XML structure
    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <!-- Mock signed XML for ${document.series}-${document.number} -->
</Invoice>`
  }

  private createRejectedResponse(errorCode: string): SunatResponse {
    const errorMessages: Record<string, string> = {
      '2010': 'El numero de documento del receptor no cumple con el formato establecido',
      '2017': 'El documento ya fue informado anteriormente',
      '2800': 'El tipo de documento del receptor no es valido',
      '3105': 'El XML no cumple con el formato UBL 2.1',
    }

    return {
      success: false,
      status: 'rejected',
      responseCode: errorCode,
      responseMessage: errorMessages[errorCode] || `Error ${errorCode}`,
      notes: [],
    }
  }

  private createExceptionResponse(): SunatResponse {
    return {
      success: false,
      status: 'exception',
      responseCode: 'EXC001',
      responseMessage: 'Error de conexion con los servidores de SUNAT',
      notes: ['Intente nuevamente en unos minutos'],
    }
  }
}
