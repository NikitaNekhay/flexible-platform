import { useState } from 'react';
import { Title, Stack, Group, Button } from '@mantine/core';
import { IconPlus, IconFileImport } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { modals } from '@mantine/modals';
import { ScenariosTable } from './ScenariosTable';
import type { Chain } from '@/types';

export default function ScenariosListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [, setSessionModalChain] = useState<Chain | null>(null);

  const handleExecute = (chain: Chain) => {
    setSessionModalChain(chain);
    modals.openContextModal({
      modal: 'sessionSelector',
      title: t('execution:select_session.title'),
      size: 'xl',
      innerProps: {
        chainId: chain.id,
        onSelected: (executionId: string) => {
          navigate(`/execution/${executionId}`);
        },
      },
    });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>{t('nav.scenarios')}</Title>
        <Group gap="sm">
          <Button
            variant="light"
            leftSection={<IconFileImport size={16} />}
            onClick={() => {
              modals.openContextModal({
                modal: 'yamlImport',
                title: t('editor:yaml_import.title'),
                size: 'xl',
                innerProps: {
                  onImport: (chainData: Chain) => {
                    navigate(`/editor/${chainData.id}`);
                  },
                },
              });
            }}
          >
            {t('editor:toolbar.import_yaml')}
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate('/editor/new')}
          >
            {t('editor:new_scenario')}
          </Button>
        </Group>
      </Group>

      <ScenariosTable onExecute={handleExecute} />
    </Stack>
  );
}
