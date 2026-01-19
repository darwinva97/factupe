import { pgTable, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '../utils'
import { tenants } from './tenants'

/**
 * Document types supported by SUNAT
 * Based on SUNAT catalog 01
 */
export const SUNAT_DOCUMENT_TYPES = {
  FACTURA: '01', // Factura
  BOLETA: '03', // Boleta de Venta
  NOTA_CREDITO: '07', // Nota de Crédito
  NOTA_DEBITO: '08', // Nota de Débito
  GUIA_REMISION_REMITENTE: '09', // Guía de Remisión Remitente
  GUIA_REMISION_TRANSPORTISTA: '31', // Guía de Remisión Transportista
  RETENCION: '20', // Comprobante de Retención
  PERCEPCION: '40', // Comprobante de Percepción
} as const

export type SunatDocumentType = (typeof SUNAT_DOCUMENT_TYPES)[keyof typeof SUNAT_DOCUMENT_TYPES]

/**
 * Document series table - manages series and correlative numbering
 * @table document_series
 */
export const documentSeries = pgTable(
  'document_series',
  {
    /** Unique series identifier (prefixed: ser_) */
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('ser')),

    /** Associated tenant */
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    /** Document type code (SUNAT catalog 01) */
    documentType: text('document_type').$type<SunatDocumentType>().notNull(),

    /** Series code (e.g., F001, B001, FC01) */
    series: text('series').notNull(),

    /** Current correlative number */
    currentNumber: integer('current_number').notNull().default(0),

    /** Whether series is active */
    isActive: boolean('is_active').default(true),

    /** Description or point of sale name */
    description: text('description'),

    /** Creation timestamp */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    /** Last update timestamp */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('document_series_tenant_type_idx').on(table.tenantId, table.documentType),
    index('document_series_tenant_series_idx').on(table.tenantId, table.series),
  ]
)

export const documentSeriesRelations = relations(documentSeries, ({ one }) => ({
  tenant: one(tenants, {
    fields: [documentSeries.tenantId],
    references: [tenants.id],
  }),
}))

export type DocumentSeries = typeof documentSeries.$inferSelect
export type NewDocumentSeries = typeof documentSeries.$inferInsert
