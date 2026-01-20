'use server'

import { headers } from 'next/headers'
import { eq, and, sql, desc } from 'drizzle-orm'
import { db } from '@factupe/database/client'
import { customers } from '@factupe/database/schema'
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

export async function listCustomers(params: {
  page?: number
  pageSize?: number
  search?: string
  isActive?: boolean
} = {}) {
  const session = await getSession()
  const tenantId = session.user.tenantId!

  const page = params.page || 1
  const pageSize = Math.min(params.pageSize || 20, 100)
  const offset = (page - 1) * pageSize

  const customerList = await db.query.customers.findMany({
    where: (c, { eq, and }) => {
      const conditions = [eq(c.tenantId, tenantId)]

      if (params.isActive !== undefined) {
        conditions.push(eq(c.isActive, params.isActive))
      }

      return and(...conditions)
    },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    limit: pageSize,
    offset,
  })

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(eq(customers.tenantId, tenantId))

  return {
    success: true,
    data: customerList.map(serialize),
    meta: {
      page,
      pageSize,
      totalPages: Math.ceil(Number(count) / pageSize),
      totalCount: Number(count),
    },
  }
}

export async function getCustomer(id: string) {
  const session = await getSession()

  const customer = await db.query.customers.findFirst({
    where: (c, { eq, and }) => and(eq(c.id, id), eq(c.tenantId, session.user.tenantId!)),
  })

  if (!customer) {
    return { success: false, error: 'Cliente no encontrado' }
  }

  return { success: true, data: serialize(customer) }
}

export async function getCustomersCount() {
  const session = await getSession()
  const tenantId = session.user.tenantId!

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(and(eq(customers.tenantId, tenantId), eq(customers.isActive, true)))

  return Number(count)
}
