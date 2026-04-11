import { Card, Group, Text, Badge, Button } from '@mantine/core';
import { IconDeviceDesktop } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetSessionsQuery } from '@/store/api/sessionsApi';

export function ActiveSessionCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: sessions, isLoading } = useGetSessionsQuery();

  const count = sessions?.length ?? 0;

  return (
    <Card padding="lg" radius="md" withBorder>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <IconDeviceDesktop size={20} />
          <Text fw={600}>Active Sessions</Text>
        </Group>
        <Badge color={count > 0 ? 'green' : 'gray'} variant="light" size="lg">
          {isLoading ? '...' : count}
        </Badge>
      </Group>
      <Text size="sm" c="dimmed" mb="md">
        {count > 0
          ? `${count} session${count !== 1 ? 's' : ''} connected and ready for execution`
          : 'No active sessions detected'}
      </Text>
      <Button
        variant="light"
        fullWidth
        onClick={() => navigate('/scenarios')}
      >
        {t('nav.scenarios')}
      </Button>
    </Card>
  );
}
