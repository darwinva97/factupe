/**
 * Database seeding script
 * Populates the database with initial data for development
 *
 * @example
 * ```bash
 * pnpm db:seed
 * ```
 */
import "./env";
import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db, connection } from '../client'
import * as schema from '../schema'
import { tenants, documentSeries, products, customers } from '../schema'

// Create auth instance for seeding (avoids circular dependency with @factupe/auth)
const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
    },
  }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      tenantId: { type: 'string', required: true },
      role: { type: 'string', required: true, defaultValue: 'viewer' },
      permissions: { type: 'string[]', required: false, defaultValue: [] },
    },
  },
  plugins: [admin()],
})

async function seed() {
  console.log('🌱 Seeding database...')

  // Create demo tenant
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: 'Empresa Demo S.A.C.',
      ruc: '20123456789',
      tradeName: 'Demo Company',
      address: 'Av. Principal 123, Lima',
      ubigeo: '150101',
      department: 'Lima',
      province: 'Lima',
      district: 'Lima',
      email: 'demo@factupe.com',
      phone: '+51 1 234 5678',
      sunatConfig: {
        environment: 'beta',
        provider: 'mock',
      },
      settings: {
        currency: 'PEN',
        timezone: 'America/Lima',
        language: 'es',
      },
      plan: 'free',
    })
    .returning()

  if (!tenant) {
    throw new Error('Failed to create demo tenant')
  }

  console.log('✅ Created demo tenant:', tenant.name)

  // Create demo user (password: demo123)
  const user = await auth.api.createUser({
    body: {
      email: 'admin@factupe.com',
      password: 'demo123',
      name: 'Admin Demo',
      role: 'owner',
      data: {
        tenantId: tenant.id,
      },
    },
  })

  console.log('✅ Created demo user:', user.email)

  // Create document series
  const seriesData = [
    { tenantId: tenant.id, documentType: '01' as const, series: 'F001', description: 'Facturas - Local Principal' },
    { tenantId: tenant.id, documentType: '03' as const, series: 'B001', description: 'Boletas - Local Principal' },
    { tenantId: tenant.id, documentType: '07' as const, series: 'FC01', description: 'Notas de Crédito - Facturas' },
    { tenantId: tenant.id, documentType: '07' as const, series: 'BC01', description: 'Notas de Crédito - Boletas' },
    { tenantId: tenant.id, documentType: '08' as const, series: 'FD01', description: 'Notas de Débito - Facturas' },
    { tenantId: tenant.id, documentType: '08' as const, series: 'BD01', description: 'Notas de Débito - Boletas' },
  ]

  await db.insert(documentSeries).values(seriesData)
  console.log('✅ Created document series')

  // Create sample products
  const productsData = [
    {
      tenantId: tenant.id,
      code: 'PROD001',
      name: 'Producto de ejemplo 1',
      description: 'Descripción del producto de ejemplo',
      unitCode: 'NIU',
      unitPrice: '100.00',
      currency: 'PEN',
      taxType: '10' as const,
      category: 'General',
      isService: false,
    },
    {
      tenantId: tenant.id,
      code: 'SERV001',
      name: 'Servicio de consultoría',
      description: 'Servicio de consultoría profesional',
      unitCode: 'ZZ',
      unitPrice: '500.00',
      currency: 'PEN',
      taxType: '10' as const,
      category: 'Servicios',
      isService: true,
    },
    {
      tenantId: tenant.id,
      code: 'PROD002',
      name: 'Producto exonerado',
      description: 'Producto exonerado de IGV',
      unitCode: 'NIU',
      unitPrice: '50.00',
      currency: 'PEN',
      taxType: '20' as const,
      category: 'Exonerados',
      isService: false,
    },
  ]

  await db.insert(products).values(productsData)
  console.log('✅ Created sample products')

  // Create sample customers
  const customersData = [
    {
      tenantId: tenant.id,
      documentType: '6' as const, // RUC
      documentNumber: '20100047218',
      name: 'Cliente Empresa S.A.C.',
      tradeName: 'Cliente Empresa',
      address: 'Av. Comercio 456, Lima',
      email: 'contacto@clienteempresa.com',
      phone: '+51 1 987 6543',
    },
    {
      tenantId: tenant.id,
      documentType: '1' as const, // DNI
      documentNumber: '12345678',
      name: 'Juan Pérez García',
      address: 'Jr. Residencial 789, Lima',
      email: 'juan.perez@email.com',
      phone: '+51 999 888 777',
    },
  ]

  await db.insert(customers).values(customersData)
  console.log('✅ Created sample customers')

  console.log('🎉 Seeding completed successfully!')
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await connection.end()
    process.exit(0)
  })
