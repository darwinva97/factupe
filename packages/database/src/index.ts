/**
 * @factupe/database
 *
 * Database package providing Drizzle ORM schemas, client, and utilities
 * for the Factupe billing system.
 *
 * @packageDocumentation
 * @module database
 *
 * @example
 * ```ts
 * // Import the database client
 * import { db } from '@factupe/database/client'
 *
 * // Import schema types
 * import { tenants, users, documents } from '@factupe/database/schema'
 *
 * // Query example
 * const allDocuments = await db.query.documents.findMany({
 *   where: eq(documents.tenantId, 'tnt_xxx'),
 *   with: { customer: true, items: true }
 * })
 * ```
 */

export * from './schema'
export * from './client'
export * from './utils'
