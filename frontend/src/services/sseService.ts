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

const MAX_RECONNECT = 3;

type SSEEventCallback = (event: SSEEvent) => void;
type SSEStatusCallback = (status: StreamStatusValue) => void;

class SSEService {
  private source: EventSource | null = null;
  private reconnectAttempts = 0;

  connect(
    executionId: string,
    onEvent: SSEEventCallback,
    onStatus: SSEStatusCallback,
  ): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    onStatus('connecting');

    this.source = new EventSource(`/api/v1/executions/${executionId}/stream`);

    SSE_EVENTS.forEach((eventName) => {
      this.source!.addEventListener(eventName, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          onEvent({ ...data, event: eventName } as SSEEvent);
        } catch {
          console.error(`[SSE] Failed to parse ${eventName} event:`, e.data);
        }
      });
    });

    this.source.onopen = () => {
      this.reconnectAttempts = 0;
      onStatus('connected');
    };

    this.source.onerror = () => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= MAX_RECONNECT) {
        this.disconnect();
        onStatus('error');
      } else {
        onStatus('connecting');
      }
    };
  }

  disconnect(): void {
    if (this.source) {
      this.source.close();
      this.source = null;
    }
  }

  isConnected(): boolean {
    return this.source?.readyState === EventSource.OPEN;
  }
}

export const sseService = new SSEService();
