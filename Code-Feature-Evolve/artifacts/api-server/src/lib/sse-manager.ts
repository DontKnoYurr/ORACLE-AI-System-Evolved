/**
 * ORACLE SSE Manager
 * 
 * Manages Server-Sent Events connections with event bus integration
 * for real-time, multi-channel live updates to connected clients.
 */

import { Response } from 'express';
import { eventBus, EventPayload, EventType } from './event-bus.js';
import { randomUUID } from 'crypto';

export interface SSEClient {
  id: string;
  response: Response;
  channels: Set<EventType>;
  connectedAt: Date;
  lastHeartbeat: Date;
  messageCount: number;
}

export interface SSEMessage {
  type: 'meta' | 'event' | 'heartbeat' | 'error';
  id: string;
  channel?: EventType;
  data: Record<string, unknown>;
  timestamp: Date;
}

class SSEManager {
  private clients: Map<string, SSEClient>;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatIntervalMs: number = 30000; // 30 seconds
  private maxClientsPerServer: number = 10000;

  constructor() {
    this.clients = new Map();
    this.startHeartbeat();
  }

  /**
   * Register a new SSE client connection.
   */
  public registerClient(response: Response, channels: EventType[] = []): string {
    if (this.clients.size >= this.maxClientsPerServer) {
      response.status(503).end('Server at capacity');
      return '';
    }

    const clientId = randomUUID();
    const client: SSEClient = {
      id: clientId,
      response,
      channels: new Set(channels),
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      messageCount: 0,
    };

    this.clients.set(clientId, client);

    // Set up response headers for SSE
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    });

    // Send initial connection meta event
    this.sendToClient(clientId, {
      type: 'meta',
      id: clientId,
      data: {
        connected: true,
        clientId,
        channels: Array.from(client.channels),
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    });

    // Subscribe to event bus channels
    for (const channel of client.channels) {
      this.subscribeToChannel(clientId, channel);
    }

    // Handle client disconnect
    response.on('close', () => {
      this.unregisterClient(clientId);
    });

    response.on('error', (error) => {
      console.error(`SSE client ${clientId} error:`, error);
      this.unregisterClient(clientId);
    });

    return clientId;
  }

  /**
   * Unregister a client connection.
   */
  public unregisterClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.response.end();
      } catch (error) {
        console.error(`Error closing SSE response for ${clientId}:`, error);
      }
      this.clients.delete(clientId);
    }
  }

  /**
   * Subscribe a client to additional channels.
   */
  public subscribeToChannel(clientId: string, channel: EventType): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    if (client.channels.has(channel)) {
      return false; // Already subscribed
    }

    client.channels.add(channel);

    // Subscribe to event bus
    eventBus.subscribe(channel, async (event) => {
      this.sendToClient(clientId, {
        type: 'event',
        id: event.correlationId,
        channel: event.type,
        data: event.data,
        timestamp: event.timestamp,
      });
    });

    return true;
  }

  /**
   * Unsubscribe a client from a channel.
   */
  public unsubscribeFromChannel(clientId: string, channel: EventType): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    return client.channels.delete(channel);
  }

  /**
   * Send a message to a specific client.
   */
  public sendToClient(clientId: string, message: SSEMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const eventData = JSON.stringify(message.data);
      client.response.write(`data: ${eventData}\n\n`);
      client.messageCount++;
      client.lastHeartbeat = new Date();
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      this.unregisterClient(clientId);
    }
  }

  /**
   * Broadcast a message to all connected clients.
   */
  public broadcastToAll(message: Omit<SSEMessage, 'id'>): void {
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, {
        ...message,
        id: randomUUID(),
      });
    }
  }

  /**
   * Broadcast a message to clients subscribed to a specific channel.
   */
  public broadcastToChannel(channel: EventType, message: Omit<SSEMessage, 'id' | 'channel'>): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.channels.has(channel)) {
        this.sendToClient(clientId, {
          ...message,
          id: randomUUID(),
          channel,
        });
      }
    }
  }

  /**
   * Get connected clients count.
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get client information.
   */
  public getClientInfo(clientId: string): Partial<SSEClient> | null {
    const client = this.clients.get(clientId);
    if (!client) return null;

    return {
      id: client.id,
      channels: Array.from(client.channels),
      connectedAt: client.connectedAt,
      lastHeartbeat: client.lastHeartbeat,
      messageCount: client.messageCount,
    };
  }

  /**
   * Get all connected clients info.
   */
  public getAllClientsInfo(): Array<Partial<SSEClient>> {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      channels: Array.from(client.channels),
      connectedAt: client.connectedAt,
      lastHeartbeat: client.lastHeartbeat,
      messageCount: client.messageCount,
    }));
  }

  /**
   * Start periodic heartbeat to keep connections alive.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [clientId, client] of this.clients.entries()) {
        try {
          this.sendToClient(clientId, {
            type: 'heartbeat',
            id: randomUUID(),
            data: {
              timestamp: new Date().toISOString(),
              clientId,
            },
            timestamp: new Date(),
          });
        } catch (error) {
          console.error(`Error sending heartbeat to ${clientId}:`, error);
          this.unregisterClient(clientId);
        }
      }
    }, this.heartbeatIntervalMs);
  }

  /**
   * Stop heartbeat.
   */
  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get statistics about SSE connections.
   */
  public getStatistics() {
    const clients = Array.from(this.clients.values());
    const channelCounts: Record<string, number> = {};
    let totalMessages = 0;

    for (const client of clients) {
      for (const channel of client.channels) {
        channelCounts[channel] = (channelCounts[channel] ?? 0) + 1;
      }
      totalMessages += client.messageCount;
    }

    return {
      connectedClients: this.clients.size,
      totalMessages,
      channelCounts,
      averageMessagesPerClient: clients.length > 0 ? totalMessages / clients.length : 0,
      oldestConnection: clients.length > 0 ? Math.min(...clients.map(c => c.connectedAt.getTime())) : null,
      newestConnection: clients.length > 0 ? Math.max(...clients.map(c => c.connectedAt.getTime())) : null,
    };
  }

  /**
   * Cleanup dead connections.
   */
  public cleanupDeadConnections(maxIdleTime: number = 5 * 60 * 1000): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastHeartbeat.getTime() > maxIdleTime) {
        this.unregisterClient(clientId);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Graceful shutdown.
   */
  public shutdown(): void {
    this.stopHeartbeat();
    
    for (const clientId of Array.from(this.clients.keys())) {
      this.unregisterClient(clientId);
    }
  }
}

// Export singleton instance
export const sseManager = new SSEManager();
