/**
 * SUNAT Validators
 *
 * Validation functions for SUNAT documents.
 *
 * @module sunat/validators
 */

import { z } from 'zod'
import { SUNAT_CATALOGS } from '../types'

/**
 * RUC validation schema
 */
export const rucSchema = z
  .string()
  .length(11, 'El RUC debe tener 11 digitos')
  .regex(/^[0-9]+$/, 'El RUC solo debe contener numeros')
  .refine(validateRuc, 'RUC invalido')

/**
 * DNI validation schema
 */
export const dniSchema = z
  .string()
  .length(8, 'El DNI debe tener 8 digitos')
  .regex(/^[0-9]+$/, 'El DNI solo debe contener numeros')

/**
 * Document number validation based on type
 */
export function validateDocumentNumber(type: string, number: string): boolean {
  switch (type) {
    case SUNAT_CATALOGS.IDENTITY_TYPES.RUC:
      return rucSchema.safeParse(number).success
    case SUNAT_CATALOGS.IDENTITY_TYPES.DNI:
      return dniSchema.safeParse(number).success
    case SUNAT_CATALOGS.IDENTITY_TYPES.SIN_DOCUMENTO:
      return number === '-' || number === ''
    default:
      return number.length > 0
  }
}

/**
 * Validate RUC checksum
 */
export function validateRuc(ruc: string): boolean {
  if (!/^[0-9]{11}$/.test(ruc)) {
    return false
  }

  // RUC must start with 10, 15, 17, or 20
  const validPrefixes = ['10', '15', '17', '20']
  if (!validPrefixes.some((prefix) => ruc.startsWith(prefix))) {
    return false
  }

  // Validate checksum
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let sum = 0

  for (let i = 0; i < 10; i++) {
    sum += parseInt(ruc[i]!, 10) * weights[i]!
  }

  const remainder = sum % 11
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 1 : 11 - remainder

  return checkDigit === parseInt(ruc[10]!, 10)
}

/**
 * Invoice item validation schema
 */
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'La descripcion es requerida'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number().min(0, 'El precio no puede ser negativo'),
  unitCode: z.string().min(1, 'El codigo de unidad es requerido'),
  taxType: z.string().min(1, 'El tipo de IGV es requerido'),
})

/**
 * Invoice validation schema
 */
export const invoiceSchema = z.object({
  series: z
    .string()
    .regex(/^[FB][A-Z0-9]{3}$/, 'La serie debe ser F### o B### (4 caracteres)'),
  customerId: z.string().optional(),
  customer: z
    .object({
      documentType: z.string(),
      documentNumber: z.string(),
      name: z.string().min(1),
      address: z.string().optional(),
    })
    .optional(),
  items: z.array(invoiceItemSchema).min(1, 'Debe tener al menos un item'),
  currency: z.string().default('PEN'),
  observations: z.string().optional(),
})

/**
 * Credit note validation schema
 */
export const creditNoteSchema = z.object({
  series: z
    .string()
    .regex(/^[FB]C[A-Z0-9]{2}$/, 'La serie de NC debe ser FC## o BC## (4 caracteres)'),
  referenceDocumentId: z.string().min(1, 'El documento de referencia es requerido'),
  reasonCode: z.enum(
    Object.values(SUNAT_CATALOGS.CREDIT_NOTE_REASONS) as [string, ...string[]]
  ),
  reasonDescription: z.string().min(1, 'El motivo es requerido'),
  items: z.array(invoiceItemSchema).optional(),
})

/**
 * Debit note validation schema
 */
export const debitNoteSchema = z.object({
  series: z
    .string()
    .regex(/^[FB]D[A-Z0-9]{2}$/, 'La serie de ND debe ser FD## o BD## (4 caracteres)'),
  referenceDocumentId: z.string().min(1, 'El documento de referencia es requerido'),
  reasonCode: z.enum(
    Object.values(SUNAT_CATALOGS.DEBIT_NOTE_REASONS) as [string, ...string[]]
  ),
  reasonDescription: z.string().min(1, 'El motivo es requerido'),
  items: z.array(invoiceItemSchema).min(1, 'Debe tener al menos un item'),
})

/**
 * Validate document totals
 */
export function validateTotals(document: {
  items: Array<{
    taxableBase: number | string
    igvAmount: number | string
    total: number | string
  }>
  taxableAmount: number | string
  igv: number | string
  total: number | string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Calculate expected totals from items
  let expectedTaxable = 0
  let expectedIgv = 0
  let expectedTotal = 0

  for (const item of document.items) {
    expectedTaxable += Number(item.taxableBase)
    expectedIgv += Number(item.igvAmount)
    expectedTotal += Number(item.total)
  }

  // Compare with document totals (allowing small rounding differences)
  const tolerance = 0.01

  if (Math.abs(expectedTaxable - Number(document.taxableAmount)) > tolerance) {
    errors.push(
      `Base imponible no coincide: esperado ${expectedTaxable.toFixed(2)}, actual ${Number(document.taxableAmount).toFixed(2)}`
    )
  }

  if (Math.abs(expectedIgv - Number(document.igv)) > tolerance) {
    errors.push(
      `IGV no coincide: esperado ${expectedIgv.toFixed(2)}, actual ${Number(document.igv).toFixed(2)}`
    )
  }

  if (Math.abs(expectedTotal - Number(document.total)) > tolerance) {
    errors.push(
      `Total no coincide: esperado ${expectedTotal.toFixed(2)}, actual ${Number(document.total).toFixed(2)}`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
