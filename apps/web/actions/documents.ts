'use server'

/**
 * Document Server Actions
 *
 * Server-side actions for managing electronic documents.
 * Uses Next.js `after` for background processing (SUNAT submission).
 *
 * @module actions/documents
 */

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { z } from 'zod'
import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '@factupe/database/client'
import {
  documents,
  documentItems,
  documentEvents,
  documentSeries,
  customers,
  products,
} from '@factupe/database/schema'
import { auth } from '@factupe/auth/config'
import { createAdapter, buildDocumentXML, validateTotals } from '@factupe/sunat'
import { sendEvent } from '@factupe/realtime'
import type { SunatDocumentType } from '@factupe/database/schema'

/**
 * Serialize data for client transfer
 * Next.js cannot serialize Date objects across the server-client boundary
 */
function serialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, value) =>
    value instanceof Date ? value.toISOString() : value
  ))
}

/**
 * Document item input schema
 */
const documentItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Descripción requerida'),
  quantity: z.number().positive('Cantidad debe ser positiva'),
  unitCode: z.string().default('NIU'),
  unitPrice: z.number().min(0, 'Precio debe ser >= 0'),
  discount: z.number().min(0).default(0),
  taxType: z.enum(['10', '11', '20', '30', '40']).default('10'),
})

/**
 * Create invoice input schema
 */
const createInvoiceSchema = z.object({
  type: z.enum(['01', '03']).default('01'), // 01: Factura, 03: Boleta
  customerId: z.string().min(1, 'Cliente requerido'),
  seriesId: z.string().optional(),
  series: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.enum(['PEN', 'USD', 'EUR']).default('PEN'),
  exchangeRate: z.number().optional(),
  operationType: z.string().default('0101'),
  items: z.array(documentItemSchema).min(1, 'Debe tener al menos un item'),
  globalDiscount: z.number().min(0).default(0),
  observations: z.string().optional(),
  purchaseOrder: z.string().optional(),
  sendToSunat: z.boolean().default(true),
})

/**
 * Create credit/debit note input schema
 */
const createNoteSchema = z.object({
  type: z.enum(['07', '08']), // 07: NC, 08: ND
  referenceDocumentId: z.string().min(1, 'Documento de referencia requerido'),
  reasonCode: z.string().min(1, 'Código de motivo requerido'),
  reasonDescription: z.string().min(1, 'Descripción del motivo requerida'),
  customerId: z.string().min(1, 'Cliente requerido'),
  seriesId: z.string().optional(),
  series: z.string().optional(),
  issueDate: z.string().optional(),
  currency: z.enum(['PEN', 'USD', 'EUR']).default('PEN'),
  items: z.array(documentItemSchema).min(1, 'Debe tener al menos un item'),
  observations: z.string().optional(),
  sendToSunat: z.boolean().default(true),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type CreateNoteInput = z.infer<typeof createNoteSchema>

/**
 * Get authenticated session with tenant
 */
async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.tenantId) {
    throw new Error('No autorizado')
  }

  return session
}

/**
 * Get next correlative number for a series
 */
async function getNextCorrelative(tenantId: string, seriesCode: string): Promise<string> {
  const [series] = await db
    .update(documentSeries)
    .set({
      currentNumber: sql`${documentSeries.currentNumber} + 1`,
    })
    .where(and(eq(documentSeries.tenantId, tenantId), eq(documentSeries.series, seriesCode)))
    .returning()

  if (!series) {
    throw new Error(`Serie ${seriesCode} no encontrada`)
  }

  return String(series.currentNumber).padStart(8, '0')
}

/**
 * Calculate document totals from items
 */
