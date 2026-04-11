import { SimpleGrid, Title, Stack, Button, Group } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HealthCard } from './HealthCard';
import { ActiveSessionCard } from './ActiveSessionCard';

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Stack gap="lg" maw={900} mx="auto">
      <Group justify="space-between">
        <Title order={2}>{t('nav.dashboard')}</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => navigate('/editor/new')}
        >
          {t('editor:new_scenario')}
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <HealthCard />
        <ActiveSessionCard />
      </SimpleGrid>
    </Stack>
  );
}
