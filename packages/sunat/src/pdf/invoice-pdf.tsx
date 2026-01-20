/**
 * Invoice PDF Generator
 *
 * Generates PDF representation of electronic documents
 * using @react-pdf/renderer.
 *
 * @module sunat/pdf/invoice-pdf
 */

import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'
import type { DocumentWithItems } from '../types'
import { numberToWords } from '../utils/number-to-words'

// Register fonts (optional - uses system fonts by default)
// Font.register({ family: 'Roboto', src: '/fonts/Roboto-Regular.ttf' })

/**
 * PDF Styles
 */
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 200,
    border: '2px solid #dc2626',
    padding: 10,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 5,
  },
  documentNumber: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  ruc: {
    fontSize: 10,
    marginTop: 5,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 5,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 100,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    color: '#fff',
    padding: 5,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 5,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    padding: 5,
    backgroundColor: '#f9fafb',
  },
  colItem: { width: '8%', textAlign: 'center' },
  colDesc: { width: '35%' },
  colUnit: { width: '10%', textAlign: 'center' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '12%', textAlign: 'right' },
  colDisc: { width: '10%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  totalsSection: {
    marginTop: 20,
    flexDirection: 'row',
  },
  totalsLeft: {
    flex: 1,
    paddingRight: 20,
  },
  totalsRight: {
    width: 250,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 3,
    borderBottom: '1px solid #e5e7eb',
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    backgroundColor: '#374151',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  amountInWords: {
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 10,
    padding: 5,
    backgroundColor: '#f3f4f6',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#666',
  },
  qrCode: {
    width: 80,
    height: 80,
  },
  observations: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#fef3c7',
    fontSize: 8,
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    transform: 'rotate(-45deg)',
    fontSize: 60,
    color: '#e5e7eb',
    opacity: 0.5,
  },
})

/**
 * Document type names
 */
const DOCUMENT_TYPE_NAMES: Record<string, string> = {
  '01': 'FACTURA ELECTRÓNICA',
  '03': 'BOLETA DE VENTA ELECTRÓNICA',
  '07': 'NOTA DE CRÉDITO ELECTRÓNICA',
  '08': 'NOTA DE DÉBITO ELECTRÓNICA',
}

/**
 * Format currency
 */
function formatCurrency(amount: number | string, currency = 'PEN'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  const symbol = currency === 'PEN' ? 'S/' : currency === 'USD' ? '$' : '€'
  return `${symbol} ${num.toFixed(2)}`
}

/**
 * Format date
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

interface InvoicePDFProps {
  document: DocumentWithItems
  qrCodeDataUrl?: string
  showWatermark?: boolean
  watermarkText?: string
}

/**
 * Invoice PDF Component
 */
