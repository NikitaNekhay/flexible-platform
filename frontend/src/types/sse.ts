export interface SSEStepStart {
  event: 'step_start';
  step_id: string;
  step_name?: string;
  timestamp?: string;
}

export interface SSEStepDone {
  event: 'step_done';
  step_id: string;
  stdout?: string;
  stderr?: string;
  exit_code?: number;
  duration_ms?: number;
  timestamp?: string;
}

export interface SSEStepFailed {
  event: 'step_failed';
  step_id: string;
  stdout?: string;
  stderr?: string;
  error?: string;
  exit_code?: number;
  duration_ms?: number;
  timestamp?: string;
}

export interface SSEStepSkipped {
  event: 'step_skipped';
  step_id: string;
  message?: string;
  timestamp?: string;
}

export interface SSEStepLog {
  event: 'step_log';
  step_id: string;
  status: string;
  stdout?: string;
  stderr?: string;
  error?: string;
  exit_code?: number;
  duration_ms?: number;
  timestamp?: string;
}

export interface SSEChainDone {
  event: 'chain_done';
  message?: string;
  status?: string;
  timestamp?: string;
}

export interface SSEChainFailed {
  event: 'chain_failed';
  message?: string;
  status?: string;
  timestamp?: string;
}

export interface SSEDone {
  event: 'done';
  status?: string;
}

export type SSEEvent =
  | SSEStepStart
  | SSEStepDone
  | SSEStepFailed
  | SSEStepSkipped
  | SSEStepLog
  | SSEChainDone
  | SSEChainFailed
  | SSEDone;
