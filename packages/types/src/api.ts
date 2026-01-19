/**
 * API Types
 *
 * Type definitions for API requests and responses.
 *
 * @module types/api
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: ApiMeta
}

/**
 * API error structure
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  validationErrors?: ValidationError[]
}

/**
 * Validation error for form fields
 */
export interface ValidationError {
  field: string
  message: string
  code?: string
}

/**
 * Pagination metadata
 */
export interface ApiMeta {
  page: number
  pageSize: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Common filter parameters
 */
export interface FilterParams {
  search?: string
  startDate?: string
  endDate?: string
  status?: string | string[]
}

/**
 * List request combining pagination and filters
 */
export interface ListRequest extends PaginationParams, FilterParams {}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> {
  items: T[]
  meta: ApiMeta
}

/**
 * Webhook event payload
 */
export interface WebhookEvent<T = unknown> {
  id: string
  type: string
  timestamp: string
  data: T
  tenantId: string
}

/**
 * Webhook event types
 */
export type WebhookEventType =
  | 'document.created'
  | 'document.sent'
  | 'document.accepted'
  | 'document.rejected'
  | 'document.voided'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
