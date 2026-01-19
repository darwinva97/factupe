/**
 * @factupe/types
 *
 * Shared TypeScript type definitions for the Factupe system.
 * Provides types for API, documents, and business entities.
 *
 * @packageDocumentation
 * @module types
 *
 * @example
 * ```ts
 * import type { CreateInvoiceInput, ApiResponse } from '@factupe/types'
 *
 * async function createInvoice(data: CreateInvoiceInput): Promise<ApiResponse<Document>> {
 *   // ...
 * }
 * ```
 */

export * from './api'
export * from './documents'
export * from './entities'
