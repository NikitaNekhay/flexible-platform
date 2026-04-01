import { Card, Group, Text, Progress, Stack } from '@mantine/core';
import { useAppSelector } from '@/store/hooks';
import { useGetExecutionQuery } from '@/store/api/executionsApi';
import { useGetChainQuery } from '@/store/api/chainsApi';
import { selectProgress } from '@/store/selectors/executionSelectors';
import { formatTimestamp } from '@/utils/formatUtils';
import { ElapsedTimer } from './ElapsedTimer';

export function ExecutionMetaHeader() {
  const executionId = useAppSelector((s) => s.execution.executionId);
  const executionStatus = useAppSelector((s) => s.execution.status);
  const progress = useAppSelector(selectProgress);

  const { data: execution } = useGetExecutionQuery(executionId!, {
    skip: !executionId,
  });
  const { data: chain } = useGetChainQuery(execution?.chain_id ?? '', {
    skip: !execution?.chain_id,
  });

  if (!execution) return null;

  return (
    <Card padding="sm" radius="md" withBorder>
      <Stack gap={6}>
        <Group justify="space-between" wrap="wrap">
          <Group gap="lg">
            {chain && (
              <Text size="sm">
                <Text span c="dimmed">Scenario: </Text>
                <Text span fw={600}>{chain.name}</Text>
              </Text>
            )}
            <Text size="sm">
              <Text span c="dimmed">Session: </Text>
              <Text span ff="monospace">{execution.session_id.slice(0, 12)}</Text>
            </Text>
          </Group>

          <Group gap="lg">
            <Text size="sm">
              <Text span c="dimmed">Started: </Text>
              <Text span>{formatTimestamp(execution.started_at)}</Text>
            </Text>
            <Text size="sm">
              <Text span c="dimmed">Elapsed: </Text>
              <ElapsedTimer
                startedAt={execution.started_at}
                finishedAt={execution.finished_at}
                isRunning={executionStatus === 'running'}
              />
            </Text>
          </Group>
        </Group>

        {progress.total > 0 && (
          <Group gap="sm" align="center">
            <Progress.Root size="lg" style={{ flex: 1 }} radius="sm">
              <Progress.Section
                value={(progress.done / progress.total) * 100}
                color="green"
              />
              <Progress.Section
                value={(progress.failed / progress.total) * 100}
                color="red"
              />
            </Progress.Root>
            <Text size="xs" c="dimmed" w={80} ta="right">
              {progress.done + progress.failed}/{progress.total} steps
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
