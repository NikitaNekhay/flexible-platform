import yaml from 'js-yaml';
import type { Chain, ChainCreatePayload, Step } from '@/types';

/**
 * Serialize a Chain (or chain creation payload) to YAML string.
 */
export function chainToYAML(chain: Chain | ChainCreatePayload): string {
  const payload = {
    name: chain.name,
    description: chain.description,
    tags: chain.tags,
    mitre_tactics: chain.mitre_tactics,
    steps: (chain.steps ?? []).map((step) => ({
      id: step.id,
      name: step.name,
      depends_on: step.depends_on,
      action: step.action,
      ...(step.conditions && step.conditions.length > 0
        ? { conditions: step.conditions }
        : {}),
      ...(step.output_vars && step.output_vars.length > 0
        ? { output_vars: step.output_vars }
        : {}),
      on_fail: step.on_fail,
    })),
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
    ? (parsed.steps as Step[]).map((s) => ({
        id: String(s.id || ''),
        name: String(s.name || ''),
        depends_on: Array.isArray(s.depends_on)
          ? s.depends_on.map(String)
          : [],
        action: s.action ?? { type: 'command' as const, command: { interpreter: 'sh', cmd: '' } },
        conditions: Array.isArray(s.conditions) ? s.conditions : [],
        output_vars: Array.isArray(s.output_vars) ? s.output_vars : [],
        on_fail: (s.on_fail as Step['on_fail']) || 'stop',
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
