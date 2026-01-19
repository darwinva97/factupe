/**
 * Entity Types
 *
 * Type definitions for business entities.
 *
 * @module types/entities
 */

/**
 * Input for creating a new customer
 */
export interface CreateCustomerInput {
  documentType: string
  documentNumber: string
  name: string
  tradeName?: string
  address?: string
  ubigeo?: string
  email?: string
  phone?: string
  internalCode?: string
  notes?: string
}

/**
 * Input for updating a customer
 */
export interface UpdateCustomerInput {
  name?: string
  tradeName?: string
  address?: string
  ubigeo?: string
  email?: string
  phone?: string
  internalCode?: string
  notes?: string
  isActive?: boolean
}

/**
 * Input for creating a new product
 */
export interface CreateProductInput {
  code: string
  name: string
  description?: string
  unitCode?: string
  unitPrice: number
  currency?: string
  taxType?: string
  category?: string
  brand?: string
  sku?: string
  isService?: boolean
  stockQuantity?: number
  attributes?: Record<string, unknown>
}

/**
 * Input for updating a product
 */
export interface UpdateProductInput {
  code?: string
  name?: string
  description?: string
  unitCode?: string
  unitPrice?: number
  currency?: string
  taxType?: string
  category?: string
  brand?: string
  sku?: string
  isService?: boolean
  stockQuantity?: number
  attributes?: Record<string, unknown>
  isActive?: boolean
}

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  email: string
  password: string
  name: string
  role: string
  permissions?: string[]
}

/**
 * Input for updating a user
 */
export interface UpdateUserInput {
  email?: string
  name?: string
  role?: string
  permissions?: string[]
  isActive?: boolean
}

/**
 * Input for updating tenant settings
 */
export interface UpdateTenantInput {
  name?: string
  tradeName?: string
  address?: string
  ubigeo?: string
  department?: string
  province?: string
  district?: string
  email?: string
  phone?: string
  logoUrl?: string
  settings?: TenantSettings
}

/**
 * Tenant settings structure
 */
export interface TenantSettings {
  currency: string
  timezone: string
  language: string
  invoiceNotes?: string
  termsAndConditions?: string
}

/**
 * SUNAT configuration for tenant
 */
export interface SunatConfig {
  environment: 'beta' | 'production'
  provider: 'direct' | 'nubefact' | 'efact' | string
  providerConfig?: Record<string, unknown>
  certificatePath?: string
  userSol?: string
}

/**
 * Input for creating a document series
 */
export interface CreateSeriesInput {
  documentType: string
  series: string
  description?: string
}

/**
 * Customer summary for lists
 */
export interface CustomerSummary {
  id: string
  documentType: string
  documentNumber: string
  name: string
  email?: string
  phone?: string
  totalDocuments: number
  totalAmount: number
}

/**
 * Product summary for lists
 */
export interface ProductSummary {
  id: string
  code: string
  name: string
  unitPrice: number
  currency: string
  taxType: string
  category?: string
  isService: boolean
  isActive: boolean
}
