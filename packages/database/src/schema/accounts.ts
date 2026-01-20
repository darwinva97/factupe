import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '../utils'
import { users } from './users'

/**
 * Accounts table for better-auth OAuth/credential providers
 * @table accounts
 */
export const accounts = pgTable('accounts', {
  /** Unique account identifier (prefixed: acc_) */
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId('acc')),

  /** Associated user */
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  /** Account type (oauth, credential, etc.) */
  accountId: text('account_id').notNull(),

  /** Provider ID (google, github, credential, etc.) */
  providerId: text('provider_id').notNull(),

  /** Access token for OAuth providers */
  accessToken: text('access_token'),

  /** Refresh token for OAuth providers */
  refreshToken: text('refresh_token'),

  /** Access token expiration */
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),

  /** Refresh token expiration */
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),

  /** Token scope */
  scope: text('scope'),

  /** ID token for OIDC providers */
  idToken: text('id_token'),

  /** Password hash for credential provider */
  password: text('password'),

  /** Creation timestamp */
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

  /** Last update timestamp */
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

export type Account = typeof accounts.$inferSelect
export type NewAccount = typeof accounts.$inferInsert
