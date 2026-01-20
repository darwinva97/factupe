/**
 * @factupe/sunat
 *
 * SUNAT integration package for electronic billing in Peru.
 * Provides adapters, XML builders, and validators for SUNAT documents.
 *
 * @packageDocumentation
 * @module sunat
 *
 * @example
 * ```ts
 * import { createAdapter, buildDocumentXML } from '@factupe/sunat'
 *
 * // Create adapter
 * const adapter = createAdapter('mock', {
 *   environment: 'beta',
 *   ruc: '20123456789',
 * })
 *
 * // Build XML
 * const xml = buildDocumentXML(document)
 *
 * // Send to SUNAT
 * const response = await adapter.sendDocument(document)
 * ```
 */

// Adapters
export {
  createAdapter,
  BaseSunatAdapter,
  MockAdapter,
  type MockAdapterConfig,
} from './adapters'
export { DirectAdapter, type DirectAdapterConfig } from './adapters/direct'
export { NubefactAdapter, type NubefactConfig } from './adapters/nubefact'

// Builders
export { UBLBuilder, buildDocumentXML, documentToUBLData } from './builders'

// Validators
export {
  validateRuc,
  validateDocumentNumber,
  validateTotals,
  invoiceSchema,
  creditNoteSchema,
  debitNoteSchema,
  rucSchema,
  dniSchema,
} from './validators'

// PDF Generation
export { InvoicePDF, generateInvoicePDF } from './pdf/invoice-pdf'

// XML Signing
export {
  loadCertificate,
  signXML,
  getHashFromSignedXml,
  verifyXMLSignature,
  type CertificateInfo,
  type SignatureOptions,
} from './utils/xml-signer'

// Utilities
export { numberToWords } from './utils/number-to-words'
export { formatDate, formatTime, formatDateTime, getPeruDate } from './utils/date'

// Types
export {
  SUNAT_CATALOGS,
  type SunatAdapter,
  type SunatResponse,
  type SunatStatusResponse,
  type DocumentWithItems,
  type AdapterConfig,
  type SunatEnvironment,
  type SunatProvider,
  type UBLDocumentData,
  type UBLLineItem,
} from './types'
