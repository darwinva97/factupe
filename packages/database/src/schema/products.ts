import { pgTable, text, timestamp, boolean, numeric, index, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '../utils'
import { tenants } from './tenants'

/**
 * Tax types for products (IGV affectation)
 * Based on SUNAT catalog 07
 */
export const TAX_TYPES = {
  GRAVADO: '10', // Gravado - Operación Onerosa
  GRAVADO_GRATUITO: '11', // Gravado - Retiro por premio
  GRAVADO_GRATUITO_12: '12', // Gravado - Retiro por donación
  GRAVADO_GRATUITO_13: '13', // Gravado - Retiro
  GRAVADO_GRATUITO_14: '14', // Gravado - Retiro por publicidad
  GRAVADO_GRATUITO_15: '15', // Gravado - Bonificaciones
  GRAVADO_GRATUITO_16: '16', // Gravado - Retiro por entrega a trabajadores
  EXONERADO: '20', // Exonerado - Operación Onerosa
  INAFECTO: '30', // Inafecto - Operación Onerosa
  EXPORTACION: '40', // Exportación
} as const

export type TaxType = (typeof TAX_TYPES)[keyof typeof TAX_TYPES]

/**
 * Common SUNAT unit codes (catalog 03)
 */
export const UNIT_CODES = {
  UNIDAD: 'NIU', // Unidad
  KILOGRAMO: 'KGM', // Kilogramo
  LITRO: 'LTR', // Litro
  METRO: 'MTR', // Metro
  METRO_CUADRADO: 'MTK', // Metro cuadrado
  METRO_CUBICO: 'MTQ', // Metro cúbico
  SERVICIO: 'ZZ', // Servicio
  CAJA: 'BX', // Caja
  DOCENA: 'DZN', // Docena
  PAQUETE: 'PK', // Paquete
} as const

/**
 * Products table - items and services for billing
 * @table products
 */
export const products = pgTable(
  'products',
  {
    /** Unique product identifier (prefixed: prd_) */
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('prd')),

    /** Associated tenant */
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),

    /** Internal product code */
    code: text('code').notNull(),

    /** Product/service name */
    name: text('name').notNull(),

    /** Detailed description */
    description: text('description'),

    /** SUNAT unit code (catalog 03) */
    unitCode: text('unit_code').notNull().default('NIU'),

    /** Unit price (without taxes) */
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0'),

    /** Currency code (PEN, USD, etc.) */
    currency: text('currency').notNull().default('PEN'),

    /** Tax type (catalog 07) */
    taxType: text('tax_type').$type<TaxType>().notNull().default('10'),

    /** Product category for organization */
    category: text('category'),

    /** Brand */
    brand: text('brand'),

    /** SKU or barcode */
    sku: text('sku'),

    /** Whether product is a service */
    isService: boolean('is_service').default(false),

    /** Current stock quantity (for products, not services) */
    stockQuantity: numeric('stock_quantity', { precision: 12, scale: 2 }),

    /** Additional attributes */
    attributes: jsonb('attributes').$type<Record<string, unknown>>(),

    /** Whether product is active */
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
    index('products_tenant_id_idx').on(table.tenantId),
    index('products_code_idx').on(table.tenantId, table.code),
  ]
)

export const productsRelations = relations(products, ({ one }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
}))

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
