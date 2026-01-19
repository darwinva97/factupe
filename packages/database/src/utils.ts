/**
 * Utility functions for database operations
 * @module database/utils
 */

/**
 * Generates a prefixed unique identifier
 * Format: {prefix}_{nanoid}
 * @param prefix - Short prefix to identify the entity type
 * @returns Prefixed unique ID
 * @example
 * ```ts
 * createId('tnt') // => 'tnt_abc123xyz'
 * createId('usr') // => 'usr_def456uvw'
 * ```
 */
export function createId(prefix: string): string {
  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz'
  let id = ''
  for (let i = 0; i < 16; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `${prefix}_${id}`
}

/**
 * Entity ID prefixes used throughout the system
 */
export const ID_PREFIXES = {
  tenant: 'tnt',
  user: 'usr',
  customer: 'cst',
  product: 'prd',
  document: 'doc',
  documentItem: 'itm',
  documentEvent: 'evt',
  series: 'ser',
  session: 'ses',
  apiKey: 'key',
} as const
