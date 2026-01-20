/**
 * @factupe/sdk
 *
 * Official SDK for integrating with the Factupe billing API.
 * Provides a type-safe client for creating invoices, managing customers, and more.
 *
 * @packageDocumentation
 * @module sdk
 *
 * @example
 * ```ts
 * import { FactupeClient } from '@factupe/sdk'
 *
 * const client = new FactupeClient({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'https://api.factupe.com',
 * })
 *
 * // Create an invoice
 * const invoice = await client.invoices.create({
 *   customerId: 'cst_123',
 *   series: 'F001',
 *   items: [
 *     { description: 'Product A', quantity: 2, unitPrice: 100 }
 *   ]
 * })
 *
 * // List customers
 * const customers = await client.customers.list({ page: 1, pageSize: 10 })
 * ```
 */

import type {
  ApiResponse,
  PaginatedResponse,
  ListRequest,
  CreateInvoiceInput,
  CreateCreditNoteInput,
  CreateDebitNoteInput,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateProductInput,
  UpdateProductInput,
} from '@factupe/types'

/**
 * SDK Configuration
 */
export interface FactupeClientConfig {
  /**
   * API Key for authentication
   */
  apiKey: string

  /**
   * Base URL of the Factupe API
   * @default 'https://api.factupe.com'
   */
  baseUrl?: string

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number
}

/**
 * HTTP request options
 */
interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
}

/**
 * Factupe API Client
 *
 * Main client for interacting with the Factupe billing API.
 */
export class FactupeClient {
  private config: Required<FactupeClientConfig>

