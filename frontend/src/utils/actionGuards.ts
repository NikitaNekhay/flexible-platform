import type {
  StepAction,
  CommandAction,
  AtomicAction,
  BinaryAction,
  UploadAction,
  SliverRpcAction,
  PythonAction,
  ProbeAction,
} from '@/types';

export function isCommandAction(action: StepAction): action is CommandAction {
  return action.type === 'command';
}

export function isAtomicAction(action: StepAction): action is AtomicAction {
  return action.type === 'atomic';
}

export function isBinaryAction(action: StepAction): action is BinaryAction {
  return action.type === 'binary';
}

export function isUploadAction(action: StepAction): action is UploadAction {
  return action.type === 'upload';
}

export function isSliverRpcAction(action: StepAction): action is SliverRpcAction {
  return action.type === 'sliver_rpc';
}

export function isPythonAction(action: StepAction): action is PythonAction {
  return action.type === 'python';
}

export function isProbeAction(action: StepAction): action is ProbeAction {
  return action.type === 'probe';
}
