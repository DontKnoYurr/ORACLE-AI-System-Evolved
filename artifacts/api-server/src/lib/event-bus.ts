/**
 * ORACLE Unified Event Bus
 * 
 * Central event dispatcher for all system modules. Enables real-time
 * data pipelines and live updates across the entire platform.
 */

import { EventEmitter } from 'events';

export type EventType = 
  | 'training:cycle:start'
  | 'training:cycle:complete'
  | 'training:interaction:recorded'
  | 'training:metrics:update'
  | 'harvest:start'
  | 'harvest:complete'
  | 'harvest:feed:processed'
  | 'signal:created'
  | 'signal:updated'
  | 'anomaly:detected'
  | 'prediction:generated'
  | 'entity:updated'
  | 'agent:action'
  | 'system:calibration'
  | 'system:error'
  | 'manual:trigger'
  | 'sse:broadcast';

export interface EventPayload {
  type: EventType;
  timestamp: Date;
  source: string;
  data: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  correlationId: string;
}

export interface EventSubscriber {
  id: string;
  channel: string;
  handler: (event: EventPayload) => Promise<void>;
  filter?: (event: EventPayload) => boolean;
}

export interface EventMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  subscriberCount: number;
  averageProcessingTime: number;
  errorCount: number;
}

class UnifiedEventBus {
  private emitter: EventEmitter;
  private subscribers: Map<string, EventSubscriber[]>;
  private eventHistory: EventPayload[];
  private maxHistorySize: number = 1000;
  private metrics: EventMetrics;
  private processingTimes: Map<string, number[]>;

  constructor() {
    this.emitter = new EventEmitter();
    this.subscribers = new Map();
    this.eventHistory = [];
    this.metrics = {
      totalEvents: 0,
      eventsByType: {},
      subscriberCount: 0,
      averageProcessingTime: 0,
      errorCount: 0,
    };
    this.processingTimes = new Map();
  }

