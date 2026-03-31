export type StepStatusValue = 'pending' | 'running' | 'done' | 'failed' | 'skipped';
export type ExecutionStatusValue = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
export type StreamStatusValue = 'idle' | 'connecting' | 'connected' | 'error';

export interface StepExecutionStatus {
  step_id: string;
  step_name: string;
  status: StepStatusValue;
  started_at?: string;
  finished_at?: string;
  duration_ms?: number;
  exit_code?: number;
  logs: string[];
}

export interface Execution {
  id: string;
  chain_id: string;
  session_id: string;
  status: ExecutionStatusValue;
  started_at: string;
  finished_at?: string;
  steps: StepExecutionStatus[];
}

export interface ExecuteChainRequest {
  session_id: string;
  dry_run?: boolean;
}

export interface ExecuteChainResponse {
  execution_id: string;
}
