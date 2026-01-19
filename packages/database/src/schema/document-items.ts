import { pgTable, text, timestamp, numeric, integer, index, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '../utils'
import { documents } from './documents'
import { products } from './products'
import { type TaxType } from './products'

/**
 * Document items table - line items within documents
 * @table document_items
 */
export const documentItems = pgTable(
  'document_items',
  {
    /** Unique item identifier (prefixed: itm_) */
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('itm')),

    /** Parent document */
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),

    /** Associated product (optional - can be ad-hoc items) */
    productId: text('product_id').references(() => products.id, { onDelete: 'set null' }),

    /** Item position in the document */
    position: integer('position').notNull().default(1),

    /** Product/service code */
    code: text('code'),

    /** Item description */
    description: text('description').notNull(),

    /** SUNAT unit code (catalog 03) */
    unitCode: text('unit_code').notNull().default('NIU'),

    /** Quantity */
    quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(),

    /** Unit price (without taxes) */
    unitPrice: numeric('unit_price', { precision: 12, scale: 6 }).notNull(),

    /** Unit price with taxes (reference) */
    unitPriceWithTax: numeric('unit_price_with_tax', { precision: 12, scale: 6 }),

    /** Discount amount per unit */
    discountPerUnit: numeric('discount_per_unit', { precision: 12, scale: 2 }).default('0'),

    /** Total discount for this item */
    discount: numeric('discount', { precision: 12, scale: 2 }).default('0'),

    /** Discount percentage */
    discountPercentage: numeric('discount_percentage', { precision: 5, scale: 2 }).default('0'),

    /** Taxable base (valor de venta) */
    taxableBase: numeric('taxable_base', { precision: 12, scale: 2 }).notNull(),

    /** Tax type (catalog 07) */
    taxType: text('tax_type').$type<TaxType>().notNull().default('10'),

    /** IGV percentage (usually 18) */
    igvPercentage: numeric('igv_percentage', { precision: 5, scale: 2 }).notNull().default('18'),

    /** IGV amount */
    igvAmount: numeric('igv_amount', { precision: 12, scale: 2 }).notNull().default('0'),

    /** ISC amount (if applicable) */
    iscAmount: numeric('isc_amount', { precision: 12, scale: 2 }).default('0'),

    /** ISC percentage */
    iscPercentage: numeric('isc_percentage', { precision: 5, scale: 2 }).default('0'),

    /** ISC type (SUNAT catalog 08) */
    iscType: text('isc_type'),

    /** Total amount (taxable base + taxes) */
    total: numeric('total', { precision: 12, scale: 2 }).notNull(),

    /** Free/gratuitous item indicator */
    isFree: text('is_free').default('false'),

    /** Reference price for free items */
    referencePrice: numeric('reference_price', { precision: 12, scale: 6 }),

    /** Additional attributes */
    attributes: jsonb('attributes').$type<Record<string, unknown>>(),

    /** Creation timestamp */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    /** Last update timestamp */
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('document_items_document_id_idx').on(table.documentId)]
)

export const documentItemsRelations = relations(documentItems, ({ one }) => ({
  document: one(documents, {
    fields: [documentItems.documentId],
    references: [documents.id],
  }),
  product: one(products, {
    fields: [documentItems.productId],
    references: [products.id],
  }),
}))

export type DocumentItem = typeof documentItems.$inferSelect
export type NewDocumentItem = typeof documentItems.$inferInsert
