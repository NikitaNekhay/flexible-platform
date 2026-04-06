import { lazy, Suspense, useRef } from 'react';
import { Box, Text, Loader, Center } from '@mantine/core';
import { useAppSelector } from '@/store/hooks';
import { selectStepCount } from '@/store/selectors/executionSelectors';
import type { StepExecutionStatus } from '@/types';

const TerminalPanel = lazy(() =>
  import('@/components/TerminalPanel').then((m) => ({ default: m.TerminalPanel })),
);

function formatStepLogs(step: StepExecutionStatus, logStartIndex: number): string[] {
  const lines: string[] = [];

  if (logStartIndex === 0) {
    lines.push(`\x1b[1;36m── ${step.step_name || step.step_id} ──\x1b[0m`);
  }

  for (let i = logStartIndex; i < step.logs.length; i++) {
    const log = step.logs[i];
    if (log.startsWith('[stderr]')) {
      lines.push(`\x1b[31m${log}\x1b[0m`);
    } else if (log.startsWith('[error]')) {
      lines.push(`\x1b[1;31m${log}\x1b[0m`);
    } else if (log.startsWith('[skipped]')) {
      lines.push(`\x1b[33m${log}\x1b[0m`);
    } else {
      lines.push(log);
    }
  }

  return lines;
}

function formatStepFinish(step: StepExecutionStatus): string[] {
  if (step.status === 'done') {
    const exitInfo = step.exit_code !== undefined ? ` (exit ${step.exit_code})` : '';
    const durInfo = step.duration_ms ? ` ${step.duration_ms}ms` : '';
    return [`\x1b[32m✓ done${exitInfo}${durInfo}\x1b[0m`, ''];
  }
  if (step.status === 'failed') {
    const exitInfo = step.exit_code !== undefined ? ` (exit ${step.exit_code})` : '';
    return [`\x1b[1;31m✗ failed${exitInfo}\x1b[0m`, ''];
  }
  return [];
}

/** Tracks per-step processed state for incremental log building. */
interface StepSnapshot {
  logCount: number;
  status: string;
}

export function ExecutionStreamLog() {
  const stepsStatus = useAppSelector((s) => s.execution.stepsStatus);
  const status = useAppSelector((s) => s.execution.status);
  const stepCount = useAppSelector(selectStepCount);

  const logsRef = useRef<string[]>([]);
  const snapshotsRef = useRef<Record<string, StepSnapshot>>({});
  const prevExecStatusRef = useRef<string>('');

  // Incrementally append only new lines
  for (const [stepId, step] of Object.entries(stepsStatus)) {
    if (step.status === 'pending' && step.logs.length === 0) continue;

    const prev = snapshotsRef.current[stepId];
    const prevLogCount = prev?.logCount ?? 0;
    const prevStatus = prev?.status ?? '';

    // New logs since last render
    if (step.logs.length > prevLogCount || !prev) {
      const newLines = formatStepLogs(step, prevLogCount);
      logsRef.current.push(...newLines);
    }

    // Step finished since last render
    if (step.status !== prevStatus && (step.status === 'done' || step.status === 'failed')) {
      logsRef.current.push(...formatStepFinish(step));
    }

    snapshotsRef.current[stepId] = { logCount: step.logs.length, status: step.status };
  }

  // Execution-level finish line
  if (status !== prevExecStatusRef.current) {
    if (status === 'done') {
      logsRef.current.push('\x1b[1;32m═══ Execution finished ═══\x1b[0m');
    } else if (status === 'failed') {
      logsRef.current.push('\x1b[1;31m═══ Execution failed ═══\x1b[0m');
    }
    prevExecStatusRef.current = status;
  }

  if (stepCount === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Waiting for execution output...
      </Text>
    );
  }

  return (
    <Box
      style={{
        minHeight: 200,
        height: 'clamp(200px, 40vh, 500px)',
        border: '1px solid var(--mantine-color-dark-4)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <Suspense fallback={<Center h="100%"><Loader size="sm" /></Center>}>
        <TerminalPanel logs={logsRef.current} />
      </Suspense>
    </Box>
  );
}
