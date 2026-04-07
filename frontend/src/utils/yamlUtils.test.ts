import { describe, it, expect } from 'vitest';
import { chainToYAML, yamlToChain } from './yamlUtils';
import type { ChainCreatePayload } from '@/types';

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
      conditions: [],
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
    const yaml = chainToYAML(sampleChain);
    expect(yaml).toContain('name: Test Scenario');
    expect(yaml).toContain('description: A test chain');
    expect(yaml).toContain('step-1');
    expect(yaml).toContain('step-2');
    expect(yaml).toContain('echo hello');
  });

  it('omits empty conditions and output_var', () => {
    const yaml = chainToYAML(sampleChain);
    // step-1 has no conditions/output_var, they should not appear
    const step1Section = yaml.split('step-2')[0];
    expect(step1Section).not.toContain('conditions');
    expect(step1Section).not.toContain('output_var');
  });

  it('includes non-empty conditions and output_var', () => {
    const yaml = chainToYAML(sampleChain);
    // step-2 has conditions and output_var
    const step2Section = yaml.split('step-2')[1];
    expect(step2Section).toContain('conditions');
    expect(step2Section).toContain('output_var');
  });
});

describe('yamlToChain', () => {
  it('round-trips a chain through YAML', () => {
    const yaml = chainToYAML(sampleChain);
    const parsed = yamlToChain(yaml);

    expect(parsed.name).toBe('Test Scenario');
    expect(parsed.description).toBe('A test chain');
    expect(parsed.tags).toEqual(['test', 'demo']);
    expect(parsed.mitre_tactics).toEqual(['execution']);
    expect(parsed.steps).toHaveLength(2);
    expect(parsed.steps[0].id).toBe('step-1');
    expect(parsed.steps[1].depends_on).toEqual(['step-1']);
  });

  it('handles missing optional fields', () => {
    const yaml = `
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
    const parsed = yamlToChain(yaml);
    expect(parsed.name).toBe('Minimal');
    expect(parsed.description).toBe('');
    expect(parsed.tags).toEqual([]);
    expect(parsed.mitre_tactics).toEqual([]);
    expect(parsed.steps[0].depends_on).toEqual([]);
    expect(parsed.steps[0].on_fail).toBe('abort');
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
