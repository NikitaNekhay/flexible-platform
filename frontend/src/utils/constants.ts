import type { ActionType, OnFailBehavior } from '@/types';

export const ACTION_TYPES: { value: ActionType; label: string }[] = [
  { value: 'command', label: 'editor:action_types.command' },
  { value: 'atomic', label: 'editor:action_types.atomic' },
  { value: 'binary', label: 'editor:action_types.binary' },
  { value: 'upload', label: 'editor:action_types.upload' },
  { value: 'sliver_rpc', label: 'editor:action_types.sliver_rpc' },
  { value: 'python', label: 'editor:action_types.python' },
  { value: 'probe', label: 'editor:action_types.probe' },
];

export const ON_FAIL_OPTIONS: { value: OnFailBehavior; label: string }[] = [
  { value: 'abort', label: 'editor:on_fail_options.abort' },
  { value: 'continue', label: 'editor:on_fail_options.continue' },
  { value: 'continue_no_err', label: 'editor:on_fail_options.continue_no_err' },
  { value: 'skip_dependents', label: 'editor:on_fail_options.skip_dependents' },
];

export const MITRE_TACTICS: Record<string, { label: string; color: string }> = {
  reconnaissance: { label: 'Reconnaissance', color: 'blue' },
  'resource-development': { label: 'Resource Development', color: 'indigo' },
  'initial-access': { label: 'Initial Access', color: 'violet' },
  execution: { label: 'Execution', color: 'grape' },
  persistence: { label: 'Persistence', color: 'pink' },
  'privilege-escalation': { label: 'Privilege Escalation', color: 'red' },
  'defense-evasion': { label: 'Defense Evasion', color: 'orange' },
  'credential-access': { label: 'Credential Access', color: 'yellow' },
  discovery: { label: 'Discovery', color: 'lime' },
  'lateral-movement': { label: 'Lateral Movement', color: 'green' },
  collection: { label: 'Collection', color: 'teal' },
  'command-and-control': { label: 'Command and Control', color: 'cyan' },
  exfiltration: { label: 'Exfiltration', color: 'blue' },
  impact: { label: 'Impact', color: 'red' },
};

export const MAX_STEPS = 30;
