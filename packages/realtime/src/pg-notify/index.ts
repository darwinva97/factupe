/**
 * PostgreSQL LISTEN/NOTIFY Handler
 *
 * Listens to PostgreSQL notifications for real-time updates.
 *
 * @module realtime/pg-notify
 */

import postgres from 'postgres'
import { sendEvent, type SSEEventType } from '../sse'

/**
 * Notification payload from PostgreSQL
 */
export interface PgNotifyPayload {
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  tenant_id: string
  id: string
  data?: Record<string, unknown>
}

/**
 * Channel names for PostgreSQL LISTEN/NOTIFY
 */
export const CHANNELS = {
  DOCUMENT_CHANGES: 'document_changes',
  CUSTOMER_CHANGES: 'customer_changes',
  PRODUCT_CHANGES: 'product_changes',
} as const

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS]

/**
 * PostgreSQL Notification Listener
 *
 * Listens to PostgreSQL NOTIFY events and broadcasts them via SSE.
 *
 * @example
 * ```ts
 * const listener = new PgNotifyListener(process.env.DATABASE_URL!)
 * await listener.start()
 *
 * // On shutdown
 * await listener.stop()
 * ```
 */
export class PgNotifyListener {
  private sql: postgres.Sql | null = null
  private isRunning = false

  constructor(private connectionString: string) {}

  /**
   * Start listening to PostgreSQL notifications
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('PgNotifyListener is already running')
      return
    }

    this.sql = postgres(this.connectionString, {
      max: 1, // Single connection for LISTEN
      idle_timeout: 0, // Keep alive
      connect_timeout: 10,
    })

    this.isRunning = true

    // Subscribe to all channels
    for (const channel of Object.values(CHANNELS)) {
      await this.subscribeToChannel(channel)
    }

    console.log('PgNotifyListener started')
  }

  /**
   * Stop listening and close connection
   */
  async stop(): Promise<void> {
    if (!this.isRunning || !this.sql) {
      return
    }

    this.isRunning = false
    await this.sql.end()
    this.sql = null

    console.log('PgNotifyListener stopped')
  }

  /**
   * Subscribe to a PostgreSQL channel
   */
  private async subscribeToChannel(channel: Channel): Promise<void> {
    if (!this.sql) return

    await this.sql.listen(channel, (payload) => {
      this.handleNotification(channel, payload)
    })

    console.log(`Subscribed to channel: ${channel}`)
  }

  /**
   * Handle incoming notification
   */
  private handleNotification(channel: Channel, payload: string): void {
    try {
      const data = JSON.parse(payload) as PgNotifyPayload

      // Map database events to SSE events
      const eventType = this.mapToSSEEvent(channel, data.operation)
      if (!eventType) return

      // Broadcast to tenant
      sendEvent(data.tenant_id, eventType, {
        id: data.id,
        table: data.table,
        operation: data.operation,
        ...data.data,
      })
    } catch (error) {
      console.error('Error handling notification:', error)
    }
  }

  /**
   * Map database operation to SSE event type
   */
  private mapToSSEEvent(channel: Channel, operation: string): SSEEventType | null {
    if (channel === CHANNELS.DOCUMENT_CHANGES) {
      switch (operation) {
        case 'INSERT':
          return 'document:created'
        case 'UPDATE':
          return 'document:updated'
        case 'DELETE':
          return 'document:voided'
        default:
          return null
      }
    }

    return 'notification'
  }
}

/**
 * SQL for creating notification triggers
 * Run this during database setup/migration
 */
export const CREATE_NOTIFY_TRIGGERS_SQL = `
-- Function to notify on changes
CREATE OR REPLACE FUNCTION notify_table_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  channel TEXT;
BEGIN
  -- Determine channel based on table name
  channel := TG_TABLE_NAME || '_changes';

  -- Build payload
  IF (TG_OP = 'DELETE') THEN
    payload := json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'tenant_id', OLD.tenant_id,
      'id', OLD.id
    );
  ELSE
    payload := json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'tenant_id', NEW.tenant_id,
      'id', NEW.id,
      'data', json_build_object(
        'status', CASE WHEN TG_TABLE_NAME = 'documents' THEN NEW.status ELSE NULL END,
        'sunat_status', CASE WHEN TG_TABLE_NAME = 'documents' THEN NEW.sunat_status ELSE NULL END
      )
    );
  END IF;

  -- Send notification
  PERFORM pg_notify(channel, payload::text);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for documents table
DROP TRIGGER IF EXISTS documents_notify_trigger ON documents;
CREATE TRIGGER documents_notify_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

-- Trigger for customers table
DROP TRIGGER IF EXISTS customers_notify_trigger ON customers;
CREATE TRIGGER customers_notify_trigger
  AFTER INSERT OR UPDATE OR DELETE ON customers
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();

-- Trigger for products table
DROP TRIGGER IF EXISTS products_notify_trigger ON products;
CREATE TRIGGER products_notify_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION notify_table_change();
`