function calculateTotals(
  items: Array<{
    quantity: number
    unitPrice: number
    discount: number
    taxType: string
  }>,
  globalDiscount: number = 0
) {
  const IGV_RATE = 0.18

  let taxableAmount = 0 // Gravado
  let exemptAmount = 0 // Exonerado
  let unaffectedAmount = 0 // Inafecto
  let freeAmount = 0 // Gratuito
  let igvAmount = 0

  const calculatedItems = items.map((item, index) => {
    const subtotal = item.quantity * item.unitPrice - item.discount
    let taxAmount = 0
    let isFree = false

    switch (item.taxType) {
      case '10': // Gravado
        taxableAmount += subtotal
        taxAmount = subtotal * IGV_RATE
        igvAmount += taxAmount
        break
      case '11': // Gravado gratuito
      case '12':
      case '13':
      case '14':
      case '15':
      case '16':
      case '17':
        freeAmount += subtotal
        isFree = true
        break
      case '20': // Exonerado
        exemptAmount += subtotal
        break
      case '30': // Inafecto
        unaffectedAmount += subtotal
        break
      case '40': // Exportación
        taxableAmount += subtotal
        break
    }

    return {
      id: index + 1,
      ...item,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      isFree,
      igvPercentage: item.taxType === '10' ? 18 : 0,
      priceTypeCode: isFree ? '02' : '01',
    }
  })

  // Apply global discount proportionally to taxable amount
  if (globalDiscount > 0 && taxableAmount > 0) {
    const discountRatio = globalDiscount / (taxableAmount + igvAmount)
    taxableAmount -= globalDiscount / (1 + IGV_RATE)
    igvAmount -= (globalDiscount / (1 + IGV_RATE)) * IGV_RATE
  }

  const subtotal = taxableAmount + exemptAmount + unaffectedAmount
  const total = subtotal + igvAmount

  return {
    items: calculatedItems,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    exemptAmount: Math.round(exemptAmount * 100) / 100,
    unaffectedAmount: Math.round(unaffectedAmount * 100) / 100,
    freeAmount: Math.round(freeAmount * 100) / 100,
    igv: Math.round(igvAmount * 100) / 100,
    globalDiscount: Math.round(globalDiscount * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

/**
 * Create a new invoice (Factura or Boleta)
 *
 * @param input - Invoice creation data
 * @returns Created document or error
 *
 * @example
 * ```ts
 * const result = await createInvoice({
 *   type: '01',
 *   customerId: 'cst_123',
 *   items: [{ description: 'Product A', quantity: 2, unitPrice: 100 }]
 * })
 * ```
 */
export async function createInvoice(input: CreateInvoiceInput) {
  try {
    const session = await getSession()
    const tenantId = session.user.tenantId!

    // Validate input
    const data = createInvoiceSchema.parse(input)

    // Get customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, data.customerId), eq(customers.tenantId, tenantId)))

    if (!customer) {
      return { success: false, error: 'Cliente no encontrado' }
    }

    // Validate document type for customer
    if (data.type === '01' && customer.documentType !== '6') {
      return { success: false, error: 'Facturas solo pueden emitirse a clientes con RUC' }
    }

    // Get or determine series
    let seriesCode = data.series
    if (!seriesCode && data.seriesId) {
      const [series] = await db
        .select()
        .from(documentSeries)
        .where(and(eq(documentSeries.id, data.seriesId), eq(documentSeries.tenantId, tenantId)))
      seriesCode = series?.series
    }
    if (!seriesCode) {
      // Get default series for document type
      const [defaultSeries] = await db
        .select()
        .from(documentSeries)
        .where(
          and(
            eq(documentSeries.tenantId, tenantId),
            eq(documentSeries.documentType, data.type as SunatDocumentType),
            eq(documentSeries.isDefault, true)
          )
        )
      seriesCode = defaultSeries?.series

      if (!seriesCode) {
        return { success: false, error: 'No hay serie configurada para este tipo de documento' }
      }
    }

    // Get correlative number
    const number = await getNextCorrelative(tenantId, seriesCode)

    // Calculate totals
    const totals = calculateTotals(data.items, data.globalDiscount)

    // Validate totals
    const totalsValidation = validateTotals({
      taxableAmount: totals.taxableAmount,
      exemptAmount: totals.exemptAmount,
      unaffectedAmount: totals.unaffectedAmount,
      igv: totals.igv,
      total: totals.total,
    })

    if (!totalsValidation.valid) {
      return { success: false, error: totalsValidation.errors.join(', ') }
    }

    // Create document in transaction
    const [document] = await db.transaction(async (tx) => {
      // Insert document
      const [doc] = await tx
        .insert(documents)
        .values({
          tenantId,
          type: data.type as SunatDocumentType,
          series: seriesCode!,
          number,
          customerId: data.customerId,
          issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          currency: data.currency,
          exchangeRate: data.exchangeRate?.toString() || '1',
          operationType: data.operationType,
          subtotal: totals.subtotal.toString(),
          taxableAmount: totals.taxableAmount.toString(),
          exemptAmount: totals.exemptAmount.toString(),
          unaffectedAmount: totals.unaffectedAmount.toString(),
          freeAmount: totals.freeAmount.toString(),
          globalDiscount: totals.globalDiscount.toString(),
          igv: totals.igv.toString(),
          total: totals.total.toString(),
          observations: data.observations,
          purchaseOrder: data.purchaseOrder,
          status: 'draft',
        })
        .returning()

      // Insert items
      for (const item of totals.items) {
        await tx.insert(documentItems).values({
          documentId: doc.id,
          productId: data.items[item.id - 1].productId,
          description: data.items[item.id - 1].description,
          quantity: item.quantity.toString(),
          unitCode: item.unitCode,
          unitPrice: item.unitPrice.toString(),
          discount: item.discount.toString(),
          taxType: item.taxType,
          subtotal: item.subtotal.toString(),
          taxAmount: item.taxAmount.toString(),
          total: item.total.toString(),
        })
      }

      // Create event
      await tx.insert(documentEvents).values({
        documentId: doc.id,
        eventType: 'created',
        payload: { userId: session.user.id },
        userId: session.user.id,
      })

      return [doc]
    })

    // Send to SUNAT in background if requested
    if (data.sendToSunat) {
      after(async () => {
        await sendDocumentToSunat(document.id)
      })
    }

    revalidatePath('/documents')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: {
        id: document.id,
        series: document.series,
        number: document.number,
        total: document.total,
        status: document.status,
      },
    }
  } catch (error) {
    console.error('Error creating invoice:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Error al crear documento' }
  }
}

/**
 * Create a credit or debit note
 */
export async function createNote(input: CreateNoteInput) {
  try {
    const session = await getSession()
    const tenantId = session.user.tenantId!

    const data = createNoteSchema.parse(input)

    // Get reference document
    const [refDoc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, data.referenceDocumentId), eq(documents.tenantId, tenantId)))

    if (!refDoc) {
      return { success: false, error: 'Documento de referencia no encontrado' }
    }

    if (refDoc.status !== 'accepted') {
      return { success: false, error: 'Solo se pueden emitir notas de documentos aceptados' }
    }

    // Determine series prefix based on reference document
    const seriesPrefix = data.type === '07' ? 'FC' : 'FD'
    if (refDoc.type === '03') {
      // Boleta -> BC or BD
    }

    // Get or determine series
    let seriesCode = data.series
    if (!seriesCode) {
      const [defaultSeries] = await db
        .select()
        .from(documentSeries)
        .where(
          and(
            eq(documentSeries.tenantId, tenantId),
            eq(documentSeries.documentType, data.type as SunatDocumentType),
            eq(documentSeries.isDefault, true)
          )
        )
      seriesCode = defaultSeries?.series

      if (!seriesCode) {
        return { success: false, error: 'No hay serie configurada para notas' }
      }
    }

    const number = await getNextCorrelative(tenantId, seriesCode)
    const totals = calculateTotals(data.items, 0)

    const [document] = await db.transaction(async (tx) => {
      const [doc] = await tx
        .insert(documents)
        .values({
          tenantId,
          type: data.type as SunatDocumentType,
          series: seriesCode!,
          number,
          customerId: data.customerId,
          issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
          currency: data.currency,
          operationType: '0101',
          subtotal: totals.subtotal.toString(),
          taxableAmount: totals.taxableAmount.toString(),
          exemptAmount: totals.exemptAmount.toString(),
          unaffectedAmount: totals.unaffectedAmount.toString(),
          freeAmount: totals.freeAmount.toString(),
          globalDiscount: '0',
          igv: totals.igv.toString(),
          total: totals.total.toString(),
          referenceDocumentId: data.referenceDocumentId,
          referenceDocumentType: refDoc.type,
          referenceDocumentNumber: `${refDoc.series}-${refDoc.number}`,
          noteReasonCode: data.reasonCode,
          noteReasonDescription: data.reasonDescription,
          observations: data.observations,
          status: 'draft',
        })
        .returning()

      for (const item of totals.items) {
        await tx.insert(documentItems).values({
          documentId: doc.id,
          description: data.items[item.id - 1].description,
          quantity: item.quantity.toString(),
          unitCode: item.unitCode,
          unitPrice: item.unitPrice.toString(),
          discount: item.discount.toString(),
          taxType: item.taxType,
          subtotal: item.subtotal.toString(),
          taxAmount: item.taxAmount.toString(),
          total: item.total.toString(),
        })
      }

      await tx.insert(documentEvents).values({
        documentId: doc.id,
        eventType: 'created',
        payload: { userId: session.user.id, referenceDocumentId: data.referenceDocumentId },
        userId: session.user.id,
      })

      return [doc]
    })

    if (data.sendToSunat) {
      after(async () => {
        await sendDocumentToSunat(document.id)
      })
    }

    revalidatePath('/documents')

    return {
      success: true,
      data: {
        id: document.id,
        series: document.series,
        number: document.number,
        total: document.total,
      },
    }
  } catch (error) {
    console.error('Error creating note:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Error al crear nota' }
  }
}

