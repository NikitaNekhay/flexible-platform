import { Group, Button, Badge, Text } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';

export function Header() {
  const { t, i18n } = useTranslation();
  const role = useAppSelector((s) => s.auth.role);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ru' : 'en');
  };

  return (
    <Group justify="space-between" h="100%" px="md">
      <Text fw={700} size="lg">
        {t('app_title')}
      </Text>
      <Group gap="sm">
        <Badge variant="light" color="cyan" size="lg">
          {t(`roles.${role}`)}
        </Badge>
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<IconLanguage size={16} />}
          onClick={toggleLang}
        >
          {i18n.language === 'en' ? 'RU' : 'EN'}
        </Button>
      </Group>
    </Group>
  );
}
