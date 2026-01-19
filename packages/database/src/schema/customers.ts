import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '../utils'
import { tenants } from './tenants'
import { documents } from './documents'

/**
 * Document types for Peruvian identification
 * Based on SUNAT catalog 06
 */
export const DOCUMENT_TYPES = {
  DNI: '1', // Documento Nacional de Identidad
  RUC: '6', // Registro Único de Contribuyente
  PASSPORT: '7', // Pasaporte
  CARNET_EXTRANJERIA: '4', // Carnet de Extranjería
  CEDULA_DIPLOMATICA: 'A', // Cédula Diplomática
  SIN_DOCUMENTO: '0', // Sin documento (boletas menores a S/700)
} as const

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES]

/**
 * Customers table - clients/receivers for billing documents
 * @table customers
 */
export const customers = pgTable(
  'customers',
  {
    /** Unique customer identifier (prefixed: cst_) */
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('cst')),

    /** Associated tenant */
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    /** Document type (SUNAT catalog 06) */
    documentType: text('document_type').$type<DocumentType>().notNull(),

    /** Document number (RUC, DNI, etc.) */
    documentNumber: text('document_number').notNull(),

    /** Customer name (legal name for RUC, full name for DNI) */
    name: text('name').notNull(),

    /** Commercial/Trade name */
    tradeName: text('trade_name'),

    /** Full address */
    address: text('address'),

    /** UBIGEO code */
    ubigeo: text('ubigeo'),

    /** Contact email */
    email: text('email'),

    /** Contact phone */
    phone: text('phone'),

    /** Internal customer code (optional) */
    internalCode: text('internal_code'),

    /** Additional notes */
    notes: text('notes'),

    /** Whether customer is active */
    isActive: boolean('is_active').default(true),

    /** Creation timestamp */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    /** Last update timestamp */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('customers_tenant_id_idx').on(table.tenantId),
    index('customers_document_number_idx').on(table.tenantId, table.documentNumber),
  ]
)

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  documents: many(documents),
}))

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
