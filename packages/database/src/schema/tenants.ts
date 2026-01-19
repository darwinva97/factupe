import { pgTable, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '../utils'

/**
 * Tenant (Empresa) schema for multi-tenancy support
 * Each tenant represents a company using the billing system
 * @table tenants
 */
export const tenants = pgTable('tenants', {
  /** Unique tenant identifier (prefixed: tnt_) */
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId('tnt')),

  /** Company legal name (Razón Social) */
  name: text('name').notNull(),

  /** RUC number - Peruvian tax ID (11 digits) */
  ruc: text('ruc').notNull().unique(),

  /** Commercial/Trade name (Nombre Comercial) */
  tradeName: text('trade_name'),

  /** Fiscal address */
  address: text('address'),

  /** UBIGEO code (6 digits) */
  ubigeo: text('ubigeo'),

  /** Department */
  department: text('department'),

  /** Province */
  province: text('province'),

  /** District */
  district: text('district'),

  /** Contact email */
  email: text('email'),

  /** Contact phone */
  phone: text('phone'),

  /** Company logo URL */
  logoUrl: text('logo_url'),

  /**
   * SUNAT configuration (encrypted sensitive data)
   * Contains: certificate path, SOL credentials, etc.
   */
  sunatConfig: jsonb('sunat_config').$type<{
    environment: 'beta' | 'production'
    provider: 'direct' | 'nubefact' | 'efact' | string
    providerConfig?: Record<string, unknown>
    certificatePath?: string
    userSol?: string
  }>(),

  /**
   * Tenant-specific settings
   */
  settings: jsonb('settings').$type<{
    currency: string
    timezone: string
    language: string
    invoiceNotes?: string
    termsAndConditions?: string
  }>(),

  /** Subscription plan */
  plan: text('plan').default('free'),

  /** Whether tenant is active */
  isActive: boolean('is_active').default(true),

  /** Creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  /** Last update timestamp */
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  products: many(products),
  documents: many(documents),
  series: many(documentSeries),
}))

// Forward declarations for relations (will be imported in index.ts)
import { users } from './users'
import { customers } from './customers'
import { products } from './products'
import { documents } from './documents'
import { documentSeries } from './document-series'

export type Tenant = typeof tenants.$inferSelect
export type NewTenant = typeof tenants.$inferInsert
