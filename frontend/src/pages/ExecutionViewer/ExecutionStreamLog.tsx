import { useMemo } from 'react';
import { Box, Text } from '@mantine/core';
import { useAppSelector } from '@/store/hooks';
import { TerminalPanel } from '@/components/TerminalPanel';

export function ExecutionStreamLog() {
  const stepsStatus = useAppSelector((s) => s.execution.stepsStatus);
  const status = useAppSelector((s) => s.execution.status);

  const allLogs = useMemo(() => {
    const lines: string[] = [];
    for (const step of Object.values(stepsStatus)) {
      if (step.logs.length === 0 && step.status === 'pending') continue;

      lines.push(`\x1b[1;36m── ${step.step_name || step.step_id} ──\x1b[0m`);

      if (step.status === 'running') {
        lines.push('\x1b[33m[running...]\x1b[0m');
      }

      for (const log of step.logs) {
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

      if (step.status === 'done') {
        const exitInfo = step.exit_code !== undefined ? ` (exit ${step.exit_code})` : '';
        const durInfo = step.duration_ms ? ` ${step.duration_ms}ms` : '';
        lines.push(`\x1b[32m✓ done${exitInfo}${durInfo}\x1b[0m`);
      } else if (step.status === 'failed') {
        const exitInfo = step.exit_code !== undefined ? ` (exit ${step.exit_code})` : '';
        lines.push(`\x1b[1;31m✗ failed${exitInfo}\x1b[0m`);
      }

      lines.push('');
    }

    if (status === 'done') {
      lines.push('\x1b[1;32m═══ Execution finished ═══\x1b[0m');
    } else if (status === 'failed') {
      lines.push('\x1b[1;31m═══ Execution failed ═══\x1b[0m');
    }

    return lines;
  }, [stepsStatus, status]);

  if (Object.keys(stepsStatus).length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Waiting for execution output...
      </Text>
    );
  }

  return (
    <Box
      style={{
        height: 400,
        border: '1px solid var(--mantine-color-dark-4)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <TerminalPanel logs={allLogs} />
    </Box>
  );
}
