import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { createId } from '../utils'
import { documents } from './documents'
import { users } from './users'

/**
 * Event types for document lifecycle tracking
 */
export const DOCUMENT_EVENT_TYPES = {
  CREATED: 'created',
  UPDATED: 'updated',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  VOIDED: 'voided',
  RESENT: 'resent',
  PDF_GENERATED: 'pdf_generated',
  EMAIL_SENT: 'email_sent',
  DOWNLOADED: 'downloaded',
  VIEWED: 'viewed',
} as const

export type DocumentEventType = (typeof DOCUMENT_EVENT_TYPES)[keyof typeof DOCUMENT_EVENT_TYPES]

/**
 * Document events table - audit trail for document changes
 * @table document_events
 */
export const documentEvents = pgTable(
  'document_events',
  {
    /** Unique event identifier (prefixed: evt_) */
    id: text('id')
      .primaryKey()
      .$defaultFn(() => createId('evt')),

    /** Parent document */
    documentId: text('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),

    /** Event type */
    eventType: text('event_type').$type<DocumentEventType>().notNull(),

    /** User who triggered the event (optional for system events) */
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

    /**
     * Event payload with additional data
     */
    payload: jsonb('payload').$type<{
      previousStatus?: string
      newStatus?: string
      sunatResponse?: Record<string, unknown>
      errorMessage?: string
      changes?: Record<string, { from: unknown; to: unknown }>
      metadata?: Record<string, unknown>
    }>(),

    /** IP address of the action */
    ipAddress: text('ip_address'),

    /** User agent */
    userAgent: text('user_agent'),

    /** Creation timestamp (event timestamp) */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('document_events_document_id_idx').on(table.documentId),
    index('document_events_event_type_idx').on(table.eventType),
    index('document_events_created_at_idx').on(table.createdAt),
  ]
)

export const documentEventsRelations = relations(documentEvents, ({ one }) => ({
  document: one(documents, {
    fields: [documentEvents.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [documentEvents.userId],
    references: [users.id],
  }),
}))

export type DocumentEvent = typeof documentEvents.$inferSelect
export type NewDocumentEvent = typeof documentEvents.$inferInsert
