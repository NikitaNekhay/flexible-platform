import { Group, Button, Badge, Box } from '@mantine/core';
import { IconPlayerStop, IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { useCancelExecutionMutation } from '@/store/api/executionsApi';
import { StatusBadge } from '@/components/StatusBadge';
import { sseService } from '@/services/sseService';

export function ExecutionToolbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const executionId = useAppSelector((s) => s.execution.executionId);
  const status = useAppSelector((s) => s.execution.status);
  const streamStatus = useAppSelector((s) => s.execution.streamStatus);
  const [cancelExecution, { isLoading: isCancelling }] = useCancelExecutionMutation();

  const handleCancel = async () => {
    if (executionId) {
      await cancelExecution(executionId);
    }
  };

  const handleReconnect = () => {
    sseService.reconnect();
  };

  const streamDotColor =
    streamStatus === 'connected'
      ? 'green'
      : streamStatus === 'connecting'
        ? 'yellow'
        : streamStatus === 'error'
          ? 'red'
          : 'gray';

  return (
    <Group justify="space-between">
      <Group gap="sm">
        <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={() => navigate('/scenarios')}>
          {t('actions.back')}
        </Button>
        <StatusBadge status={status} size="md" />
      </Group>

      <Group gap="sm">
        <Group gap={6}>
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: `var(--mantine-color-${streamDotColor}-6)`,
              animation: streamStatus === 'connecting' ? 'pulse 1.5s ease infinite' : undefined,
            }}
          />
          <Badge variant="light" size="sm" color={streamDotColor}>
            {t('execution:toolbar.stream_status')}: {streamStatus}
          </Badge>
        </Group>

        {streamStatus === 'error' && (
          <Button variant="light" size="compact-sm" color="yellow" onClick={handleReconnect}>
            Reconnect
          </Button>
        )}

        {status === 'running' && (
          <Button
            variant="light"
            color="red"
            leftSection={<IconPlayerStop size={16} />}
            onClick={handleCancel}
            loading={isCancelling}
          >
            {t('execution:toolbar.cancel')}
          </Button>
        )}
      </Group>
    </Group>
  );
}
