import { pgTable, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '../utils'
import { tenants } from './tenants'

/**
 * User roles available in the system
 */
export const USER_ROLES = ['owner', 'admin', 'accountant', 'sales', 'viewer'] as const
export type UserRole = (typeof USER_ROLES)[number]

/**
 * Users table - system users with tenant association
 * @table users
 */
export const users = pgTable('users', {
  /** Unique user identifier (prefixed: usr_) */
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId('usr')),

  /** Associated tenant */
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),

  /** User's email address (unique per tenant) */
  email: text('email').notNull(),

  /** Hashed password */
  passwordHash: text('password_hash'),

  /** User's display name */
  name: text('name').notNull(),

  /** User's avatar URL */
  avatarUrl: text('avatar_url'),

  /** User role determining base permissions */
  role: text('role').$type<UserRole>().notNull().default('viewer'),

  /**
   * Custom permissions that override role defaults
   * Format: ['documents:create', 'documents:read', ...]
   */
  permissions: jsonb('permissions').$type<string[]>().default([]),

  /** Whether user has verified their email */
  emailVerified: boolean('email_verified').default(false),

  /** Whether user account is active */
  isActive: boolean('is_active').default(true),

  /** Last login timestamp */
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),

  /** Creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  /** Last update timestamp */
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  sessions: many(sessions),
  documentEvents: many(documentEvents),
}))

// Forward declaration
import { sessions } from './sessions'
import { documentEvents } from './document-events'

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