/**
 * Send document to SUNAT
 * This is called in background via `after()`
 */
export async function sendDocumentToSunat(documentId: string) {
  try {
    // Get document with relations
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))

    if (!doc) {
      throw new Error('Document not found')
    }

    // Get tenant config
    const tenant = await db.query.tenants.findFirst({
      where: (t, { eq }) => eq(t.id, doc.tenantId),
    })

    if (!tenant) {
      throw new Error('Tenant not found')
    }

    // Get customer
    const customer = doc.customerId
      ? await db.query.customers.findFirst({
          where: (c, { eq }) => eq(c.id, doc.customerId!),
        })
      : null

    // Get items
    const items = await db.query.documentItems.findMany({
      where: (i, { eq }) => eq(i.documentId, documentId),
    })

    // Update status to pending
    await db
      .update(documents)
      .set({ status: 'pending' })
      .where(eq(documents.id, documentId))

    // Create adapter based on tenant config
    const provider = tenant.sunatConfig?.provider || 'mock'
    const adapter = createAdapter(provider, {
      environment: tenant.sunatConfig?.environment || 'beta',
      ruc: tenant.ruc,
      userSol: tenant.sunatConfig?.userSol,
      // ... other config
    })

    // Build document with items for adapter
    const documentWithItems = {
      ...doc,
      items,
      customer,
      tenant: {
        ruc: tenant.ruc,
        name: tenant.name,
        tradeName: tenant.tradeName,
        address: tenant.address,
        ubigeo: tenant.ubigeo,
      },
    }

    // Send to SUNAT
    const response = await adapter.sendDocument(documentWithItems)

    // Update document with response
    await db
      .update(documents)
      .set({
        status: response.success ? 'accepted' : 'rejected',
        sunatStatus: response.status,
        sunatResponseCode: response.responseCode,
        sunatResponseMessage: response.responseMessage,
        sunatResponse: {
          responseCode: response.responseCode,
          responseMessage: response.responseMessage,
          notes: response.notes,
          hash: response.hash,
          cdrData: response.cdrData,
        },
        hashCode: response.hash,
        signedXmlUrl: response.xmlSigned ? `/storage/${documentId}/signed.xml` : undefined,
        sentAt: new Date(),
      })
      .where(eq(documents.id, documentId))

    // Create event
    await db.insert(documentEvents).values({
      documentId,
      eventType: response.success ? 'accepted' : 'rejected',
      payload: response,
    })

    // Send realtime notification
    await sendEvent(doc.tenantId, response.success ? 'document:accepted' : 'document:rejected', {
      documentId,
      series: doc.series,
      number: doc.number,
      status: response.status,
      message: response.responseMessage,
    })

    return response
  } catch (error) {
    console.error('Error sending to SUNAT:', error)

    // Update document with error
    await db
      .update(documents)
      .set({
        status: 'rejected',
        sunatStatus: 'exception',
        sunatResponseMessage: error instanceof Error ? error.message : 'Error desconocido',
      })
      .where(eq(documents.id, documentId))

    throw error
  }
}

