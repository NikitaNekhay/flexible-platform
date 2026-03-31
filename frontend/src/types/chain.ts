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
  };
}

export interface SliverRpcAction {
  type: 'sliver_rpc';
  rpc_method: string;
  params: Record<string, unknown>;
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
