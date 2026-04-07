import { notifications } from '@mantine/notifications';
import type { SSEEvent, StreamStatusValue } from '@/types';

const SSE_EVENTS = [
  'step_start',
  'step_done',
  'step_failed',
  'step_skipped',
  'step_log',
  'chain_done',
  'chain_failed',
  'done',
] as const;

const MAX_RECONNECT = 5;
const BACKOFF_BASE_MS = 1000;
const BACKOFF_MULTIPLIER = 3;
const PARSE_FAILURE_WARN_THRESHOLD = 3;

type SSEEventCallback = (event: SSEEvent) => void;
type SSEStatusCallback = (status: StreamStatusValue) => void;

class SSEService {
  private source: EventSource | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private executionId: string | null = null;
  private onEvent: SSEEventCallback | null = null;
  private onStatus: SSEStatusCallback | null = null;
  private parseFailures = 0;
  /** Set to true when the server sends the `done` event (normal stream close). Prevents reconnection. */
  private completed = false;

  connect(
    executionId: string,
    onEvent: SSEEventCallback,
    onStatus: SSEStatusCallback,
  ): void {
    this.disconnect();
    this.executionId = executionId;
    this.onEvent = onEvent;
    this.onStatus = onStatus;
    this.reconnectAttempts = 0;
    this.parseFailures = 0;
    this.completed = false;

    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    this.openConnection(onEvent, onStatus);
  }

  private openConnection(
    onEvent: SSEEventCallback,
    onStatus: SSEStatusCallback,
  ): void {
    if (!this.executionId) return;
    onStatus('connecting');

    this.source = new EventSource(`/api/v1/executions/${this.executionId}/stream`);

    // All events except `done` — dispatch to Redux store
    const liveEvents = SSE_EVENTS.filter((e) => e !== 'done') as Exclude<typeof SSE_EVENTS[number], 'done'>[];
    liveEvents.forEach((eventName) => {
      this.source!.addEventListener(eventName, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          onEvent({ ...data, event: eventName } as SSEEvent);
        } catch {
          this.parseFailures++;
          console.error(`[SSE] Failed to parse ${eventName} event:`, e.data);
          if (this.parseFailures === PARSE_FAILURE_WARN_THRESHOLD) {
            notifications.show({
              title: 'SSE Parse Warning',
              message: `Failed to parse ${this.parseFailures} events from the execution stream. Some data may be missing.`,
              color: 'yellow',
              autoClose: false,
            });
          }
        }
      });
    });

    // `done` — server signals the stream is finished; close cleanly and never reconnect
    this.source.addEventListener('done', (e: MessageEvent) => {
      this.completed = true;
      try {
        const data = JSON.parse(e.data);
        onEvent({ ...data, event: 'done' } as SSEEvent);
      } catch {
        // done payload may be empty — still dispatch so Redux can finalize status
        onEvent({ event: 'done' } as SSEEvent);
      }
      // Actively close our end so onerror doesn't fire afterward
      this.source?.close();
      this.source = null;
      onStatus('idle');
    });

    this.source.onopen = () => {
      this.reconnectAttempts = 0;
      onStatus('connected');
    };

    this.source.onerror = () => {
      // If the server closed the stream after `done`, this onerror is the connection EOF —
      // do NOT reconnect; the execution is finished.
      if (this.completed) return;

      this.source?.close();
      this.source = null;
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= MAX_RECONNECT) {
        onStatus('error');
      } else {
        onStatus('connecting');
        const delay = BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, this.reconnectAttempts - 1);
        this.reconnectTimer = setTimeout(() => {
          this.openConnection(onEvent, onStatus);
        }, delay);
      }
    };
  }

  reconnect(): void {
    if (!this.executionId || !this.onEvent || !this.onStatus) return;
    this.reconnectAttempts = 0;
    this.openConnection(this.onEvent, this.onStatus);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.source) {
      this.source.close();
      this.source = null;
    }
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.executionId = null;
    this.onEvent = null;
    this.onStatus = null;
  }

  isConnected(): boolean {
    return this.source?.readyState === EventSource.OPEN;
  }

  private handleOnline = () => {
    if (this.executionId && this.onEvent && this.onStatus) {
      this.reconnectAttempts = 0;
      this.openConnection(this.onEvent, this.onStatus);
    }
  };

  private handleOffline = () => {
    if (this.source) {
      this.source.close();
      this.source = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.onStatus?.('error');
  };
}

export const sseService = new SSEService();
