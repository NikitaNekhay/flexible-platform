import yaml from 'js-yaml';
import type {
  Chain,
  ChainCreatePayload,
  Step,
  StepAction,
  StepCondition,
  DepEntry,
} from '@/types';

const VALID_ACTION_TYPES = ['command', 'atomic', 'binary', 'upload', 'sliver_rpc', 'python', 'probe'] as const;
const VALID_ON_FAIL = ['abort', 'continue', 'continue_no_err', 'skip_dependents'] as const;

// ── Helpers for clean serialization ────────────────────────────────────────

/**
 * Recursively strip null, undefined, empty-string, empty-array and empty-object
 * values so the YAML output is minimal and clean.
 */
function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === 'object' && !Array.isArray(v)) {
      const cleaned = stripEmpty(v as Record<string, unknown>);
      if (Object.keys(cleaned).length > 0) out[k] = cleaned;
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Build a clean action object that only contains `type` + the active sub-field.
 * The backend Go struct serialises nil pointers as null in JSON; when we load a
 * chain from the API all seven sub-fields appear (six null, one populated).
 * This function strips the nulls so the YAML view is readable.
 */
function cleanAction(action: StepAction): Record<string, unknown> {
  const result: Record<string, unknown> = { type: action.type };
  const raw = action as unknown as Record<string, unknown>;

  // Map action type → the key that holds the payload
  const keyMap: Record<string, string> = {
    command: 'command',
    atomic: 'atomic_ref',
    binary: 'binary',
    upload: 'upload',
    sliver_rpc: 'sliver_rpc',
    python: 'python',
    probe: 'probe',
  };

  const payloadKey = keyMap[action.type];
  if (payloadKey && raw[payloadKey] != null) {
    const payload = raw[payloadKey];
    result[payloadKey] =
      typeof payload === 'object' && !Array.isArray(payload)
        ? stripEmpty(payload as Record<string, unknown>)
        : payload;
  }

  return result;
}

/**
 * Serialize a condition back to the explicit {var, op, value} format the
 * backend accepts.  Only includes non-default fields.
 */
function cleanCondition(c: StepCondition): Record<string, unknown> {
  const out: Record<string, unknown> = { var: c.var, op: c.op, value: c.value };
  if (c.negate) out.negate = true;
  return out;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Serialize a single step to YAML string.
 */
export function stepToYAML(step: Partial<Step>): string {
  const s = buildCleanStep(step as Step);
  return yaml.dump(s, { indent: 2, lineWidth: 120, noRefs: true });
}

function buildCleanStep(step: Step): Record<string, unknown> {
  const s: Record<string, unknown> = {
    id: step.id,
    name: step.name,
  };
  if (step.depends_on && step.depends_on.length > 0) s.depends_on = step.depends_on;
  if (step.action) s.action = cleanAction(step.action);
  if (step.conditions && step.conditions.length > 0) {
    const cleaned = step.conditions.filter((c) => c.var || c.value);
    if (cleaned.length > 0) s.conditions = cleaned.map(cleanCondition);
  }
  if (step.output_var) s.output_var = step.output_var;
  if (step.output_filter?.regex) s.output_filter = stripEmpty(step.output_filter as unknown as Record<string, unknown>);
  if (step.output_extract && step.output_extract.length > 0) s.output_extract = step.output_extract;
  if (step.timeout) s.timeout = step.timeout;
  s.on_fail = step.on_fail || 'abort';
  return s;
}

/**
 * Parse a YAML string into a Step.
 * Handles sigma-style conditions, complex depends_on, etc.
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
          ...(ref.name ? { name: String(ref.name) } : {}),
          ...(ref.guid ? { guid: String(ref.guid) } : {}),
        },
      };
      break;
    }
    default:
      // All other action types — build a clean object with only type + active sub-field
      action = buildActionFromRaw(actionType, actionRaw);
  }

  const onFailRaw = String(raw.on_fail ?? 'abort');
  const onFail = (VALID_ON_FAIL as readonly string[]).includes(onFailRaw) ? onFailRaw as Step['on_fail'] : 'abort';

  const conditions = parseConditions(raw.conditions);
  const dependsOn = parseDependsOn(raw.depends_on);

  return {
    id,
    name: String(raw.name ?? ''),
    depends_on: dependsOn,
    on_fail: onFail,
    action,
    conditions: conditions.length > 0 ? conditions : undefined,
    output_var: raw.output_var != null ? String(raw.output_var) : undefined,
    timeout: raw.timeout != null ? String(raw.timeout) : undefined,
    output_filter: parseOutputFilter(raw.output_filter),
    output_extract: parseOutputExtract(raw.output_extract),
  };
}

/**
 * Serialize a Chain (or chain creation payload) to YAML string.
 * Field names match the backend chain.Step struct.
 */
export function chainToYAML(chain: Chain | ChainCreatePayload): string {
  const payload: Record<string, unknown> = {
    name: chain.name,
  };
  if (chain.description) payload.description = chain.description;
  if (chain.tags && chain.tags.length > 0) payload.tags = chain.tags;
  if (chain.mitre_tactics && chain.mitre_tactics.length > 0) payload.mitre_tactics = chain.mitre_tactics;
  payload.steps = (chain.steps ?? []).map(buildCleanStep);
  return yaml.dump(payload, { indent: 2, lineWidth: 120, noRefs: true });
}

/**
 * Parse a YAML string into a partial chain payload.
 * Handles sigma-style conditions, complex depends_on, etc.
 * Throws on invalid YAML syntax.
 */
export function yamlToChain(yamlString: string): ChainCreatePayload {
  const parsed = yaml.load(yamlString, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>;

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('YAML must be an object');
  }

  const steps: Step[] = Array.isArray(parsed.steps)
    ? (parsed.steps as Record<string, unknown>[]).map(parseRawStep)
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

// ── Internal parsers ────────────────────────────────────────────────────────

function parseRawStep(s: Record<string, unknown>): Step {
  const actionRaw = (s.action as Record<string, unknown>) ?? { type: 'command', command: { interpreter: 'sh', cmd: '' } };
  const actionType = String(actionRaw.type ?? 'command');

  let action: StepAction;
  if (actionType === 'atomic') {
    const ref = actionRaw.atomic_ref as Record<string, unknown> | undefined;
    action = {
      type: 'atomic',
      atomic_ref: {
        id: String(ref?.id ?? ''),
        test: typeof ref?.test === 'number' ? ref.test : parseInt(String(ref?.test ?? '0'), 10),
        args: (ref?.args && typeof ref.args === 'object' && !Array.isArray(ref.args))
          ? (ref.args as Record<string, string>)
          : {},
        ...(ref?.name ? { name: String(ref.name) } : {}),
        ...(ref?.guid ? { guid: String(ref.guid) } : {}),
      },
    };
  } else {
    action = buildActionFromRaw(actionType, actionRaw);
  }

  const conditions = parseConditions(s.conditions);
  const onFailRaw = String(s.on_fail ?? 'abort');

  return {
    id: String(s.id || ''),
    name: String(s.name || ''),
    depends_on: parseDependsOn(s.depends_on),
    action,
    conditions: conditions.length > 0 ? conditions : undefined,
    output_var: s.output_var != null ? String(s.output_var) : undefined,
    output_filter: parseOutputFilter(s.output_filter),
    output_extract: parseOutputExtract(s.output_extract),
    timeout: s.timeout != null ? String(s.timeout) : undefined,
    on_fail: (VALID_ON_FAIL as readonly string[]).includes(onFailRaw) ? onFailRaw as Step['on_fail'] : 'abort',
  };
}

/**
 * Build a StepAction from a raw parsed YAML/JSON object.
 * Only includes type + the active sub-field (strips nulls from backend JSON).
 */
function buildActionFromRaw(type: string, raw: Record<string, unknown>): StepAction {
  const keyMap: Record<string, string> = {
    command: 'command',
    binary: 'binary',
    upload: 'upload',
    sliver_rpc: 'sliver_rpc',
    python: 'python',
    probe: 'probe',
  };

  const key = keyMap[type];
  if (key && raw[key] != null) {
    return { type, [key]: raw[key] } as unknown as StepAction;
  }

  // Fallback: return type + whatever non-null, non-type fields exist
  const result: Record<string, unknown> = { type };
  for (const [k, v] of Object.entries(raw)) {
    if (k === 'type' || v === null || v === undefined) continue;
    result[k] = v;
  }
  return result as unknown as StepAction;
}

/**
 * Parse conditions array — handles both explicit {var,op,value} and
 * sigma-style {"var|op": "value"} formats.  Skips empty/invalid entries.
 */
function parseConditions(raw: unknown): StepCondition[] {
  if (!Array.isArray(raw)) return [];
  const result: StepCondition[] = [];

  for (const item of raw) {
    const c = parseOneCondition(item);
    if (c) result.push(c);
  }
  return result;
}

function parseOneCondition(raw: unknown): StepCondition | null {
  // String form: "var|op: value" (rare but possible from some YAML parsers)
  if (typeof raw === 'string') {
    const pipe = raw.indexOf('|');
    if (pipe > 0) {
      const colon = raw.indexOf(':', pipe);
      if (colon > pipe) {
        const v = raw.substring(0, pipe).trim();
        const op = raw.substring(pipe + 1, colon).trim();
        const val = raw.substring(colon + 1).trim();
        if (v && op) return { var: v, op: op as StepCondition['op'], value: val };
      }
    }
    return null;
  }

  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  // Explicit {var, op, value} format (already correct)
  if (typeof obj.var === 'string' && typeof obj.op === 'string') {
    const v = obj.var.trim();
    const op = obj.op.trim();
    // Skip empty entries (e.g. {var:'', op:'eq', value:''})
    if (!v) return null;
    return {
      var: v,
      op: op as StepCondition['op'],
      value: String(obj.value ?? ''),
      ...(obj.negate ? { negate: true } : {}),
    };
  }

  // Sigma-style: {"victim_os|contains": "Linux"}
  // js-yaml parses `- victim_os|contains: Linux` as an object with one key
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'negate') continue;
    const pipe = key.indexOf('|');
    if (pipe > 0) {
      const varName = key.substring(0, pipe).trim();
      const op = key.substring(pipe + 1).trim();
      if (varName && op) {
        return {
          var: varName,
          op: op as StepCondition['op'],
          value: String(val ?? ''),
          ...(obj.negate ? { negate: true } : {}),
        };
      }
    }
  }

  return null;
}

/**
 * Parse depends_on — preserves both plain strings and {any:[...]}/{all:[...]} groups.
 */
function parseDependsOn(raw: unknown): DepEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item): DepEntry => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const entry: { any?: string[]; all?: string[] } = {};
      if (Array.isArray(obj.any)) entry.any = obj.any.map(String);
      if (Array.isArray(obj.all)) entry.all = obj.all.map(String);
      if (entry.any || entry.all) return entry;
    }
    // Fallback: coerce to string
    return String(item);
  });
}

function parseOutputFilter(raw: unknown): Step['output_filter'] {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  if (!obj.regex) return undefined;
  return { regex: String(obj.regex), group: typeof obj.group === 'number' ? obj.group : undefined };
}

function parseOutputExtract(raw: unknown): Step['output_extract'] {
  if (!Array.isArray(raw)) return undefined;
  const items = raw
    .filter((e) => e && typeof e === 'object')
    .map((e) => {
      const o = e as Record<string, unknown>;
      return {
        var: String(o.var ?? ''),
        regex: String(o.regex ?? ''),
        group: typeof o.group === 'number' ? o.group : undefined,
      };
    })
    .filter((e) => e.var && e.regex);
  return items.length > 0 ? items : undefined;
}
