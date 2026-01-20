/**
 * Date Utilities
 *
 * Date formatting functions for SUNAT documents.
 *
 * @module sunat/utils/date
 */

/**
 * Format date for UBL (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format time for UBL (HH:mm:ss)
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Format date and time for UBL
 */
export function formatDateTime(date: Date): { date: string; time: string } {
  return {
    date: formatDate(date),
    time: formatTime(date),
  }
}

/**
 * Parse date string (YYYY-MM-DD) to Date
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get current date in Peru timezone
 */
export function getPeruDate(): Date {
  const now = new Date()
  const peruOffset = -5 * 60 // Peru is UTC-5
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + peruOffset * 60000)
}

/**
 * Check if a date is within the last N days
 */
export function isWithinDays(date: Date, days: number): boolean {
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays <= days
}