/**
 * Get document by ID
 */
export async function getDocument(id: string) {
  const session = await getSession()

  const doc = await db.query.documents.findFirst({
    where: (d, { eq, and }) => and(eq(d.id, id), eq(d.tenantId, session.user.tenantId!)),
    with: {
      customer: true,
      items: true,
      events: {
        orderBy: (e, { desc }) => [desc(e.createdAt)],
      },
    },
  })

  if (!doc) {
    return { success: false, error: 'Documento no encontrado' }
  }

  return { success: true, data: serialize(doc) }
}

/**
 * List documents with filters
 */
export async function listDocuments(params: {
  page?: number
  pageSize?: number
  type?: string
  status?: string
  startDate?: string
  endDate?: string
  search?: string
}) {
  const session = await getSession()
  const tenantId = session.user.tenantId!

  const page = params?.page || 1
  const pageSize = Math.min(params?.pageSize || 20, 100)
  const offset = (page - 1) * pageSize

  const docs = await db.query.documents.findMany({
    where: (d, { eq, and, gte, lte, or, like }) => {
      const conditions = [eq(d.tenantId, tenantId)]

      if (params?.type) {
        conditions.push(eq(d.type, params.type as SunatDocumentType))
      }

      if (params?.status) {
        conditions.push(eq(d.status, params.status as any))
      }

      if (params?.startDate) {
        conditions.push(gte(d.issueDate, new Date(params.startDate)))
      }

      if (params?.endDate) {
        conditions.push(lte(d.issueDate, new Date(params.endDate)))
      }

      return and(...conditions)
    },
    with: {
      customer: {
        columns: {
          id: true,
          name: true,
          documentNumber: true,
        },
      },
    },
    orderBy: (d, { desc }) => [desc(d.createdAt)],
    limit: pageSize,
    offset,
  })

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(documents)
    .where(eq(documents.tenantId, tenantId))

  return {
    success: true,
    data: docs.map(serialize),
    meta: {
      page,
      pageSize,
      totalPages: Math.ceil(Number(count) / pageSize),
      totalCount: Number(count),
    },
  }
}

