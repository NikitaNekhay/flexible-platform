export type ActionType =
  | 'command'
  | 'atomic'
  | 'binary'
  | 'upload'
  | 'sliver_rpc'
  | 'python'
  | 'probe';

export interface CommandAction {
  type: 'command';
  executor: string;
  command: string;
}

export interface AtomicAction {
  type: 'atomic';
  technique_id: string;
  test_index: number;
  arguments: Record<string, string>;
}

export interface BinaryAction {
  type: 'binary';
  source: 'url' | 'upload';
  url?: string;
  file_ref?: string;
  destination_path: string;
  execute_after_upload: boolean;
}

export interface UploadAction {
  type: 'upload';
  source: 'url' | 'upload';
  url?: string;
  file_ref?: string;
  destination_path: string;
}

export interface SliverRpcAction {
  type: 'sliver_rpc';
  rpc_method: string;
  params: Record<string, unknown>;
}

export interface PythonAction {
  type: 'python';
  script: string;
  args?: string[];
}

export interface ProbeAction {
  type: 'probe';
  probe_type: string;
  target: string;
  expected_result: string;
  timeout_seconds: number;
}

export type StepAction =
  | CommandAction
  | AtomicAction
  | BinaryAction
  | UploadAction
  | SliverRpcAction
  | PythonAction
  | ProbeAction;

export type OnFailBehavior = 'stop' | 'continue' | 'skip_dependents';

export interface StepCondition {
  variable: string;
  operator: 'eq' | 'neq' | 'contains' | 'regex';
  value: string;
}

export interface Step {
  id: string;
  name: string;
  depends_on: string[];
  action: StepAction;
  conditions?: StepCondition[];
  output_vars?: string[];
  on_fail: OnFailBehavior;
}

export interface Chain {
  id: string;
  name: string;
  description: string;
  tags: string[];
  mitre_tactics: string[];
  steps: Step[];
  created_at: string;
  updated_at: string;
  validated: boolean;
}

export type ChainCreatePayload = Omit<Chain, 'id' | 'created_at' | 'updated_at' | 'validated'>;
export type ChainUpdatePayload = Partial<ChainCreatePayload>;
