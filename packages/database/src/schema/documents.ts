import { pgTable, text, timestamp, numeric, date, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '../utils'
import { tenants } from './tenants'
import { customers } from './customers'
import { documentItems } from './document-items'
import { documentEvents } from './document-events'
import { type SunatDocumentType } from './document-series'

/**
 * Document status in the system
 */
export const DOCUMENT_STATUS = {
  DRAFT: 'draft', // Borrador
  PENDING: 'pending', // Pendiente de envío
  SENT: 'sent', // Enviado a SUNAT
  ACCEPTED: 'accepted', // Aceptado por SUNAT
  REJECTED: 'rejected', // Rechazado por SUNAT
  VOIDED: 'voided', // Anulado
  OBSERVED: 'observed', // Observado (aceptado con observaciones)
} as const

export type DocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS]

/**
 * SUNAT response status codes
 */
export const SUNAT_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXCEPTION: 'exception',
  OBSERVED: 'observed',
} as const

export type SunatStatus = (typeof SUNAT_STATUS)[keyof typeof SUNAT_STATUS]

/**
 * Currency codes commonly used
 */
export const CURRENCIES = {
  PEN: 'PEN', // Soles
  USD: 'USD', // Dólares
  EUR: 'EUR', // Euros
} as const

/**
 * Documents table - main billing documents (invoices, receipts, etc.)
 * @table documents
 */
export const documents = pgTable(
  'documents',
  {
    /** Unique document identifier (prefixed: doc_) */
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('doc')),

    /** Associated tenant */
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    /** Document type (SUNAT catalog 01) */
    type: text('type').$type<SunatDocumentType>().notNull(),

    /** Document series (e.g., F001) */
    series: text('series').notNull(),

    /** Correlative number */
    number: text('number').notNull(),

    /** Associated customer */
    customerId: text('customer_id').references(() => customers.id, { onDelete: 'set null' }),

    /** Issue date */
    issueDate: date('issue_date', { mode: 'date' }).notNull(),

    /** Due date (optional) */
    dueDate: date('due_date', { mode: 'date' }),

    /** Currency code */
    currency: text('currency').notNull().default('PEN'),

    /** Exchange rate (for foreign currency) */
    exchangeRate: numeric('exchange_rate', { precision: 10, scale: 6 }).default('1'),

    /** Operation type code (SUNAT catalog 51) */
    operationType: text('operation_type').default('0101'),

    // Totals
    /** Subtotal before taxes */
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull().default('0'),

    /** Total taxable amount (base imponible) */
    taxableAmount: numeric('taxable_amount', { precision: 12, scale: 2 }).notNull().default('0'),

    /** Total exempt amount */
    exemptAmount: numeric('exempt_amount', { precision: 12, scale: 2 }).default('0'),

    /** Total unaffected amount */
    unaffectedAmount: numeric('unaffected_amount', { precision: 12, scale: 2 }).default('0'),

    /** Total free/gratuitous amount */
    freeAmount: numeric('free_amount', { precision: 12, scale: 2 }).default('0'),

    /** Total global discount */
    globalDiscount: numeric('global_discount', { precision: 12, scale: 2 }).default('0'),

    /** IGV amount (18%) */
    igv: numeric('igv', { precision: 12, scale: 2 }).notNull().default('0'),

    /** ISC amount (if applicable) */
    isc: numeric('isc', { precision: 12, scale: 2 }).default('0'),

    /** Other taxes */
    otherTaxes: numeric('other_taxes', { precision: 12, scale: 2 }).default('0'),

    /** Other charges */
    otherCharges: numeric('other_charges', { precision: 12, scale: 2 }).default('0'),

    /** Total amount */
    total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),

    // For credit/debit notes
    /** Reference document ID (for NC/ND) */
    referenceDocumentId: text('reference_document_id').references(() => documents.id),

    /** Reference document type */
    referenceDocumentType: text('reference_document_type'),

    /** Reference document series-number */
    referenceDocumentNumber: text('reference_document_number'),

    /** Credit/Debit note reason code (SUNAT catalog 09/10) */
    noteReasonCode: text('note_reason_code'),

    /** Note reason description */
    noteReasonDescription: text('note_reason_description'),

    // Status
    /** Internal document status */
    status: text('status').$type<DocumentStatus>().notNull().default('draft'),

    /** SUNAT response status */
    sunatStatus: text('sunat_status').$type<SunatStatus>(),

    /** SUNAT ticket number (for async queries) */
    sunatTicket: text('sunat_ticket'),

    /** SUNAT response code */
    sunatResponseCode: text('sunat_response_code'),

    /** SUNAT response message */
    sunatResponseMessage: text('sunat_response_message'),

    /**
     * Full SUNAT response (CDR data)
     */
    sunatResponse: jsonb('sunat_response').$type<{
      responseCode?: string
      responseMessage?: string
      notes?: string[]
      hash?: string
      cdrData?: string
    }>(),

    // File URLs
    /** XML file URL */
    xmlUrl: text('xml_url'),

    /** Signed XML file URL */
    signedXmlUrl: text('signed_xml_url'),

    /** PDF file URL */
    pdfUrl: text('pdf_url'),

    /** CDR (response) file URL */
    cdrUrl: text('cdr_url'),

    /** QR code data */
    qrCode: text('qr_code'),

    /** Digital signature hash */
    hashCode: text('hash_code'),

    // Additional info
    /** Purchase order number */
    purchaseOrder: text('purchase_order'),

    /** Observations/notes */
    observations: text('observations'),

    /** Additional custom data */
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    /** Creation timestamp */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    /** Last update timestamp */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),

    /** Sent to SUNAT timestamp */
    sentAt: timestamp('sent_at', { withTimezone: true }),

    /** Voided timestamp */
    voidedAt: timestamp('voided_at', { withTimezone: true }),
  },
  (table) => [
    index('documents_tenant_id_idx').on(table.tenantId),
    index('documents_customer_id_idx').on(table.customerId),
    index('documents_type_idx').on(table.tenantId, table.type),
    index('documents_series_number_idx').on(table.tenantId, table.series, table.number),
    index('documents_status_idx').on(table.tenantId, table.status),
    index('documents_issue_date_idx').on(table.tenantId, table.issueDate),
  ]
)

export const documentsRelations = relations(documents, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [documents.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [documents.customerId],
    references: [customers.id],
  }),
  referenceDocument: one(documents, {
    fields: [documents.referenceDocumentId],
    references: [documents.id],
    relationName: 'referenceDocuments',
  }),
  items: many(documentItems),
  events: many(documentEvents),
}))

export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
