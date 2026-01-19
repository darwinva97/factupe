/**
 * SUNAT Types
 *
 * Type definitions for SUNAT integration.
 *
 * @module sunat/types
 */

import type { Document, DocumentItem } from '@factupe/database/schema'

/**
 * SUNAT environment types
 */
export type SunatEnvironment = 'beta' | 'production'

/**
 * SUNAT adapter provider types
 */
export type SunatProvider = 'direct' | 'nubefact' | 'efact' | 'mock' | string

/**
 * SUNAT send response status
 */
export type SunatResponseStatus = 'accepted' | 'rejected' | 'exception' | 'observed' | 'pending'

/**
 * SUNAT send response
 */
export interface SunatResponse {
  success: boolean
  status: SunatResponseStatus
  responseCode?: string
  responseMessage?: string
  notes?: string[]
  hash?: string
  ticket?: string
  cdrData?: string
  xmlSigned?: string
}

/**
 * SUNAT status query response
 */
export interface SunatStatusResponse {
  status: SunatResponseStatus
  responseCode?: string
  responseMessage?: string
  cdrData?: string
}

/**
 * Document with items for processing
 */
export interface DocumentWithItems extends Document {
  items: DocumentItem[]
  customer?: {
    documentType: string
    documentNumber: string
    name: string
    address?: string | null
  } | null
  tenant?: {
    ruc: string
    name: string
    tradeName?: string | null
    address?: string | null
    ubigeo?: string | null
  } | null
}

/**
 * SUNAT adapter interface
 * All adapters must implement this interface
 */
export interface SunatAdapter {
  /**
   * Send a document to SUNAT
   */
  sendDocument(document: DocumentWithItems): Promise<SunatResponse>

  /**
   * Query document status by ticket (for async operations)
   */
  queryStatus(ticket: string): Promise<SunatStatusResponse>

  /**
   * Void/Cancel a document
   */
  voidDocument(document: DocumentWithItems, reason: string): Promise<SunatResponse>

  /**
   * Get supported document types for this adapter
   */
  getSupportedDocuments(): string[]

  /**
   * Get adapter name/identifier
   */
  getName(): string
}

/**
 * Adapter configuration
 */
export interface AdapterConfig {
  environment: SunatEnvironment
  ruc: string
  userSol?: string
  passwordSol?: string
  certificatePath?: string
  certificatePassword?: string
  apiKey?: string
  apiUrl?: string
}

/**
 * UBL Line item for XML generation
 */
export interface UBLLineItem {
  id: number
  quantity: number
  unitCode: string
  description: string
  unitPrice: number
  unitPriceWithTax: number
  taxableAmount: number
  taxAmount: number
  taxType: string
  igvPercentage: number
  total: number
  isFree: boolean
  priceTypeCode: string
}

/**
 * UBL Document data for XML generation
 */
export interface UBLDocumentData {
  // Issuer
  issuerRuc: string
  issuerName: string
  issuerTradeName?: string
  issuerAddress?: string
  issuerUbigeo?: string

  // Document
  documentType: string
  series: string
  number: string
  issueDate: string
  issueTime: string
  dueDate?: string

  // Currency
  currency: string
  exchangeRate?: number

  // Customer
  customerDocumentType: string
  customerDocumentNumber: string
  customerName: string
  customerAddress?: string

  // Totals
  taxableAmount: number
  exemptAmount: number
  unaffectedAmount: number
  freeAmount: number
  igvAmount: number
  iscAmount: number
  otherTaxes: number
  globalDiscount: number
  otherCharges: number
  total: number

  // Operation
  operationType: string

  // Items
  items: UBLLineItem[]

  // Notes
  observations?: string

  // For credit/debit notes
  referenceDocumentType?: string
  referenceDocumentNumber?: string
  noteReasonCode?: string
  noteReasonDescription?: string

  // Legends (for amount in words, etc.)
  legends?: Array<{ code: string; value: string }>
}

/**
 * SUNAT catalog codes
 */
export const SUNAT_CATALOGS = {
  // Catalog 01 - Document types
  DOCUMENT_TYPES: {
    FACTURA: '01',
    BOLETA: '03',
    NOTA_CREDITO: '07',
    NOTA_DEBITO: '08',
    GUIA_REMISION_REMITENTE: '09',
    GUIA_REMISION_TRANSPORTISTA: '31',
    RETENCION: '20',
    PERCEPCION: '40',
  },

  // Catalog 06 - Identity document types
  IDENTITY_TYPES: {
    DNI: '1',
    RUC: '6',
    PASSPORT: '7',
    CARNET_EXTRANJERIA: '4',
    SIN_DOCUMENTO: '0',
  },

  // Catalog 07 - Tax types (IGV affectation)
  TAX_TYPES: {
    GRAVADO: '10',
    GRAVADO_GRATUITO: '11',
    EXONERADO: '20',
    INAFECTO: '30',
    EXPORTACION: '40',
  },

  // Catalog 09 - Credit note reason codes
  CREDIT_NOTE_REASONS: {
    ANULACION: '01',
    CORRECCION_DESCRIPCION: '02',
    DESCUENTO_GLOBAL: '03',
    DESCUENTO_ITEM: '04',
    DEVOLUCION_TOTAL: '05',
    DEVOLUCION_PARCIAL: '06',
    BONIFICACION: '07',
    DISMINUCION_VALOR: '08',
    OTROS: '09',
  },

  // Catalog 10 - Debit note reason codes
  DEBIT_NOTE_REASONS: {
    INTERES_MORA: '01',
    AUMENTO_VALOR: '02',
    PENALIDADES: '03',
  },

  // Catalog 51 - Operation types
  OPERATION_TYPES: {
    VENTA_INTERNA: '0101',
    EXPORTACION: '0200',
    NO_DOMICILIADOS: '0300',
    VENTA_INTERNA_ANTICIPOS: '0401',
    VENTA_ITINERANTE: '0501',
  },
} as const
