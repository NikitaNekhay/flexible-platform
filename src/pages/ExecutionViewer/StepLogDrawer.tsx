import { lazy, Suspense } from 'react';
import { Drawer, Group, Text, Loader, Center } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectStep } from '@/store/slices/executionSlice';
import { StatusBadge } from '@/components/StatusBadge';

const TerminalPanel = lazy(() =>
  import('@/components/TerminalPanel').then((m) => ({ default: m.TerminalPanel })),
);

export function StepLogDrawer() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const selectedStepId = useAppSelector((s) => s.execution.selectedStepId);
  const stepsStatus = useAppSelector((s) => s.execution.stepsStatus);

  const stepData = selectedStepId ? stepsStatus[selectedStepId] : null;

  return (
    <Drawer
      opened={!!selectedStepId}
      onClose={() => dispatch(selectStep(null))}
      position="bottom"
      size="50vh"
      title={
        stepData ? (
          <Group gap="sm">
            <Text fw={600}>
              {t('execution:log_drawer.title', { stepName: stepData.step_name })}
            </Text>
            <StatusBadge status={stepData.status} size="xs" />
          </Group>
        ) : null
      }
    >
      {stepData ? (
        stepData.logs.length > 0 ? (
          <Suspense fallback={<Center h="100%"><Loader size="sm" /></Center>}>
            <TerminalPanel logs={stepData.logs} />
          </Suspense>
        ) : (
          <Text c="dimmed" ta="center" py="xl">
            {t('execution:log_drawer.no_logs')}
          </Text>
        )
      ) : null}
    </Drawer>
  );
}