export function InvoicePDF({
  document: doc,
  qrCodeDataUrl,
  showWatermark = false,
  watermarkText = 'BORRADOR',
}: InvoicePDFProps) {
  const isNote = doc.type === '07' || doc.type === '08'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {showWatermark && <Text style={styles.watermark}>{watermarkText}</Text>}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{doc.tenant?.name || 'EMPRESA'}</Text>
            {doc.tenant?.tradeName && (
              <Text style={styles.companyInfo}>{doc.tenant.tradeName}</Text>
            )}
            <Text style={styles.companyInfo}>{doc.tenant?.address || '-'}</Text>
            <Text style={styles.companyInfo}>
              Teléfono: - | Email: -
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.ruc}>RUC: {doc.tenant?.ruc || '-'}</Text>
            <Text style={styles.documentType}>
              {DOCUMENT_TYPE_NAMES[doc.type] || 'COMPROBANTE'}
            </Text>
            <Text style={styles.documentNumber}>
              {doc.series}-{doc.number}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Cliente:</Text>
            <Text style={styles.value}>{doc.customer?.name || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {doc.customer?.documentType === '6' ? 'RUC:' : 'DNI:'}
            </Text>
            <Text style={styles.value}>{doc.customer?.documentNumber || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{doc.customer?.address || '-'}</Text>
          </View>
        </View>

        {/* Document Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Fecha Emisión:</Text>
            <Text style={styles.value}>{formatDate(doc.issueDate)}</Text>
            <Text style={styles.label}>Moneda:</Text>
            <Text style={styles.value}>{doc.currency}</Text>
          </View>
          {doc.dueDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Fecha Vencimiento:</Text>
              <Text style={styles.value}>{formatDate(doc.dueDate)}</Text>
            </View>
          )}
          {isNote && doc.referenceDocumentNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Doc. Referencia:</Text>
              <Text style={styles.value}>{doc.referenceDocumentNumber}</Text>
              <Text style={styles.label}>Motivo:</Text>
              <Text style={styles.value}>{doc.noteReasonDescription || '-'}</Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colItem}>ITEM</Text>
            <Text style={styles.colDesc}>DESCRIPCIÓN</Text>
            <Text style={styles.colUnit}>UNIDAD</Text>
            <Text style={styles.colQty}>CANT.</Text>
            <Text style={styles.colPrice}>P. UNIT.</Text>
            <Text style={styles.colDisc}>DESC.</Text>
            <Text style={styles.colTotal}>TOTAL</Text>
          </View>
          {doc.items.map((item, index) => (
            <View
              key={item.id}
              style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
            >
              <Text style={styles.colItem}>{index + 1}</Text>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colUnit}>{item.unitCode || 'NIU'}</Text>
              <Text style={styles.colQty}>{parseFloat(item.quantity).toFixed(2)}</Text>
              <Text style={styles.colPrice}>
                {formatCurrency(item.unitPrice, doc.currency)}
              </Text>
              <Text style={styles.colDisc}>
                {parseFloat(item.discount || '0') > 0
                  ? formatCurrency(item.discount!, doc.currency)
                  : '-'}
              </Text>
              <Text style={styles.colTotal}>
                {formatCurrency(item.total, doc.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsLeft}>
            {/* QR Code */}
            {qrCodeDataUrl && <Image style={styles.qrCode} src={qrCodeDataUrl} />}

            {/* Amount in words */}
            <Text style={styles.amountInWords}>
              SON: {numberToWords(parseFloat(doc.total), doc.currency)}
            </Text>

            {/* Observations */}
            {doc.observations && (
              <View style={styles.observations}>
                <Text>Observaciones: {doc.observations}</Text>
              </View>
            )}
          </View>

          <View style={styles.totalsRight}>
            {parseFloat(doc.taxableAmount) > 0 && (
              <View style={styles.totalRow}>
                <Text>Op. Gravadas:</Text>
                <Text>{formatCurrency(doc.taxableAmount, doc.currency)}</Text>
              </View>
            )}
            {parseFloat(doc.exemptAmount || '0') > 0 && (
              <View style={styles.totalRow}>
                <Text>Op. Exoneradas:</Text>
                <Text>{formatCurrency(doc.exemptAmount!, doc.currency)}</Text>
              </View>
            )}
            {parseFloat(doc.unaffectedAmount || '0') > 0 && (
              <View style={styles.totalRow}>
                <Text>Op. Inafectas:</Text>
                <Text>{formatCurrency(doc.unaffectedAmount!, doc.currency)}</Text>
              </View>
            )}
            {parseFloat(doc.freeAmount || '0') > 0 && (
              <View style={styles.totalRow}>
                <Text>Op. Gratuitas:</Text>
                <Text>{formatCurrency(doc.freeAmount!, doc.currency)}</Text>
              </View>
            )}
            {parseFloat(doc.globalDiscount || '0') > 0 && (
              <View style={styles.totalRow}>
                <Text>Descuento Global:</Text>
                <Text>-{formatCurrency(doc.globalDiscount!, doc.currency)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text>IGV (18%):</Text>
              <Text>{formatCurrency(doc.igv, doc.currency)}</Text>
            </View>
            {parseFloat(doc.otherCharges || '0') > 0 && (
              <View style={styles.totalRow}>
                <Text>Otros Cargos:</Text>
                <Text>{formatCurrency(doc.otherCharges!, doc.currency)}</Text>
              </View>
            )}
            <View style={styles.totalRowFinal}>
              <Text>TOTAL:</Text>
              <Text>{formatCurrency(doc.total, doc.currency)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Hash: {doc.hashCode || '-'}
          </Text>
          <Text>
            Representación impresa de {DOCUMENT_TYPE_NAMES[doc.type] || 'Comprobante Electrónico'}
          </Text>
          <Text>
            Generado por Factupe
          </Text>
        </View>
      </Page>
    </Document>
  )
}

/**
 * Generate PDF buffer from document
 */
export async function generateInvoicePDF(
  doc: DocumentWithItems,
  options?: {
    qrCodeDataUrl?: string
    showWatermark?: boolean
    watermarkText?: string
  }
): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer')

  return renderToBuffer(
    <InvoicePDF
      document={doc}
      qrCodeDataUrl={options?.qrCodeDataUrl}
      showWatermark={options?.showWatermark}
      watermarkText={options?.watermarkText}
    />
  )
}

export default InvoicePDF
