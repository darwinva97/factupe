/**
 * SUNAT Builders
 *
 * XML builders for SUNAT electronic documents.
 *
 * @module sunat/builders
 */

export { UBLBuilder } from './ubl-builder'

import type { DocumentWithItems, UBLDocumentData, UBLLineItem } from '../types'
import { SUNAT_CATALOGS } from '../types'
import { UBLBuilder } from './ubl-builder'

/**
 * Transform database document to UBL data format
 */
export function documentToUBLData(document: DocumentWithItems): UBLDocumentData {
  const now = new Date()
  const issueDate = document.issueDate
    ? new Date(document.issueDate).toISOString().split('T')[0]
    : now.toISOString().split('T')[0]
  const issueTime = now.toTimeString().split(' ')[0]

  const items: UBLLineItem[] = document.items.map((item, index) => {
    const quantity = Number(item.quantity)
    const unitPrice = Number(item.unitPrice)
    const taxableAmount = Number(item.taxableBase)
    const taxAmount = Number(item.igvAmount)
    const igvPercentage = Number(item.igvPercentage)

    // Calculate unit price with tax
    const unitPriceWithTax = unitPrice * (1 + igvPercentage / 100)

    return {
      id: index + 1,
      quantity,
      unitCode: item.unitCode,
      description: item.description,
      unitPrice,
      unitPriceWithTax,
      taxableAmount,
      taxAmount,
      taxType: item.taxType,
      igvPercentage,
      total: Number(item.total),
      isFree: item.isFree === 'true',
      priceTypeCode: item.isFree === 'true' ? '02' : '01',
    }
  })

  return {
    // Issuer
    issuerRuc: document.tenant?.ruc || '',
    issuerName: document.tenant?.name || '',
    issuerTradeName: document.tenant?.tradeName || undefined,
    issuerAddress: document.tenant?.address || undefined,
    issuerUbigeo: document.tenant?.ubigeo || undefined,

    // Document
    documentType: document.type,
    series: document.series,
    number: document.number,
    issueDate,
    issueTime,
    dueDate: document.dueDate
      ? new Date(document.dueDate).toISOString().split('T')[0]
      : undefined,

    // Currency
    currency: document.currency,
    exchangeRate: document.exchangeRate ? Number(document.exchangeRate) : undefined,

    // Customer
    customerDocumentType: document.customer?.documentType || '0',
    customerDocumentNumber: document.customer?.documentNumber || '-',
    customerName: document.customer?.name || 'VARIOS',
    customerAddress: document.customer?.address || undefined,

    // Totals
    taxableAmount: Number(document.taxableAmount),
    exemptAmount: Number(document.exemptAmount || 0),
    unaffectedAmount: Number(document.unaffectedAmount || 0),
    freeAmount: Number(document.freeAmount || 0),
    igvAmount: Number(document.igv),
    iscAmount: Number(document.isc || 0),
    otherTaxes: Number(document.otherTaxes || 0),
    globalDiscount: Number(document.globalDiscount || 0),
    otherCharges: Number(document.otherCharges || 0),
    total: Number(document.total),

    // Operation
    operationType: document.operationType || '0101',

    // Items
    items,

    // Notes
    observations: document.observations || undefined,

    // For credit/debit notes
    referenceDocumentType: document.referenceDocumentType || undefined,
    referenceDocumentNumber: document.referenceDocumentNumber || undefined,
    noteReasonCode: document.noteReasonCode || undefined,
    noteReasonDescription: document.noteReasonDescription || undefined,

    // Legends (amount in words)
    legends: [
      {
        code: '1000',
        value: numberToWords(Number(document.total), document.currency),
      },
    ],
  }
}

/**
 * Build XML for a document
 */
export function buildDocumentXML(document: DocumentWithItems): string {
  const builder = new UBLBuilder()
  const ublData = documentToUBLData(document)

  switch (document.type) {
    case SUNAT_CATALOGS.DOCUMENT_TYPES.FACTURA:
    case SUNAT_CATALOGS.DOCUMENT_TYPES.BOLETA:
      return builder.buildInvoice(ublData)

    case SUNAT_CATALOGS.DOCUMENT_TYPES.NOTA_CREDITO:
      return builder.buildCreditNote(ublData)

    case SUNAT_CATALOGS.DOCUMENT_TYPES.NOTA_DEBITO:
      return builder.buildDebitNote(ublData)

    default:
      throw new Error(`Unsupported document type: ${document.type}`)
  }
}

/**
 * Convert number to words (Spanish)
 * Simplified version - should be expanded for production
 */
function numberToWords(amount: number, currency: string): string {
  const currencyNames: Record<string, string> = {
    PEN: 'SOLES',
    USD: 'DOLARES AMERICANOS',
    EUR: 'EUROS',
  }

  const integerPart = Math.floor(amount)
  const decimalPart = Math.round((amount - integerPart) * 100)

  // Simplified - in production use a proper number-to-words library
  return `${integerPart.toLocaleString('es-PE')} CON ${decimalPart.toString().padStart(2, '0')}/100 ${currencyNames[currency] || currency}`
}