  /**
   * Subscribe to events on a specific channel.
   */
  public subscribe(
    channel: string,
    handler: (event: EventPayload) => Promise<void>,
    filter?: (event: EventPayload) => boolean
  ): string {
    const subscriberId = `${channel}_${Date.now()}_${Math.random()}`;
    
    const subscriber: EventSubscriber = {
      id: subscriberId,
      channel,
      handler,
      filter,
    };

    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, []);
    }

    this.subscribers.get(channel)!.push(subscriber);
    this.metrics.subscriberCount++;

    return subscriberId;
  }

  /**
   * Unsubscribe from a channel.
   */
  public unsubscribe(subscriberId: string): boolean {
    for (const [channel, subs] of this.subscribers.entries()) {
      const index = subs.findIndex(s => s.id === subscriberId);
      if (index !== -1) {
        subs.splice(index, 1);
        this.metrics.subscriberCount--;
        return true;
      }
    }
    return false;
  }

  /**
   * Publish an event to all subscribers on a channel.
   */
  public async publish(event: Omit<EventPayload, 'timestamp' | 'correlationId'>): Promise<void> {
    const fullEvent: EventPayload = {
      ...event,
      timestamp: new Date(),
      correlationId: this.generateCorrelationId(),
    };

    // Record metrics
    this.metrics.totalEvents++;
    this.metrics.eventsByType[event.type] = (this.metrics.eventsByType[event.type] ?? 0) + 1;

    // Add to history
    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Emit to subscribers
    const channel = event.type;
    const subscribers = this.subscribers.get(channel) ?? [];

    const startTime = Date.now();
    const processingPromises: Promise<void>[] = [];

    for (const subscriber of subscribers) {
      // Apply filter if present
      if (subscriber.filter && !subscriber.filter(fullEvent)) {
        continue;
      }

      const promise = (async () => {
        try {
          await subscriber.handler(fullEvent);
        } catch (error) {
          this.metrics.errorCount++;
          console.error(`Error in event handler for ${channel}:`, error);
        }
      })();

      processingPromises.push(promise);
    }

    await Promise.all(processingPromises);

    // Record processing time
    const processingTime = Date.now() - startTime;
    if (!this.processingTimes.has(channel)) {
      this.processingTimes.set(channel, []);
    }
    this.processingTimes.get(channel)!.push(processingTime);

    // Update average processing time
    this.updateAverageProcessingTime();
  }

  /**
   * Broadcast event to all connected SSE clients.
   */
  public async broadcastToSSE(data: Record<string, unknown>): Promise<void> {
    await this.publish({
      type: 'sse:broadcast',
      source: 'event-bus',
      data,
      priority: 'normal',
    });
  }

  /**
   * Get event history with optional filtering.
   */
  public getHistory(
    filter?: {
      type?: EventType;
      source?: string;
      since?: Date;
      limit?: number;
    }
  ): EventPayload[] {
    let history = [...this.eventHistory];

    if (filter?.type) {
      history = history.filter(e => e.type === filter.type);
    }

    if (filter?.source) {
      history = history.filter(e => e.source === filter.source);
    }

    if (filter?.since) {
      history = history.filter(e => e.timestamp >= filter.since);
    }

    if (filter?.limit) {
      history = history.slice(-filter.limit);
    }

    return history;
  }

  /**
   * Get current metrics.
   */
  public getMetrics(): EventMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics.
   */
  public resetMetrics(): void {
    this.metrics = {
      totalEvents: 0,
      eventsByType: {},
      subscriberCount: this.metrics.subscriberCount,
      averageProcessingTime: 0,
      errorCount: 0,
    };
    this.processingTimes.clear();
  }

  /**
   * Get subscriber count for a channel.
   */
  public getSubscriberCount(channel?: string): number {
    if (channel) {
      return this.subscribers.get(channel)?.length ?? 0;
    }
    return this.metrics.subscriberCount;
  }

  /**
   * Wait for a specific event to occur.
   */
  public waitForEvent(
    eventType: EventType,
    timeout: number = 30000,
    filter?: (event: EventPayload) => boolean
  ): Promise<EventPayload> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.unsubscribe(subscriberId);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const subscriberId = this.subscribe(eventType, async (event) => {
        if (!filter || filter(event)) {
          clearTimeout(timeoutHandle);
          this.unsubscribe(subscriberId);
          resolve(event);
        }
      });
    });
  }

  /**
   * Clear event history.
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Generate a unique correlation ID for tracing.
   */
  private generateCorrelationId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update average processing time.
   */
  private updateAverageProcessingTime(): void {
    let totalTime = 0;
    let count = 0;

    for (const times of this.processingTimes.values()) {
      totalTime += times.reduce((a, b) => a + b, 0);
      count += times.length;
    }

    this.metrics.averageProcessingTime = count > 0 ? totalTime / count : 0;
  }

  /**
   * Get processing time statistics for a channel.
   */
  public getChannelStats(channel: EventType): {
    count: number;
    averageTime: number;
    maxTime: number;
    minTime: number;
  } | null {
    const times = this.processingTimes.get(channel);
    if (!times || times.length === 0) {
      return null;
    }

    return {
      count: times.length,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxTime: Math.max(...times),
      minTime: Math.min(...times),
    };
  }
}

// Export singleton instance
export const eventBus = new UnifiedEventBus();

/**
 * Helper function to publish training events.
 */
export async function publishTrainingEvent(
  eventType: Extract<EventType, 'training:cycle:start' | 'training:cycle:complete' | 'training:interaction:recorded' | 'training:metrics:update'>,
  data: Record<string, unknown>
): Promise<void> {
  await eventBus.publish({
    type: eventType,
    source: 'trainer',
    data,
    priority: 'high',
  });
}

/**
 * Helper function to publish harvest events.
 */
export async function publishHarvestEvent(
  eventType: Extract<EventType, 'harvest:start' | 'harvest:complete' | 'harvest:feed:processed'>,
  data: Record<string, unknown>
): Promise<void> {
  await eventBus.publish({
    type: eventType,
    source: 'harvester',
    data,
    priority: 'normal',
  });
}

/**
 * Helper function to publish signal events.
 */
export async function publishSignalEvent(
  eventType: Extract<EventType, 'signal:created' | 'signal:updated'>,
  data: Record<string, unknown>
): Promise<void> {
  await eventBus.publish({
    type: eventType,
    source: 'signal-processor',
    data,
    priority: 'normal',
  });
}

/**
 * Helper function to publish anomaly events.
 */
export async function publishAnomalyEvent(
  data: Record<string, unknown>
): Promise<void> {
  await eventBus.publish({
    type: 'anomaly:detected',
    source: 'anomaly-detector',
    data,
    priority: 'high',
  });
}

/**
 * Helper function to publish system errors.
 */
export async function publishSystemError(
  error: Error,
  context: Record<string, unknown>
): Promise<void> {
  await eventBus.publish({
    type: 'system:error',
    source: 'system',
    data: {
      message: error.message,
      stack: error.stack,
      ...context,
    },
    priority: 'critical',
  });
}
