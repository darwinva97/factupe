/**
 * Number to Words Converter (Spanish)
 *
 * Converts numeric amounts to words in Spanish for SUNAT documents.
 *
 * @module sunat/utils/number-to-words
 */

const UNITS = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
const TENS = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
const TEENS = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
const TWENTIES = ['VEINTE', 'VEINTIUNO', 'VEINTIDOS', 'VEINTITRES', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISEIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE']
const HUNDREDS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

const CURRENCY_NAMES: Record<string, { singular: string; plural: string; cents: string }> = {
  PEN: { singular: 'SOL', plural: 'SOLES', cents: 'CENTIMOS' },
  USD: { singular: 'DOLAR', plural: 'DOLARES', cents: 'CENTAVOS' },
  EUR: { singular: 'EURO', plural: 'EUROS', cents: 'CENTIMOS' },
}

function convertHundreds(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'CIEN'

  const hundreds = Math.floor(n / 100)
  const remainder = n % 100

  let result = HUNDREDS[hundreds]
  if (remainder > 0) {
    result += (result ? ' ' : '') + convertTens(remainder)
  }

  return result
}

function convertTens(n: number): string {
  if (n === 0) return ''
  if (n < 10) return UNITS[n]
  if (n < 20) return TEENS[n - 10]
  if (n < 30) return TWENTIES[n - 20]

  const tens = Math.floor(n / 10)
  const units = n % 10

  if (units === 0) return TENS[tens]
  return `${TENS[tens]} Y ${UNITS[units]}`
}

function convertThousands(n: number): string {
  if (n === 0) return ''
  if (n === 1000) return 'MIL'

  const thousands = Math.floor(n / 1000)
  const remainder = n % 1000

  let result = ''
  if (thousands === 1) {
    result = 'MIL'
  } else if (thousands > 0) {
    result = convertHundreds(thousands) + ' MIL'
  }

  if (remainder > 0) {
    result += (result ? ' ' : '') + convertHundreds(remainder)
  }

  return result
}

function convertMillions(n: number): string {
  if (n === 0) return 'CERO'

  const millions = Math.floor(n / 1000000)
  const remainder = n % 1000000

  let result = ''
  if (millions === 1) {
    result = 'UN MILLON'
  } else if (millions > 0) {
    result = convertThousands(millions) + ' MILLONES'
  }

  if (remainder > 0) {
    result += (result ? ' ' : '') + convertThousands(remainder)
  }

  return result || 'CERO'
}

/**
 * Convert a number to words in Spanish
 *
 * @param amount - The amount to convert
 * @param currency - Currency code (PEN, USD, EUR)
 * @returns Amount in words
 *
 * @example
 * ```ts
 * numberToWords(1234.56, 'PEN')
 * // => "MIL DOSCIENTOS TREINTA Y CUATRO CON 56/100 SOLES"
 * ```
 */
export function numberToWords(amount: number, currency = 'PEN'): string {
  const currencyInfo = CURRENCY_NAMES[currency] || CURRENCY_NAMES.PEN

  const integerPart = Math.floor(amount)
  const decimalPart = Math.round((amount - integerPart) * 100)

  const integerWords = convertMillions(integerPart)
  const currencyName = integerPart === 1 ? currencyInfo.singular : currencyInfo.plural
  const decimalStr = decimalPart.toString().padStart(2, '0')

  return `${integerWords} CON ${decimalStr}/100 ${currencyName}`
}

export default numberToWords
