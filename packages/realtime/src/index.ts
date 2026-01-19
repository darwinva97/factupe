/**
 * @factupe/realtime
 *
 * Real-time communication package for Factupe.
 * Provides SSE streaming and PostgreSQL LISTEN/NOTIFY integration.
 *
 * @packageDocumentation
 * @module realtime
 *
 * @example Server-side SSE handler
 * ```ts
 * import { createSSEStream, sendEvent } from '@factupe/realtime/sse'
 *
 * // In API route
 * export async function GET(request: Request) {
 *   const tenantId = getTenantId(request)
 *   const stream = createSSEStream(tenantId)
 *
 *   return new Response(stream, {
 *     headers: {
 *       'Content-Type': 'text/event-stream',
 *       'Cache-Control': 'no-cache',
 *       'Connection': 'keep-alive',
 *     },
 *   })
 * }
 *
 * // Somewhere else, send event
 * sendEvent(tenantId, 'document:accepted', { documentId: 'doc_123' })
 * ```
 *
 * @example Client-side usage
 * ```tsx
 * import { createRealtimeClient } from '@factupe/realtime/client'
 *
 * const client = createRealtimeClient()
 *
 * client.on('document:accepted', (event) => {
 *   toast.success(`Document ${event.data.documentId} was accepted!`)
 * })
 *
 * client.connect()
 * ```
 *
 * @example PostgreSQL LISTEN/NOTIFY
 * ```ts
 * import { PgNotifyListener } from '@factupe/realtime/pg-notify'
 *
 * const listener = new PgNotifyListener(process.env.DATABASE_URL!)
 * await listener.start()
 * ```
 */

// SSE
export {
  createSSEStream,
  sendEvent,
  sseManager,
  type SSEEvent,
  type SSEEventType,
} from './sse'

// PostgreSQL LISTEN/NOTIFY
export {
  PgNotifyListener,
  CHANNELS,
  CREATE_NOTIFY_TRIGGERS_SQL,
  type Channel,
  type PgNotifyPayload,
} from './pg-notify'

// Client
export { RealtimeClient, createRealtimeClient, type EventHandler } from './client'
