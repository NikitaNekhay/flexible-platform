import yaml from 'js-yaml';
import type { Chain, ChainCreatePayload, Step, StepAction, StepCondition } from '@/types';

const VALID_ACTION_TYPES = ['command', 'atomic', 'binary', 'upload', 'sliver_rpc', 'python', 'probe'] as const;
const VALID_ON_FAIL = ['abort', 'continue', 'continue_no_err', 'skip_dependents'] as const;

/**
 * Serialize a single step to YAML string.
 */
export function stepToYAML(step: Partial<Step>): string {
  return yaml.dump(step, { indent: 2, lineWidth: 120, noRefs: true });
}

/**
 * Parse a YAML string into a Step.
 * Applies action-type-specific validation so atomics are handled separately from commands etc.
 * Throws on invalid YAML or missing required fields.
 */
export function yamlToStep(yamlString: string): Step {
  const raw = yaml.load(yamlString, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>;
  if (!raw || typeof raw !== 'object') throw new Error('YAML must be a step object');

  const id = String(raw.id ?? '').trim();
  if (!id) throw new Error('Step must have an "id" field');

  const actionRaw = raw.action as Record<string, unknown> | undefined;
  if (!actionRaw || typeof actionRaw !== 'object') throw new Error('Step must have an "action" field');

  const actionType = String(actionRaw.type ?? '');
  if (!(VALID_ACTION_TYPES as readonly string[]).includes(actionType)) {
    throw new Error(`Unknown action type: "${actionType}". Valid types: ${VALID_ACTION_TYPES.join(', ')}`);
  }

  let action: StepAction;
  switch (actionType) {
    case 'atomic': {
      const ref = actionRaw.atomic_ref as Record<string, unknown> | undefined;
      if (!ref || typeof ref !== 'object') throw new Error('Atomic action must have an "atomic_ref" object');
      const refId = String(ref.id ?? '').trim();
      if (!refId) throw new Error('atomic_ref must have a non-empty "id" (technique ID, e.g. T1059.001)');
      const testIdx = typeof ref.test === 'number' ? ref.test : parseInt(String(ref.test ?? '0'), 10);
      if (isNaN(testIdx) || testIdx < 0) throw new Error('atomic_ref.test must be a non-negative integer');
      const args = (ref.args && typeof ref.args === 'object' && !Array.isArray(ref.args))
        ? (ref.args as Record<string, string>)
        : {};
      action = {
        type: 'atomic',
        atomic_ref: {
          id: refId,
          test: testIdx,
          args,
          ...(ref.name != null ? { name: String(ref.name) } : {}),
          ...(ref.guid != null ? { guid: String(ref.guid) } : {}),
        },
      };
      break;
    }
    default:
      // All other action types are user-controlled — pass through as-is
      action = actionRaw as unknown as StepAction;
  }

  const onFailRaw = String(raw.on_fail ?? 'abort');
  const onFail = (VALID_ON_FAIL as readonly string[]).includes(onFailRaw) ? onFailRaw as Step['on_fail'] : 'abort';

  // Parse conditions — backend uses var/op/value/negate
  const conditions: StepCondition[] = [];
  if (Array.isArray(raw.conditions)) {
    for (const c of raw.conditions as Record<string, unknown>[]) {
      if (c && typeof c === 'object') {
        conditions.push({
          var: String(c.var ?? ''),
          op: (c.op as StepCondition['op']) ?? 'eq',
          value: String(c.value ?? ''),
          ...(c.negate != null ? { negate: Boolean(c.negate) } : {}),
        });
      }
    }
  }

  return {
    id,
    name: String(raw.name ?? ''),
    depends_on: Array.isArray(raw.depends_on) ? (raw.depends_on as unknown[]).map(String) : [],
    on_fail: onFail,
    action,
    conditions,
    output_var: raw.output_var != null ? String(raw.output_var) : undefined,
    timeout: raw.timeout != null ? String(raw.timeout) : undefined,
    output_filter: raw.output_filter != null
      ? { regex: String((raw.output_filter as any).regex ?? ''), group: (raw.output_filter as any).group }
      : undefined,
    output_extract: Array.isArray(raw.output_extract)
      ? (raw.output_extract as any[]).map((e) => ({ var: String(e.var ?? ''), regex: String(e.regex ?? ''), group: e.group }))
      : undefined,
  };
}

/**
 * Serialize a Chain (or chain creation payload) to YAML string.
 * Field names match the backend chain.Step struct (output_var, on_fail, var/op/negate for conditions).
 */
export function chainToYAML(chain: Chain | ChainCreatePayload): string {
  const payload = {
    name: chain.name,
    description: chain.description,
    tags: chain.tags,
    mitre_tactics: chain.mitre_tactics,
    steps: (chain.steps ?? []).map((step) => {
      const s: Record<string, unknown> = {
        id: step.id,
        name: step.name,
        depends_on: step.depends_on,
        action: step.action,
        on_fail: step.on_fail,
      };
      if (step.conditions && step.conditions.length > 0) s.conditions = step.conditions;
      if (step.output_var) s.output_var = step.output_var;
      if (step.output_filter) s.output_filter = step.output_filter;
      if (step.output_extract && step.output_extract.length > 0) s.output_extract = step.output_extract;
      if (step.timeout) s.timeout = step.timeout;
      return s;
    }),
  };
  return yaml.dump(payload, { indent: 2, lineWidth: 120, noRefs: true });
}

/**
 * Parse a YAML string into a partial chain payload.
 * Throws on invalid YAML syntax.
 */
export function yamlToChain(yamlString: string): ChainCreatePayload {
  const parsed = yaml.load(yamlString, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('YAML must be an object');
  }

  const steps = Array.isArray(parsed.steps)
    ? (parsed.steps as Record<string, unknown>[]).map((s) => ({
        id: String(s.id || ''),
        name: String(s.name || ''),
        depends_on: Array.isArray(s.depends_on) ? (s.depends_on as unknown[]).map(String) : [],
        action: (s.action as Step['action']) ?? { type: 'command' as const, command: { interpreter: 'sh', cmd: '' } },
        conditions: Array.isArray(s.conditions)
          ? (s.conditions as Record<string, unknown>[]).map((c) => ({
              var: String(c.var ?? ''),
              op: (c.op as StepCondition['op']) ?? 'eq',
              value: String(c.value ?? ''),
              ...(c.negate != null ? { negate: Boolean(c.negate) } : {}),
            }))
          : [],
        output_var: s.output_var != null ? String(s.output_var) : undefined,
        output_filter: s.output_filter as Step['output_filter'],
        output_extract: Array.isArray(s.output_extract) ? (s.output_extract as Step['output_extract']) : undefined,
        timeout: s.timeout != null ? String(s.timeout) : undefined,
        on_fail: ((VALID_ON_FAIL as readonly string[]).includes(String(s.on_fail ?? ''))
          ? s.on_fail
          : 'abort') as Step['on_fail'],
      }))
    : [];

  return {
    name: String(parsed.name || 'Imported Scenario'),
    description: String(parsed.description || ''),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    mitre_tactics: Array.isArray(parsed.mitre_tactics)
      ? parsed.mitre_tactics.map(String)
      : [],
    steps,
  };
}
