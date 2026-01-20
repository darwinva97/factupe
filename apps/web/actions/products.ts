'use server'

import { headers } from 'next/headers'
import { eq, and, sql } from 'drizzle-orm'
import { db } from '@factupe/database/client'
import { products } from '@factupe/database/schema'
import { auth } from '@factupe/auth/config'

function serialize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_, value) =>
    value instanceof Date ? value.toISOString() : value
  ))
}

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.tenantId) {
    throw new Error('No autorizado')
  }

  return session
}

export async function listProducts(params: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
  isService?: boolean
} = {}) {
  const session = await getSession()
  const tenantId = session.user.tenantId!

  const page = params.page || 1
  const pageSize = Math.min(params.pageSize || 20, 100)
  const offset = (page - 1) * pageSize

  const productList = await db.query.products.findMany({
    where: (p, { eq, and }) => {
      const conditions = [eq(p.tenantId, tenantId)]

      if (params.isActive !== undefined) {
        conditions.push(eq(p.isActive, params.isActive))
      }

      if (params.isService !== undefined) {
        conditions.push(eq(p.isService, params.isService))
      }

      return and(...conditions)
    },
    orderBy: (p, { desc }) => [desc(p.createdAt)],
    limit: pageSize,
    offset,
  })

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.tenantId, tenantId))

  return {
    success: true,
    data: productList.map(serialize),
    meta: {
      page,
      pageSize,
      totalPages: Math.ceil(Number(count) / pageSize),
      totalCount: Number(count),
    },
  }
}

export async function getProduct(id: string) {
  const session = await getSession()

  const product = await db.query.products.findFirst({
    where: (p, { eq, and }) => and(eq(p.id, id), eq(p.tenantId, session.user.tenantId!)),
  })

  if (!product) {
    return { success: false, error: 'Producto no encontrado' }
  }

  return { success: true, data: serialize(product) }
}

export async function getProductsCount() {
  const session = await getSession()
  const tenantId = session.user.tenantId!

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.isActive, true)))

  return Number(count)
}
