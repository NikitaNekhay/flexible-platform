import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Stack, Title, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setExecutionId,
  resetExecution,
  sseEventReceived,
} from '@/store/slices/executionSlice';
import { useGetExecutionQuery } from '@/store/api/executionsApi';
import { useSSE } from '@/hooks/useSSE';
import { ExecutionToolbar } from './ExecutionToolbar';
import { ExecutionStepsTable } from './ExecutionStepsTable';
import { ExecutionStreamLog } from './ExecutionStreamLog';
import { StepLogDrawer } from './StepLogDrawer';

export default function ExecutionViewerPage() {
  const { executionId } = useParams<{ executionId: string }>();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const currentExecutionId = useAppSelector((s) => s.execution.executionId);

  // Fetch execution details from REST API
  const { data: execution } = useGetExecutionQuery(executionId!, {
    skip: !executionId,
  });

  // Set execution ID in store
  useEffect(() => {
    if (executionId && executionId !== currentExecutionId) {
      dispatch(setExecutionId({ executionId }));
    }
    return () => {
      dispatch(resetExecution());
    };
  }, [executionId, dispatch]);

  // Seed step data from REST API response (for past/completed executions)
  useEffect(() => {
    if (!execution || !execution.steps) return;
    for (const step of execution.steps) {
      dispatch(
        sseEventReceived({
          event: 'step_log',
          step_id: step.step_id,
          status: step.status,
          stdout: step.stdout,
          stderr: step.stderr,
          error: step.error,
          exit_code: step.exit_code,
          duration_ms: step.duration_ms,
        }),
      );
    }
    // Also set the overall status from the fetched data
    if (execution.status === 'done') {
      dispatch(sseEventReceived({ event: 'chain_done' }));
    } else if (execution.status === 'failed') {
      dispatch(sseEventReceived({ event: 'chain_failed' }));
    }
  }, [execution, dispatch]);

  // Connect SSE for live updates
  useSSE(executionId ?? null);

  if (!executionId) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No execution ID provided.
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <Title order={3}>{t('execution:title')}</Title>
      <ExecutionToolbar />
      <ExecutionStepsTable />
      <ExecutionStreamLog />
      <StepLogDrawer />
    </Stack>
  );
}