/**
 * Void a document
 */
export async function voidDocument(id: string, reason: string) {
  const session = await getSession()
  const tenantId = session.user.tenantId!

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))

  if (!doc) {
    return { success: false, error: 'Documento no encontrado' }
  }

  if (doc.status !== 'accepted') {
    return { success: false, error: 'Solo se pueden anular documentos aceptados' }
  }

  // Check if within allowed time (7 days for SUNAT)
  const issueDate = new Date(doc.issueDate)
  const daysSinceIssue = Math.floor((Date.now() - issueDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceIssue > 7) {
    return {
      success: false,
      error: 'No se puede anular. Han pasado más de 7 días desde la emisión. Use una Nota de Crédito.',
    }
  }

  // For now, just mark as voided locally
  // In production, this would send a Comunicación de Baja to SUNAT
  await db
    .update(documents)
    .set({
      status: 'voided',
      voidedAt: new Date(),
    })
    .where(eq(documents.id, id))

  await db.insert(documentEvents).values({
    documentId: id,
    eventType: 'voided',
    payload: { reason, userId: session.user.id },
    userId: session.user.id,
  })

  // TODO: Send Comunicación de Baja to SUNAT in background
  after(async () => {
    // await sendVoidCommunication(id, reason)
    console.log(`TODO: Send void communication for ${id}`)
  })

  revalidatePath('/documents')

  return { success: true }
}

/**
 * Resend document to SUNAT
 */
export async function resendDocument(id: string) {
  const session = await getSession()
  const tenantId = session.user.tenantId!

  const [doc] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.tenantId, tenantId)))

  if (!doc) {
    return { success: false, error: 'Documento no encontrado' }
  }

  if (!['draft', 'rejected'].includes(doc.status)) {
    return { success: false, error: 'Solo se pueden reenviar documentos en borrador o rechazados' }
  }

  after(async () => {
    await sendDocumentToSunat(id)
  })

  return { success: true, message: 'Documento enviado a SUNAT' }
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  const session = await getSession()
  const tenantId = session.user.tenantId!

  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const [docsStats] = await db
    .select({
      totalDocuments: sql<number>`count(*)`,
      pendingDocuments: sql<number>`count(*) filter (where ${documents.status} = 'pending' or ${documents.status} = 'draft')`,
      acceptedDocuments: sql<number>`count(*) filter (where ${documents.status} = 'accepted')`,
      monthlyRevenue: sql<number>`coalesce(sum(${documents.total}::numeric) filter (where ${documents.status} = 'accepted' and ${documents.issueDate} >= ${firstDayOfMonth}::date), 0)`,
    })
    .from(documents)
    .where(eq(documents.tenantId, tenantId));

  const [customersCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(and(eq(customers.tenantId, tenantId), eq(customers.isActive, true)))

  const [productsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.isActive, true)))

  return {
    totalDocuments: Number(docsStats.totalDocuments),
    pendingDocuments: Number(docsStats.pendingDocuments),
    acceptedDocuments: Number(docsStats.acceptedDocuments),
    monthlyRevenue: Number(docsStats.monthlyRevenue),
    totalCustomers: Number(customersCount.count),
    totalProducts: Number(productsCount.count),
  }
}

/**
 * Get recent documents for dashboard
 */
export async function getRecentDocuments(limit: number = 5) {
  const session = await getSession()
  const tenantId = session.user.tenantId!

  const docs = await db.query.documents.findMany({
    where: (d, { eq }) => eq(d.tenantId, tenantId),
    with: {
      customer: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: (d, { desc }) => [desc(d.createdAt)],
    limit,
  })

  return docs.map(serialize)
}
