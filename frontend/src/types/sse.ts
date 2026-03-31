export interface SSEStepStart {
  event: 'step_start';
  step_id: string;
  step_name: string;
  timestamp: string;
}

export interface SSEStepDone {
  event: 'step_done';
  step_id: string;
  exit_code: number;
  duration_ms: number;
  timestamp: string;
}

export interface SSEStepFailed {
  event: 'step_failed';
  step_id: string;
  error: string;
  exit_code?: number;
  duration_ms: number;
  timestamp: string;
}

export interface SSEStepLog {
  event: 'step_log';
  step_id: string;
  line: string;
  timestamp: string;
}

export interface SSEChainDone {
  event: 'chain_done';
  execution_id: string;
  duration_ms: number;
  timestamp: string;
}

export interface SSEChainFailed {
  event: 'chain_failed';
  execution_id: string;
  error: string;
  failed_step_id: string;
  timestamp: string;
}

export type SSEEvent =
  | SSEStepStart
  | SSEStepDone
  | SSEStepFailed
  | SSEStepLog
  | SSEChainDone
  | SSEChainFailed;
