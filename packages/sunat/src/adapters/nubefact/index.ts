/**
 * Nubefact OSE Adapter
 *
 * Integration with Nubefact OSE (Operador de Servicios Electrónicos)
 * for sending electronic documents to SUNAT.
 *
 * @see https://www.nubefact.com/
 * @module sunat/adapters/nubefact
 */

import { BaseSunatAdapter } from '../base'
import type {
  SunatAdapter,
  SunatResponse,
  SunatStatusResponse,
  DocumentWithItems,
  AdapterConfig,
} from '../../types'
import { SUNAT_CATALOGS } from '../../types'

/**
 * Nubefact API URLs
 */
const NUBEFACT_URLS = {
  production: 'https://api.nubefact.com/api/v1',
  demo: 'https://demo.nubefact.com/api/v1',
}

/**
 * Nubefact adapter configuration
 */
export interface NubefactConfig extends AdapterConfig {
  apiKey: string
  apiUrl?: string
}

/**
 * Nubefact API document format
 */
interface NubefactDocument {
  operacion: string
  tipo_de_comprobante: number
  serie: string
  numero: number
  sunat_transaction: number
  cliente_tipo_de_documento: string
  cliente_numero_de_documento: string
  cliente_denominacion: string
  cliente_direccion?: string
  cliente_email?: string
  fecha_de_emision: string
  fecha_de_vencimiento?: string
  moneda: number
  tipo_de_cambio?: number
  porcentaje_de_igv: number
  descuento_global?: number
  total_descuento?: number
  total_anticipo?: number
  total_gravada: number
  total_inafecta?: number
  total_exonerada?: number
  total_igv: number
  total_gratuita?: number
  total_otros_cargos?: number
  total: number
  percepcion_tipo?: number
  percepcion_base_imponible?: number
  total_percepcion?: number
  total_incluido_percepcion?: number
  detraccion?: boolean
  observaciones?: string
  documento_que_se_modifica_tipo?: number
  documento_que_se_modifica_serie?: string
  documento_que_se_modifica_numero?: number
  tipo_de_nota_de_credito?: number
  tipo_de_nota_de_debito?: number
  enviar_automaticamente_a_la_sunat?: boolean
  enviar_automaticamente_al_cliente?: boolean
  codigo_unico?: string
  items: NubefactItem[]
}

interface NubefactItem {
  unidad_de_medida: string
  codigo: string
  descripcion: string
  cantidad: number
  valor_unitario: number
  precio_unitario: number
  descuento?: number
  subtotal: number
  tipo_de_igv: number
  igv: number
  total: number
  anticipo_regularizacion?: boolean
}

interface NubefactResponse {
  sunat_description?: string
  sunat_note?: string
  sunat_responsecode?: string
  sunat_soap_error?: string
  enlace?: string
  enlace_del_pdf?: string
  enlace_del_xml?: string
  enlace_del_cdr?: string
  cadena_para_codigo_qr?: string
  codigo_hash?: string
  aceptada_por_sunat?: boolean
  errors?: string[]
  errores?: string[]
}

/**
 * Nubefact OSE Adapter
 *
 * @example
 * ```ts
 * const adapter = new NubefactAdapter({
 *   environment: 'production',
 *   ruc: '20123456789',
 *   apiKey: 'your-nubefact-api-key',
 * })
 *
 * const response = await adapter.sendDocument(document)
 * ```
 */
export class NubefactAdapter extends BaseSunatAdapter implements SunatAdapter {
  private config: NubefactConfig
  private baseUrl: string

  constructor(config: NubefactConfig) {
    super()
    this.config = config

    if (config.apiUrl) {
      this.baseUrl = config.apiUrl
    } else {
      this.baseUrl = config.environment === 'production'
        ? NUBEFACT_URLS.production
        : NUBEFACT_URLS.demo
    }
  }

  getName(): string {
    return 'nubefact'
  }

  getSupportedDocuments(): string[] {
    return ['01', '03', '07', '08']
  }

