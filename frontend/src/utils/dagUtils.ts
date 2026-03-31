import type { Step } from '@/types';

export interface DAGValidationResult {
  valid: boolean;
  cycleNodes: string[];
  missingDeps: Array<{ stepId: string; missingDep: string }>;
  duplicateIds: string[];
}

/**
 * Kahn's algorithm (BFS topological sort) for cycle detection.
 * Returns IDs of nodes involved in cycles, or empty array if acyclic.
 */
export function detectCycle(steps: Step[]): string[] {
  const ids = new Set(steps.map((s) => s.id));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const step of steps) {
    inDegree.set(step.id, 0);
    adj.set(step.id, []);
  }

  for (const step of steps) {
    for (const dep of step.depends_on) {
      if (ids.has(dep)) {
        adj.get(dep)!.push(step.id);
        inDegree.set(step.id, (inDegree.get(step.id) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighbor of adj.get(node) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length === steps.length) return [];
  const sortedSet = new Set(sorted);
  return steps.map((s) => s.id).filter((id) => !sortedSet.has(id));
}

/**
 * Find depends_on references that point to non-existent step IDs.
 */
export function findMissingDeps(
  steps: Step[],
): Array<{ stepId: string; missingDep: string }> {
  const ids = new Set(steps.map((s) => s.id));
  const missing: Array<{ stepId: string; missingDep: string }> = [];
  for (const step of steps) {
    for (const dep of step.depends_on) {
      if (!ids.has(dep)) {
        missing.push({ stepId: step.id, missingDep: dep });
      }
    }
  }
  return missing;
}

/**
 * Find duplicate step IDs.
 */
export function findDuplicateIds(steps: Step[]): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const step of steps) {
    if (seen.has(step.id)) {
      dupes.push(step.id);
    }
    seen.add(step.id);
  }
  return dupes;
}

/**
 * Run all DAG validations on the step list.
 */
export function validateDAG(steps: Step[]): DAGValidationResult {
  const cycleNodes = detectCycle(steps);
  const missingDeps = findMissingDeps(steps);
  const duplicateIds = findDuplicateIds(steps);

  return {
    valid: cycleNodes.length === 0 && missingDeps.length === 0 && duplicateIds.length === 0,
    cycleNodes,
    missingDeps,
    duplicateIds,
  };
}

/**
 * Topological sort — returns step IDs in execution order.
 * Returns null if the graph contains a cycle.
 */
export function topologicalSort(steps: Step[]): string[] | null {
  const cycleNodes = detectCycle(steps);
  if (cycleNodes.length > 0) return null;

  const ids = new Set(steps.map((s) => s.id));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const step of steps) {
    inDegree.set(step.id, 0);
    adj.set(step.id, []);
  }

  for (const step of steps) {
    for (const dep of step.depends_on) {
      if (ids.has(dep)) {
        adj.get(dep)!.push(step.id);
        inDegree.set(step.id, (inDegree.get(step.id) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);
    for (const neighbor of adj.get(node) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  return sorted;
}
