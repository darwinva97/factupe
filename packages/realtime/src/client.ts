/**
 * Realtime Client
 *
 * Client-side utilities for connecting to SSE stream.
 *
 * @module realtime/client
 */

import type { SSEEvent, SSEEventType } from './sse'

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (event: SSEEvent<T>) => void

/**
 * Realtime client for SSE connections
 *
 * @example
 * ```tsx
 * const client = new RealtimeClient('/api/realtime')
 *
 * client.on('document:accepted', (event) => {
 *   console.log('Document accepted:', event.data)
 * })
 *
 * client.connect()
 *
 * // On cleanup
 * client.disconnect()
 * ```
 */
export class RealtimeClient {
  private eventSource: EventSource | null = null
  private handlers = new Map<SSEEventType | '*', Set<EventHandler>>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor(private url: string) {}

  /**
   * Connect to SSE stream
   */
  connect(): void {
    if (this.eventSource) {
      return
    }

    this.eventSource = new EventSource(this.url)

    this.eventSource.onopen = () => {
      console.log('Realtime connected')
      this.reconnectAttempts = 0
    }

    this.eventSource.onerror = () => {
      console.error('Realtime connection error')
      this.handleReconnect()
    }

    // Listen to all event types
    const eventTypes: SSEEventType[] = [
      'document:created',
      'document:updated',
      'document:sent',
      'document:accepted',
      'document:rejected',
      'document:voided',
      'notification',
      'ping',
    ]

    for (const type of eventTypes) {
      this.eventSource.addEventListener(type, (e) => {
        const event: SSEEvent = {
          id: (e as MessageEvent).lastEventId,
          type,
          data: JSON.parse((e as MessageEvent).data),
          timestamp: new Date().toISOString(),
        }
        this.emit(type, event)
      })
    }
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  /**
   * Subscribe to an event type
   */
  on<T = unknown>(type: SSEEventType | '*', handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }
    this.handlers.get(type)!.add(handler as EventHandler)

    // Return unsubscribe function
    return () => {
      this.handlers.get(type)?.delete(handler as EventHandler)
    }
  }

  /**
   * Unsubscribe from an event type
   */
  off(type: SSEEventType | '*', handler?: EventHandler): void {
    if (handler) {
      this.handlers.get(type)?.delete(handler)
    } else {
      this.handlers.delete(type)
    }
  }

  /**
   * Emit event to handlers
   */
  private emit(type: SSEEventType, event: SSEEvent): void {
    // Call specific handlers
    this.handlers.get(type)?.forEach((handler) => handler(event))

    // Call wildcard handlers
    this.handlers.get('*')?.forEach((handler) => handler(event))
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.disconnect()
    this.reconnectAttempts++

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}

/**
 * Create a realtime client instance
 */
export function createRealtimeClient(url = '/api/realtime'): RealtimeClient {
  return new RealtimeClient(url)
}
