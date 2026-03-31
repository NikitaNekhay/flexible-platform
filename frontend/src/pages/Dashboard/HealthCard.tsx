import { Card, Group, Text, Badge, Stack } from '@mantine/core';
import { IconHeartbeat } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useGetHealthQuery } from '@/store/api/healthApi';
import { formatDuration } from '@/utils/formatUtils';

export function HealthCard() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetHealthQuery(undefined, {
    pollingInterval: 30000,
  });

  const isHealthy = data?.status === 'ok';

  return (
    <Card padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <IconHeartbeat size={20} />
          <Text fw={600}>Backend Status</Text>
        </Group>
        {isLoading ? (
          <Badge color="gray" variant="light">{t('loading')}</Badge>
        ) : isError ? (
          <Badge color="red" variant="light">Unreachable</Badge>
        ) : (
          <Badge color={isHealthy ? 'green' : 'red'} variant="light">
            {isHealthy ? 'Healthy' : 'Error'}
          </Badge>
        )}
      </Group>
      {data && (
        <Stack gap={4}>
          {data.uptime_seconds != null && (
            <Text size="sm" c="dimmed">
              Uptime: {formatDuration(data.uptime_seconds * 1000)}
            </Text>
          )}
          {data.version && (
            <Text size="sm" c="dimmed">Version: {data.version}</Text>
          )}
        </Stack>
      )}
    </Card>
  );
}
