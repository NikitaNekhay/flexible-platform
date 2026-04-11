import { describe, it, expect } from 'vitest';
import { chainToYAML, yamlToChain, yamlToStep, stepToYAML } from './yamlUtils';
import type { ChainCreatePayload, Step } from '@/types';

const sampleChain: ChainCreatePayload = {
  name: 'Test Scenario',
  description: 'A test chain',
  tags: ['test', 'demo'],
  mitre_tactics: ['execution'],
  steps: [
    {
      id: 'step-1',
      name: 'Run command',
      depends_on: [],
      action: { type: 'command', command: { interpreter: 'bash', cmd: 'echo hello' } },
      on_fail: 'abort',
    },
    {
      id: 'step-2',
      name: 'Second step',
      depends_on: ['step-1'],
      action: { type: 'command', command: { interpreter: 'sh', cmd: 'ls' } },
      conditions: [{ var: 'exit_code', op: 'eq', value: '0' }],
      output_var: 'files',
      on_fail: 'continue',
    },
  ],
};

describe('chainToYAML', () => {
  it('serializes a chain to valid YAML', () => {
    const y = chainToYAML(sampleChain);
    expect(y).toContain('name: Test Scenario');
    expect(y).toContain('description: A test chain');
    expect(y).toContain('step-1');
    expect(y).toContain('step-2');
    expect(y).toContain('echo hello');
  });

  it('omits empty conditions and output_var', () => {
    const y = chainToYAML(sampleChain);
    // step-1 has no conditions/output_var, they should not appear
    const step1Section = y.split('step-2')[0];
    expect(step1Section).not.toContain('conditions');
    expect(step1Section).not.toContain('output_var');
  });

  it('includes non-empty conditions and output_var', () => {
    const y = chainToYAML(sampleChain);
    const step2Section = y.split('step-2')[1];
    expect(step2Section).toContain('conditions');
    expect(step2Section).toContain('output_var');
  });

  it('does NOT include null sub-fields on action', () => {
    // Simulate what backend returns: action with all null sub-fields
    const chainWithNulls: ChainCreatePayload = {
      name: 'Test',
      description: '',
      tags: [],
      mitre_tactics: [],
      steps: [{
        id: 's1',
        name: 'probe step',
        depends_on: [],
        action: {
          type: 'probe',
          probe: { kind: 'os', platform: 'linux' },
          // These would be null from backend JSON
          command: null,
          atomic_ref: null,
          upload: null,
          binary: null,
          python: null,
          sliver_rpc: null,
        } as any,
        on_fail: 'abort',
      }],
    };
    const y = chainToYAML(chainWithNulls);
    expect(y).not.toContain('command: null');
    expect(y).not.toContain('atomic_ref: null');
    expect(y).not.toContain('upload: null');
    expect(y).not.toContain('binary: null');
    expect(y).not.toContain('python: null');
    expect(y).not.toContain('sliver_rpc: null');
    expect(y).toContain('kind: os');
  });

  it('preserves {any: [...]} in depends_on', () => {
    const chain: ChainCreatePayload = {
      name: 'T',
      description: '',
      tags: [],
      mitre_tactics: [],
      steps: [{
        id: 'final',
        name: 'last',
        depends_on: ['step-a', { any: ['step-b', 'step-c'] }],
        action: { type: 'command', command: { interpreter: 'sh', cmd: 'echo done' } },
        on_fail: 'abort',
      }],
    };
    const y = chainToYAML(chain);
    expect(y).toContain('step-a');
    expect(y).toContain('any:');
    expect(y).toContain('step-b');
    expect(y).toContain('step-c');
  });
});

describe('yamlToChain', () => {
  it('round-trips a chain through YAML', () => {
    const y = chainToYAML(sampleChain);
    const parsed = yamlToChain(y);

    expect(parsed.name).toBe('Test Scenario');
    expect(parsed.description).toBe('A test chain');
    expect(parsed.tags).toEqual(['test', 'demo']);
    expect(parsed.mitre_tactics).toEqual(['execution']);
    expect(parsed.steps).toHaveLength(2);
    expect(parsed.steps[0].id).toBe('step-1');
    expect(parsed.steps[1].depends_on).toEqual(['step-1']);
  });

  it('handles missing optional fields', () => {
    const y = `
name: Minimal
steps:
  - id: s1
    name: Only step
    action:
      type: command
      command:
        interpreter: sh
        cmd: echo
`;
    const parsed = yamlToChain(y);
    expect(parsed.name).toBe('Minimal');
    expect(parsed.description).toBe('');
    expect(parsed.tags).toEqual([]);
    expect(parsed.mitre_tactics).toEqual([]);
    expect(parsed.steps[0].depends_on).toEqual([]);
    expect(parsed.steps[0].on_fail).toBe('abort');
  });

  it('parses sigma-style conditions', () => {
    const y = `
name: Sigma
steps:
  - id: s1
    name: test
    action:
      type: command
      command:
        interpreter: sh
        cmd: echo
    conditions:
      - victim_os|contains: Linux
      - exit_code|eq: "0"
`;
    const parsed = yamlToChain(y);
    expect(parsed.steps[0].conditions).toHaveLength(2);
    expect(parsed.steps[0].conditions![0]).toEqual({
      var: 'victim_os',
      op: 'contains',
      value: 'Linux',
    });
    expect(parsed.steps[0].conditions![1]).toEqual({
      var: 'exit_code',
      op: 'eq',
      value: '0',
    });
  });

  it('preserves complex depends_on with {any: [...]}', () => {
    const y = `
name: Complex Deps
steps:
  - id: final
    name: last
    depends_on:
      - step-a
      - {any: [step-b, step-c]}
    action:
      type: command
      command:
        interpreter: sh
        cmd: echo done
`;
    const parsed = yamlToChain(y);
    expect(parsed.steps[0].depends_on).toHaveLength(2);
    expect(parsed.steps[0].depends_on[0]).toBe('step-a');
    expect(parsed.steps[0].depends_on[1]).toEqual({ any: ['step-b', 'step-c'] });
  });

  it('defaults name when missing', () => {
    const parsed = yamlToChain('steps: []');
    expect(parsed.name).toBe('Imported Scenario');
  });

  it('throws on invalid YAML', () => {
    expect(() => yamlToChain('{')).toThrow();
  });

  it('throws on non-object YAML', () => {
    expect(() => yamlToChain('just a string')).toThrow('YAML must be an object');
  });
});

describe('stepToYAML / yamlToStep', () => {
  it('round-trips a command step', () => {
    const step: Step = {
      id: 'test',
      name: 'Test step',
      depends_on: [],
      action: { type: 'command', command: { interpreter: 'sh', cmd: 'echo hi' } },
      on_fail: 'abort',
    };
    const y = stepToYAML(step);
    const parsed = yamlToStep(y);
    expect(parsed.id).toBe('test');
    expect(parsed.action.type).toBe('command');
  });

  it('round-trips a step with output_var and timeout', () => {
    const step: Step = {
      id: 'probe_os',
      name: 'Probe OS',
      depends_on: [],
      action: { type: 'probe', probe: { kind: 'os', platform: 'linux' } },
      output_var: 'victim_os',
      timeout: '30s',
      on_fail: 'abort',
    };
    const y = stepToYAML(step);
    const parsed = yamlToStep(y);
    expect(parsed.output_var).toBe('victim_os');
    expect(parsed.timeout).toBe('30s');
  });
});