  constructor(config: FactupeClientConfig) {
    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.factupe.com',
      timeout: config.timeout || 30000,
    }
  }

  /**
   * Invoices resource
   */
  invoices = {
    /**
     * Create a new invoice
     */
    create: (data: CreateInvoiceInput) =>
      this.request<ApiResponse<{ id: string }>>({
        method: 'POST',
        path: '/invoices',
        body: data,
      }),

    /**
     * Get an invoice by ID
     */
    get: (id: string) =>
      this.request<ApiResponse<unknown>>({
        method: 'GET',
        path: `/invoices/${id}`,
      }),

    /**
     * List invoices
     */
    list: (params?: ListRequest) =>
      this.request<PaginatedResponse<unknown>>({
        method: 'GET',
        path: '/invoices',
        params: params as Record<string, string | number | boolean | undefined>,
      }),

    /**
     * Download invoice PDF
     */
    downloadPdf: (id: string) =>
      this.request<Blob>({
        method: 'GET',
        path: `/invoices/${id}/pdf`,
      }),

    /**
     * Download invoice XML
     */
    downloadXml: (id: string) =>
      this.request<string>({
        method: 'GET',
        path: `/invoices/${id}/xml`,
      }),

    /**
     * Void an invoice
     */
    void: (id: string, reason: string) =>
      this.request<ApiResponse<{ success: boolean }>>({
        method: 'POST',
        path: `/invoices/${id}/void`,
        body: { reason },
      }),

    /**
     * Resend invoice to SUNAT
     */
    resend: (id: string) =>
      this.request<ApiResponse<{ success: boolean }>>({
        method: 'POST',
        path: `/invoices/${id}/resend`,
      }),
  }

  /**
   * Credit Notes resource
   */
  creditNotes = {
    /**
     * Create a new credit note
     */
    create: (data: CreateCreditNoteInput) =>
      this.request<ApiResponse<{ id: string }>>({
        method: 'POST',
        path: '/credit-notes',
        body: data,
      }),

    /**
     * Get a credit note by ID
     */
    get: (id: string) =>
      this.request<ApiResponse<unknown>>({
        method: 'GET',
        path: `/credit-notes/${id}`,
      }),

    /**
     * List credit notes
     */
    list: (params?: ListRequest) =>
      this.request<PaginatedResponse<unknown>>({
        method: 'GET',
        path: '/credit-notes',
        params: params as Record<string, string | number | boolean | undefined>,
      }),
  }

  /**
   * Debit Notes resource
   */
  debitNotes = {
    /**
     * Create a new debit note
     */
    create: (data: CreateDebitNoteInput) =>
      this.request<ApiResponse<{ id: string }>>({
        method: 'POST',
        path: '/debit-notes',
        body: data,
      }),

    /**
     * Get a debit note by ID
     */
    get: (id: string) =>
      this.request<ApiResponse<unknown>>({
        method: 'GET',
        path: `/debit-notes/${id}`,
      }),

    /**
     * List debit notes
     */
    list: (params?: ListRequest) =>
      this.request<PaginatedResponse<unknown>>({
        method: 'GET',
        path: '/debit-notes',
        params: params as Record<string, string | number | boolean | undefined>,
      }),
  }

  /**
   * Customers resource
   */
  customers = {
    /**
     * Create a new customer
     */
    create: (data: CreateCustomerInput) =>
      this.request<ApiResponse<{ id: string }>>({
        method: 'POST',
        path: '/customers',
        body: data,
      }),

    /**
     * Get a customer by ID
     */
    get: (id: string) =>
      this.request<ApiResponse<unknown>>({
        method: 'GET',
        path: `/customers/${id}`,
      }),

    /**
     * List customers
     */
    list: (params?: ListRequest) =>
      this.request<PaginatedResponse<unknown>>({
        method: 'GET',
        path: '/customers',
        params: params as Record<string, string | number | boolean | undefined>,
      }),

    /**
     * Update a customer
     */
    update: (id: string, data: UpdateCustomerInput) =>
      this.request<ApiResponse<{ success: boolean }>>({
        method: 'PATCH',
        path: `/customers/${id}`,
        body: data,
      }),

    /**
     * Delete a customer
     */
    delete: (id: string) =>
      this.request<ApiResponse<{ success: boolean }>>({
        method: 'DELETE',
        path: `/customers/${id}`,
      }),
  }

  /**
   * Products resource
   */
  products = {
    /**
     * Create a new product
     */
    create: (data: CreateProductInput) =>
      this.request<ApiResponse<{ id: string }>>({
        method: 'POST',
        path: '/products',
        body: data,
      }),

    /**
     * Get a product by ID
     */
    get: (id: string) =>
      this.request<ApiResponse<unknown>>({
        method: 'GET',
        path: `/products/${id}`,
      }),

    /**
     * List products
     */
    list: (params?: ListRequest) =>
      this.request<PaginatedResponse<unknown>>({
        method: 'GET',
        path: '/products',
        params: params as Record<string, string | number | boolean | undefined>,
      }),

    /**
     * Update a product
     */
    update: (id: string, data: UpdateProductInput) =>
      this.request<ApiResponse<{ success: boolean }>>({
        method: 'PATCH',
        path: `/products/${id}`,
        body: data,
      }),

    /**
     * Delete a product
     */
    delete: (id: string) =>
      this.request<ApiResponse<{ success: boolean }>>({
        method: 'DELETE',
        path: `/products/${id}`,
      }),
  }

  /**
   * Webhooks utilities
   */
  webhooks = {
    /**
     * Verify webhook signature
     */
    verify: (payload: string, signature: string, secret: string): boolean => {
      // Simple HMAC verification
      // In production, use crypto.subtle or node crypto
      const encoder = new TextEncoder()
      const data = encoder.encode(payload)
      const key = encoder.encode(secret)

      // This is a placeholder - implement proper HMAC verification
      return signature.length > 0 && payload.length > 0 && secret.length > 0
    },

    /**
     * Parse webhook payload
     */
    parse: <T>(payload: string): T => {
      return JSON.parse(payload) as T
    },
  }

  /**
   * Make HTTP request to API
   */
  private async request<T>(options: RequestOptions): Promise<T> {
    const url = new URL(options.path, this.config.baseUrl)

    // Add query parameters
    if (options.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      }
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    const response = await fetch(url.toString(), {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(this.config.timeout),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { message?: string; code?: string; details?: unknown }
      throw new FactupeApiError(
        response.status,
        error.message || 'API request failed',
        error.code,
        error.details
      )
    }

    // Handle different response types
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>
    }

    if (contentType?.includes('application/pdf') || contentType?.includes('application/octet-stream')) {
      return response.blob() as Promise<T>
    }

    return response.text() as Promise<T>
  }
}

/**
 * API Error class
 */
export class FactupeApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'FactupeApiError'
  }
}

/**
 * Create a Factupe client instance
 */
export function createClient(config: FactupeClientConfig): FactupeClient {
  return new FactupeClient(config)
}
