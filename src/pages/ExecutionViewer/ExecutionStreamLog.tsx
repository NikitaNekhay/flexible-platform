import { lazy, Suspense, useMemo } from 'react';
import { Box, Text, Loader, Center } from '@mantine/core';
import { useAppSelector } from '@/store/hooks';
import { selectStepCount } from '@/store/selectors/executionSelectors';
import type { StepExecutionStatus } from '@/types';

const TerminalPanel = lazy(() =>
  import('@/components/TerminalPanel').then((m) => ({ default: m.TerminalPanel })),
);

function formatLine(log: string): string {
  if (log.startsWith('[stderr]')) return `\x1b[31m${log}\x1b[0m`;
  if (log.startsWith('[error]'))  return `\x1b[1;31m${log}\x1b[0m`;
  if (log.startsWith('[skipped]')) return `\x1b[33m${log}\x1b[0m`;
  return log;
}

function stepLines(step: StepExecutionStatus): string[] {
  const lines: string[] = [];

  // Step header
  lines.push(`\x1b[1;36m── ${step.step_name || step.step_id} ──\x1b[0m`);

  // All log lines for this step
  for (const log of step.logs) {
    lines.push(formatLine(log));
  }

  // Completion footer
  if (step.status === 'done') {
    const exit = step.exit_code !== undefined ? ` (exit ${step.exit_code})` : '';
    const dur  = step.duration_ms ? ` ${step.duration_ms}ms` : '';
    lines.push(`\x1b[32m✓ done${exit}${dur}\x1b[0m`, '');
  } else if (step.status === 'failed') {
    const exit = step.exit_code !== undefined ? ` (exit ${step.exit_code})` : '';
    lines.push(`\x1b[1;31m✗ failed${exit}\x1b[0m`, '');
  } else if (step.status === 'skipped') {
    lines.push(`\x1b[33m⟶ skipped\x1b[0m`, '');
  }

  return lines;
}

export function ExecutionStreamLog() {
  const stepsStatus = useAppSelector((s) => s.execution.stepsStatus);
  const status      = useAppSelector((s) => s.execution.status);
  const stepCount   = useAppSelector(selectStepCount);

  /**
   * Derive a flat log array from Redux state on every relevant change.
   *
   * This produces a NEW array reference each time stepsStatus or status changes,
   * which is required by TerminalPanel: it tracks how many lines it has already
   * written via a ref (writtenCountRef) and only writes lines beyond that index.
   * If we passed a mutated array (same reference), the useEffect dependency in
   * TerminalPanel would never fire and new lines would never appear.
   */
  const logs = useMemo(() => {
    const lines: string[] = [];

    for (const step of Object.values(stepsStatus)) {
      // Skip truly pending steps with no output yet — nothing to show
      if (step.status === 'pending' && step.logs.length === 0) continue;
      lines.push(...stepLines(step));
    }

    if (status === 'done') {
      lines.push('\x1b[1;32m══════ Execution finished ══════\x1b[0m');
    } else if (status === 'failed') {
      lines.push('\x1b[1;31m══════ Execution failed ══════\x1b[0m');
    }

    return lines;
  }, [stepsStatus, status]);

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
        <TerminalPanel logs={logs} />
      </Suspense>
    </Box>
  );
}
