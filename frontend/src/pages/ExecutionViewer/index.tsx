import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Stack, Title, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setExecutionId, resetExecution } from '@/store/slices/executionSlice';
import { useSSE } from '@/hooks/useSSE';
import { ExecutionToolbar } from './ExecutionToolbar';
import { ExecutionStepsTable } from './ExecutionStepsTable';
import { StepLogDrawer } from './StepLogDrawer';

export default function ExecutionViewerPage() {
  const { executionId } = useParams<{ executionId: string }>();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const currentExecutionId = useAppSelector((s) => s.execution.executionId);

  // Set execution ID in store
  useEffect(() => {
    if (executionId && executionId !== currentExecutionId) {
      dispatch(setExecutionId({ executionId }));
    }
    return () => {
      dispatch(resetExecution());
    };
  }, [executionId, dispatch]);

  // Connect SSE
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
      <StepLogDrawer />
    </Stack>
  );
}
