import { describe, it, expect } from 'vitest';
import { detectCycle, findMissingDeps, findDuplicateIds, validateDAG, topologicalSort, flattenDeps } from './dagUtils';
import type { Step } from '@/types';

function makeStep(id: string, deps: string[] = []): Step {
  return {
    id,
    name: id,
    depends_on: deps,
    action: { type: 'command', command: { interpreter: 'sh', cmd: 'echo' } },
    on_fail: 'abort',
  };
}

describe('flattenDeps', () => {
  it('flattens plain strings', () => {
    expect(flattenDeps(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('flattens {any: [...]} groups', () => {
    expect(flattenDeps(['a', { any: ['b', 'c'] }])).toEqual(['a', 'b', 'c']);
  });

  it('flattens {all: [...]} groups', () => {
    expect(flattenDeps([{ all: ['x', 'y'] }])).toEqual(['x', 'y']);
  });
});

describe('detectCycle', () => {
  it('returns empty for no steps', () => {
    expect(detectCycle([])).toEqual([]);
  });

  it('returns empty for linear chain', () => {
    const steps = [makeStep('a'), makeStep('b', ['a']), makeStep('c', ['b'])];
    expect(detectCycle(steps)).toEqual([]);
  });

  it('returns empty for independent steps', () => {
    const steps = [makeStep('a'), makeStep('b'), makeStep('c')];
    expect(detectCycle(steps)).toEqual([]);
  });

  it('detects a simple cycle', () => {
    const steps = [makeStep('a', ['b']), makeStep('b', ['a'])];
    const cycle = detectCycle(steps);
    expect(cycle).toContain('a');
    expect(cycle).toContain('b');
  });

  it('detects cycle in larger graph', () => {
    const steps = [
      makeStep('a'),
      makeStep('b', ['a']),
      makeStep('c', ['b']),
      makeStep('d', ['c', 'b']),
      makeStep('e', ['d']),
    ];
    expect(detectCycle(steps)).toEqual([]);

    const withCycle = [
      makeStep('a'),
      makeStep('b', ['a', 'e']),
      makeStep('c', ['b']),
      makeStep('d', ['c']),
      makeStep('e', ['d']),
    ];
    const cycle = detectCycle(withCycle);
    expect(cycle.length).toBeGreaterThan(0);
    expect(cycle).toContain('b');
  });

  it('ignores deps to non-existent steps', () => {
    const steps = [makeStep('a', ['nonexistent']), makeStep('b', ['a'])];
    expect(detectCycle(steps)).toEqual([]);
  });
});

describe('findMissingDeps', () => {
  it('returns empty when all deps exist', () => {
    const steps = [makeStep('a'), makeStep('b', ['a'])];
    expect(findMissingDeps(steps)).toEqual([]);
  });

  it('finds missing deps', () => {
    const steps = [makeStep('a', ['x']), makeStep('b', ['a', 'y'])];
    const missing = findMissingDeps(steps);
    expect(missing).toEqual([
      { stepId: 'a', missingDep: 'x' },
      { stepId: 'b', missingDep: 'y' },
    ]);
  });

  it('returns empty for no deps', () => {
    const steps = [makeStep('a'), makeStep('b')];
    expect(findMissingDeps(steps)).toEqual([]);
  });
});

describe('findDuplicateIds', () => {
  it('returns empty for unique ids', () => {
    expect(findDuplicateIds([makeStep('a'), makeStep('b')])).toEqual([]);
  });

  it('finds duplicates', () => {
    expect(findDuplicateIds([makeStep('a'), makeStep('b'), makeStep('a')])).toEqual(['a']);
  });
});

describe('validateDAG', () => {
  it('returns valid for correct graph', () => {
    const steps = [makeStep('a'), makeStep('b', ['a']), makeStep('c', ['b'])];
    const result = validateDAG(steps);
    expect(result.valid).toBe(true);
    expect(result.cycleNodes).toEqual([]);
    expect(result.missingDeps).toEqual([]);
    expect(result.duplicateIds).toEqual([]);
  });

  it('returns invalid for graph with issues', () => {
    const steps = [makeStep('a', ['b']), makeStep('b', ['a']), makeStep('a', ['missing'])];
    const result = validateDAG(steps);
    expect(result.valid).toBe(false);
  });
});

describe('topologicalSort', () => {
  it('returns null for cyclic graph', () => {
    const steps = [makeStep('a', ['b']), makeStep('b', ['a'])];
    expect(topologicalSort(steps)).toBeNull();
  });

  it('returns correct order for linear chain', () => {
    const steps = [makeStep('c', ['b']), makeStep('a'), makeStep('b', ['a'])];
    const sorted = topologicalSort(steps);
    expect(sorted).not.toBeNull();
    expect(sorted!.indexOf('a')).toBeLessThan(sorted!.indexOf('b'));
    expect(sorted!.indexOf('b')).toBeLessThan(sorted!.indexOf('c'));
  });

  it('returns single element for one step', () => {
    expect(topologicalSort([makeStep('only')])).toEqual(['only']);
  });

  it('returns empty for no steps', () => {
    expect(topologicalSort([])).toEqual([]);
  });
});
