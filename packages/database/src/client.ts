import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Database client singleton for connection management
 * @module database/client
 */

const globalForDb = globalThis as unknown as {
  connection: postgres.Sql | undefined
}

/**
 * Creates or returns existing PostgreSQL connection
 * Uses singleton pattern to prevent connection exhaustion in development
 */
function getConnection() {
  if (!globalForDb.connection) {
    globalForDb.connection = postgres(process.env.DATABASE_URL!, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  }
  return globalForDb.connection
}

/**
 * Drizzle ORM database instance with full schema typing
 * @example
 * ```ts
 * import { db } from '@factupe/database/client'
 *
 * const tenants = await db.query.tenants.findMany()
 * ```
 */
export const db = drizzle(getConnection(), { schema })

/**
 * Raw PostgreSQL connection for advanced operations
 * Use with caution - prefer db instance for type safety
 */
export const connection = getConnection()

export type Database = typeof db
