/**
 * Database Schema Exports
 *
 * This module exports all database tables, relations, and types
 * for use throughout the application.
 *
 * @module database/schema
 * @example
 * ```ts
 * import { tenants, users, documents } from '@factupe/database/schema'
 * import { db } from '@factupe/database/client'
 *
 * const allTenants = await db.select().from(tenants)
 * ```
 */

// Tables
export { tenants, tenantsRelations, type Tenant, type NewTenant } from './tenants'

export {
  users,
  usersRelations,
  USER_ROLES,
  type User,
  type NewUser,
  type UserRole,
} from './users'

export { sessions, sessionsRelations, type Session, type NewSession } from './sessions'

export { accounts, accountsRelations, type Account, type NewAccount } from './accounts'

export {
  customers,
  customersRelations,
  DOCUMENT_TYPES,
  type Customer,
  type NewCustomer,
  type DocumentType,
} from './customers'

export {
  products,
  productsRelations,
  TAX_TYPES,
  UNIT_CODES,
  type Product,
  type NewProduct,
  type TaxType,
} from './products'

export {
  documentSeries,
  documentSeriesRelations,
  SUNAT_DOCUMENT_TYPES,
  type DocumentSeries,
  type NewDocumentSeries,
  type SunatDocumentType,
} from './document-series'

export {
  documents,
  documentsRelations,
  DOCUMENT_STATUS,
  SUNAT_STATUS,
  CURRENCIES,
  type Document,
  type NewDocument,
  type DocumentStatus,
  type SunatStatus,
} from './documents'

export {
  documentItems,
  documentItemsRelations,
  type DocumentItem,
  type NewDocumentItem,
} from './document-items'

export {
  documentEvents,
  documentEventsRelations,
  DOCUMENT_EVENT_TYPES,
  type DocumentEvent,
  type NewDocumentEvent,
  type DocumentEventType,
} from './document-events'