  /**
   * Send document to SUNAT via Nubefact
   */
  async sendDocument(document: DocumentWithItems): Promise<SunatResponse> {
    try {
      const nubefactDoc = this.mapToNubefact(document)

      const response = await fetch(`${this.baseUrl}/${this.config.ruc}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(nubefactDoc),
      })

      const result: NubefactResponse = await response.json()

      if (!response.ok || result.errors || result.errores) {
        const errors = result.errors || result.errores || ['Unknown error']
        return {
          success: false,
          status: 'rejected',
          responseCode: result.sunat_responsecode || 'ERROR',
          responseMessage: errors.join(', '),
        }
      }

      return {
        success: result.aceptada_por_sunat === true,
        status: result.aceptada_por_sunat ? 'accepted' : 'rejected',
        responseCode: result.sunat_responsecode || '0',
        responseMessage: result.sunat_description || 'Documento procesado',
        notes: result.sunat_note ? [result.sunat_note] : undefined,
        hash: result.codigo_hash,
      }
    } catch (error) {
      return {
        success: false,
        status: 'exception',
        responseCode: 'ERROR',
        responseMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Query status (Nubefact processes synchronously, so this queries the document)
   */
  async queryStatus(ticket: string): Promise<SunatStatusResponse> {
    // Nubefact doesn't use tickets - documents are processed synchronously
    // The ticket parameter could be used as document ID for querying
    return {
      status: 'accepted',
      responseCode: '0',
      responseMessage: 'Nubefact processes documents synchronously',
    }
  }

  /**
   * Void document
   */
  async voidDocument(document: DocumentWithItems, reason: string): Promise<SunatResponse> {
    try {
      const voidRequest = {
        operacion: 'generar_anulacion',
        tipo_de_comprobante: this.mapDocumentType(document.type),
        serie: document.series,
        numero: parseInt(document.number),
        motivo: reason,
        codigo_unico: document.id,
      }

      const response = await fetch(`${this.baseUrl}/${this.config.ruc}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(voidRequest),
      })

      const result: NubefactResponse = await response.json()

      if (!response.ok || result.errors || result.errores) {
        const errors = result.errors || result.errores || ['Unknown error']
        return {
          success: false,
          status: 'rejected',
          responseCode: 'ERROR',
          responseMessage: errors.join(', '),
        }
      }

      return {
        success: true,
        status: 'accepted',
        responseCode: '0',
        responseMessage: 'Documento anulado correctamente',
      }
    } catch (error) {
      return {
        success: false,
        status: 'exception',
        responseCode: 'ERROR',
        responseMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // === Private methods ===

  private mapToNubefact(doc: DocumentWithItems): NubefactDocument {
    const isNote = doc.type === '07' || doc.type === '08'
    const issueDate = doc.issueDate instanceof Date
      ? doc.issueDate.toISOString().split('T')[0]
      : doc.issueDate

    const nubefactDoc: NubefactDocument = {
      operacion: 'generar_comprobante',
      tipo_de_comprobante: this.mapDocumentType(doc.type),
      serie: doc.series,
      numero: parseInt(doc.number),
      sunat_transaction: this.mapOperationType(doc.operationType || '0101'),
      cliente_tipo_de_documento: this.mapIdentityType(doc.customer?.documentType || '6'),
      cliente_numero_de_documento: doc.customer?.documentNumber || '',
      cliente_denominacion: doc.customer?.name || '',
      cliente_direccion: doc.customer?.address || undefined,
      fecha_de_emision: issueDate.replace(/-/g, '-'),
      fecha_de_vencimiento: doc.dueDate
        ? (doc.dueDate instanceof Date ? doc.dueDate.toISOString().split('T')[0] : doc.dueDate)
        : undefined,
      moneda: this.mapCurrency(doc.currency),
      tipo_de_cambio: doc.exchangeRate ? parseFloat(doc.exchangeRate) : undefined,
      porcentaje_de_igv: 18,
      descuento_global: parseFloat(doc.globalDiscount || '0') || undefined,
      total_gravada: parseFloat(doc.taxableAmount),
      total_exonerada: parseFloat(doc.exemptAmount || '0') || undefined,
      total_inafecta: parseFloat(doc.unaffectedAmount || '0') || undefined,
      total_gratuita: parseFloat(doc.freeAmount || '0') || undefined,
      total_igv: parseFloat(doc.igv),
      total: parseFloat(doc.total),
      observaciones: doc.observations || undefined,
      enviar_automaticamente_a_la_sunat: true,
      enviar_automaticamente_al_cliente: false,
      codigo_unico: doc.id,
      items: this.mapItems(doc.items),
    }

    // Add reference document info for notes
    if (isNote && doc.referenceDocumentNumber) {
      const [refSeries, refNumber] = doc.referenceDocumentNumber.split('-')
      nubefactDoc.documento_que_se_modifica_tipo = this.mapDocumentType(doc.referenceDocumentType || '01')
      nubefactDoc.documento_que_se_modifica_serie = refSeries
      nubefactDoc.documento_que_se_modifica_numero = parseInt(refNumber)

      if (doc.type === '07') {
        nubefactDoc.tipo_de_nota_de_credito = this.mapCreditNoteReason(doc.noteReasonCode || '01')
      } else if (doc.type === '08') {
        nubefactDoc.tipo_de_nota_de_debito = this.mapDebitNoteReason(doc.noteReasonCode || '01')
      }
    }

    return nubefactDoc
  }

  private mapItems(items: DocumentWithItems['items']): NubefactItem[] {
    return items.map((item) => {
      const quantity = parseFloat(item.quantity)
      const unitPrice = parseFloat(item.unitPrice)
      const discount = parseFloat(item.discount || '0')
      const subtotal = parseFloat(item.subtotal)
      const taxAmount = parseFloat(item.taxAmount)
      const total = parseFloat(item.total)

      return {
        unidad_de_medida: item.unitCode || 'NIU',
        codigo: item.productId || 'PROD',
        descripcion: item.description,
        cantidad: quantity,
        valor_unitario: unitPrice,
        precio_unitario: unitPrice * 1.18, // With IGV
        descuento: discount || undefined,
        subtotal,
        tipo_de_igv: this.mapTaxType(item.taxType || '10'),
        igv: taxAmount,
        total,
      }
    })
  }

  private mapDocumentType(type: string): number {
    const map: Record<string, number> = {
      '01': 1, // Factura
      '03': 2, // Boleta
      '07': 3, // Nota de Crédito
      '08': 4, // Nota de Débito
    }
    return map[type] || 1
  }

  private mapIdentityType(type: string): string {
    const map: Record<string, string> = {
      '0': '0', // Sin documento
      '1': '1', // DNI
      '4': '4', // Carnet de extranjería
      '6': '6', // RUC
      '7': '7', // Pasaporte
      'A': 'A', // Cédula diplomática
    }
    return map[type] || '6'
  }

  private mapCurrency(currency: string): number {
    const map: Record<string, number> = {
      'PEN': 1,
      'USD': 2,
      'EUR': 3,
    }
    return map[currency] || 1
  }

  private mapOperationType(type: string): number {
    const map: Record<string, number> = {
      '0101': 1, // Venta interna
      '0200': 2, // Exportación
      '0401': 4, // Anticipos
    }
    return map[type] || 1
  }

  private mapTaxType(type: string): number {
    const map: Record<string, number> = {
      '10': 1, // Gravado
      '11': 2, // Gravado gratuito
      '20': 8, // Exonerado
      '30': 9, // Inafecto
    }
    return map[type] || 1
  }

  private mapCreditNoteReason(code: string): number {
    const map: Record<string, number> = {
      '01': 1, // Anulación
      '02': 2, // Corrección por error
      '03': 3, // Descuento global
      '04': 4, // Descuento por ítem
      '05': 5, // Devolución total
      '06': 6, // Devolución parcial
      '07': 7, // Bonificación
      '09': 9, // Otros
    }
    return map[code] || 1
  }

  private mapDebitNoteReason(code: string): number {
    const map: Record<string, number> = {
      '01': 1, // Intereses por mora
      '02': 2, // Aumento de valor
      '03': 3, // Penalidades
    }
    return map[code] || 1
  }
}
