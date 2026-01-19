import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '../utils'
import { users } from './users'

/**
 * Sessions table for better-auth session management
 * @table sessions
 */
export const sessions = pgTable('sessions', {
  /** Unique session identifier (prefixed: ses_) */
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId('ses')),

  /** Associated user */
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  /** Session token (used for authentication) */
  token: text('token').notNull().unique(),

  /** IP address of the session */
  ipAddress: text('ip_address'),

  /** User agent string */
  userAgent: text('user_agent'),

  /** Session expiration timestamp */
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  /** Creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  /** Last update timestamp */
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export type Session = typeof sessions.$inferSelect
export type NewSession = typeof sessions.$inferInsert
