/**
 * Server-Sent Events (SSE) Handler
 *
 * Provides real-time updates to clients via SSE.
 *
 * @module realtime/sse
 */

/**
 * SSE Event types
 */
export type SSEEventType =
  | 'document:created'
  | 'document:updated'
  | 'document:sent'
  | 'document:accepted'
  | 'document:rejected'
  | 'document:voided'
  | 'notification'
  | 'ping'

/**
 * SSE Event payload
 */
export interface SSEEvent<T = unknown> {
  id: string
  type: SSEEventType
  data: T
  timestamp: string
}

/**
 * SSE Connection manager
 * Manages active SSE connections per tenant
 */
class SSEConnectionManager {
  private connections = new Map<string, Set<ReadableStreamDefaultController>>()

  /**
   * Add a connection for a tenant
   */
  addConnection(tenantId: string, controller: ReadableStreamDefaultController): void {
    if (!this.connections.has(tenantId)) {
      this.connections.set(tenantId, new Set())
    }
    this.connections.get(tenantId)!.add(controller)
  }

  /**
   * Remove a connection for a tenant
   */
  removeConnection(tenantId: string, controller: ReadableStreamDefaultController): void {
    const tenantConnections = this.connections.get(tenantId)
    if (tenantConnections) {
      tenantConnections.delete(controller)
      if (tenantConnections.size === 0) {
        this.connections.delete(tenantId)
      }
    }
  }

  /**
   * Broadcast event to all connections of a tenant
   */
  broadcast(tenantId: string, event: SSEEvent): void {
    const tenantConnections = this.connections.get(tenantId)
    if (!tenantConnections) return

    const message = formatSSEMessage(event)
    const encoder = new TextEncoder()
    const data = encoder.encode(message)

    for (const controller of tenantConnections) {
      try {
        controller.enqueue(data)
      } catch {
        // Connection closed, remove it
        this.removeConnection(tenantId, controller)
      }
    }
  }

  /**
   * Get connection count for a tenant
   */
  getConnectionCount(tenantId: string): number {
    return this.connections.get(tenantId)?.size || 0
  }

  /**
   * Get total connection count
   */
  getTotalConnections(): number {
    let total = 0
    for (const connections of this.connections.values()) {
      total += connections.size
    }
    return total
  }
}

/**
 * Global SSE connection manager
 */
export const sseManager = new SSEConnectionManager()

/**
 * Format SSE message
 */
function formatSSEMessage(event: SSEEvent): string {
  return `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`
}

/**
 * Create SSE stream for a tenant
 *
 * @example
 * ```ts
 * // In API route
 * export async function GET(request: Request) {
 *   const tenantId = await getTenantId(request)
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
 * ```
 */
export function createSSEStream(tenantId: string): ReadableStream {
  let controller: ReadableStreamDefaultController

  return new ReadableStream({
    start(c) {
      controller = c
      sseManager.addConnection(tenantId, controller)

      // Send initial ping
      const pingEvent: SSEEvent = {
        id: generateEventId(),
        type: 'ping',
        data: { message: 'Connected' },
        timestamp: new Date().toISOString(),
      }
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(formatSSEMessage(pingEvent)))

      // Setup periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          const ping: SSEEvent = {
            id: generateEventId(),
            type: 'ping',
            data: { timestamp: Date.now() },
            timestamp: new Date().toISOString(),
          }
          controller.enqueue(encoder.encode(formatSSEMessage(ping)))
        } catch {
          clearInterval(pingInterval)
        }
      }, 30000) // Ping every 30 seconds

      // Cleanup on close
      return () => {
        clearInterval(pingInterval)
        sseManager.removeConnection(tenantId, controller)
      }
    },
    cancel() {
      sseManager.removeConnection(tenantId, controller)
    },
  })
}

/**
 * Send event to a specific tenant
 */
export function sendEvent<T>(tenantId: string, type: SSEEventType, data: T): void {
  const event: SSEEvent<T> = {
    id: generateEventId(),
    type,
    data,
    timestamp: new Date().toISOString(),
  }
  sseManager.broadcast(tenantId, event)
}

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
