/**
 * UI Utilities
 *
 * Helper functions for styling and class management.
 *
 * @module ui/lib/utils
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind CSS conflict resolution
 *
 * @param inputs - Class values to merge
 * @returns Merged class string
 *
 * @example
 * ```ts
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500')
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency for display
 *
 * @param amount - Amount to format
 * @param currency - Currency code (default: PEN)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'PEN'): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date for display
 *
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-PE', options).format(d)
}

/**
 * Format RUC/DNI for display
 *
 * @param documentType - Document type code
 * @param documentNumber - Document number
 * @returns Formatted document string
 */
export function formatDocument(documentType: string, documentNumber: string): string {
  const typeLabels: Record<string, string> = {
    '1': 'DNI',
    '6': 'RUC',
    '7': 'Pasaporte',
    '4': 'C.E.',
    A: 'C.D.',
    '0': '-',
  }
  return `${typeLabels[documentType] || documentType}: ${documentNumber}`
}
