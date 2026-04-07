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
  command: {
    interpreter: string;
    cmd: string;
  };
}

export interface AtomicAction {
  type: 'atomic';
  atomic_ref: {
    id: string;
    test: number;
    name?: string;
    guid?: string;
    args: Record<string, string>;
  };
}

export interface BinaryAction {
  type: 'binary';
  binary: {
    data?: string;
    url?: string;
    remote_path: string;
    args?: string;
    platform?: string;
    cleanup?: boolean;
  };
}

export interface UploadAction {
  type: 'upload';
  upload: {
    local_path?: string;
    remote_path: string;
    execute?: boolean;
  };
}

// Nested under "sliver_rpc" key — matches backend Action.RPCAction json:"sliver_rpc"
export interface SliverRpcAction {
  type: 'sliver_rpc';
  sliver_rpc: {
    method: string;
    params: Record<string, string>;
  };
}

export interface PythonAction {
  type: 'python';
  python: {
    script?: string;
    inline?: string;
    args?: string[];
    env?: Record<string, string>;
  };
}

export interface ProbeAction {
  type: 'probe';
  probe: {
    kind: string;
    software?: string;
    match?: string;
    platform?: string;
  };
}

export type StepAction =
  | CommandAction
  | AtomicAction
  | BinaryAction
  | UploadAction
  | SliverRpcAction
  | PythonAction
  | ProbeAction;

// Backend FailPolicy values: abort | continue | continue_no_err | skip_dependents
export type OnFailBehavior = 'abort' | 'continue' | 'continue_no_err' | 'skip_dependents';

// Matches backend Condition struct: var/op/value/negate
export interface StepCondition {
  var: string;
  op: 'eq' | 'neq' | 'contains' | 'matches' | 'gt' | 'lt';
  value: string;
  negate?: boolean;
}

// Matches backend OutputFilter struct
export interface OutputFilter {
  regex: string;
  group?: number;
}

// Matches backend OutputCapture struct
export interface OutputCapture {
  var: string;
  regex: string;
  group?: number;
}

export interface Step {
  id: string;
  name: string;
  depends_on: string[];
  action: StepAction;
  conditions?: StepCondition[];
  // Single variable name — backend field is output_var (string), not output_vars (array)
  output_var?: string;
  output_filter?: OutputFilter;
  output_extract?: OutputCapture[];
  timeout?: string; // e.g. "30s", "5m"
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
