/**
 * Document Types
 *
 * Type definitions for billing documents and SUNAT integration.
 *
 * @module types/documents
 */

/**
 * Input for creating a new invoice
 */
export interface CreateInvoiceInput {
  /** Customer ID or inline customer data */
  customerId?: string
  customer?: InlineCustomerData

  /** Document series (e.g., F001) */
  series: string

  /** Issue date (defaults to today) */
  issueDate?: string

  /** Due date */
  dueDate?: string

  /** Currency code (defaults to PEN) */
  currency?: string

  /** Exchange rate for foreign currency */
  exchangeRate?: number

  /** Operation type code */
  operationType?: string

  /** Line items */
  items: CreateInvoiceItemInput[]

  /** Global discount amount */
  globalDiscount?: number

  /** Other charges */
  otherCharges?: number

  /** Purchase order reference */
  purchaseOrder?: string

  /** Additional observations */
  observations?: string

  /** Custom metadata */
  metadata?: Record<string, unknown>
}

/**
 * Inline customer data for ad-hoc customers
 */
export interface InlineCustomerData {
  documentType: string
  documentNumber: string
  name: string
  address?: string
  email?: string
}

/**
 * Input for invoice line items
 */
export interface CreateInvoiceItemInput {
  /** Product ID or inline product data */
  productId?: string

  /** Product code (for ad-hoc items) */
  code?: string

  /** Item description */
  description: string

  /** Quantity */
  quantity: number

  /** Unit price (without taxes) */
  unitPrice: number

  /** Unit code (defaults to NIU) */
  unitCode?: string

  /** Tax type code */
  taxType?: string

  /** Discount amount */
  discount?: number

  /** Discount percentage */
  discountPercentage?: number

  /** Whether item is free/gratuitous */
  isFree?: boolean
}

/**
 * Input for creating a credit note
 */
export interface CreateCreditNoteInput {
  /** Reference document ID */
  referenceDocumentId: string

  /** Series for the credit note */
  series: string

  /** Credit note reason code (SUNAT catalog 09) */
  reasonCode: string

  /** Reason description */
  reasonDescription: string

  /** Line items (optional - defaults to full reversal) */
  items?: CreateInvoiceItemInput[]

  /** Observations */
  observations?: string
}

/**
 * Input for creating a debit note
 */
export interface CreateDebitNoteInput {
  /** Reference document ID */
  referenceDocumentId: string

  /** Series for the debit note */
  series: string

  /** Debit note reason code (SUNAT catalog 10) */
  reasonCode: string

  /** Reason description */
  reasonDescription: string

  /** Line items */
  items: CreateInvoiceItemInput[]

  /** Observations */
  observations?: string
}

/**
 * SUNAT send response
 */
export interface SunatSendResponse {
  success: boolean
  status: 'accepted' | 'rejected' | 'exception' | 'observed'
  responseCode?: string
  responseMessage?: string
  notes?: string[]
  hash?: string
  ticket?: string
  cdrData?: string
}

/**
 * Document with computed totals
 */
export interface DocumentWithTotals {
  subtotal: number
  taxableAmount: number
  exemptAmount: number
  unaffectedAmount: number
  freeAmount: number
  globalDiscount: number
  igv: number
  isc: number
  otherTaxes: number
  otherCharges: number
  total: number
}

/**
 * Document summary for lists
 */
export interface DocumentSummary {
  id: string
  type: string
  series: string
  number: string
  customerName: string
  issueDate: string
  currency: string
  total: number
  status: string
  sunatStatus?: string
}

/**
 * Document filter options
 */
export interface DocumentFilters {
  type?: string | string[]
  status?: string | string[]
  sunatStatus?: string | string[]
  customerId?: string
  series?: string
  startDate?: string
  endDate?: string
  minTotal?: number
  maxTotal?: number
}
