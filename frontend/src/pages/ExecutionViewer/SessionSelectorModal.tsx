import { useState, useMemo } from 'react';
import { Modal, Table, TextInput, Text, Button, Group, Stack, ScrollArea } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useGetSessionsQuery } from '@/store/api/sessionsApi';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import type { Session } from '@/types';
import { formatTimestamp } from '@/utils/formatUtils';

interface SessionSelectorModalProps {
  opened: boolean;
  onClose: () => void;
  onSelect: (session: Session) => void;
}

export function SessionSelectorModal({ opened, onClose, onSelect }: SessionSelectorModalProps) {
  const { t } = useTranslation();
  const { data: sessions, isLoading } = useGetSessionsQuery(undefined, { skip: !opened });
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!sessions) return [];
    if (!filter.trim()) return sessions;
    const q = filter.toLowerCase();
    return sessions.filter(
      (s) =>
        s.hostname.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        s.os.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    );
  }, [sessions, filter]);

  const handleConfirm = () => {
    const session = filtered.find((s) => s.id === selectedId);
    if (session) {
      onSelect(session);
      onClose();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('execution:select_session.title')}
      size="xl"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t('execution:select_session.description')}
        </Text>

        <TextInput
          placeholder={t('actions.search')}
          leftSection={<IconSearch size={16} />}
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
        />

        <ScrollArea h={300}>
          <LoadingOverlay visible={isLoading} />
          {filtered.length === 0 && !isLoading ? (
            <Text c="dimmed" ta="center" py="xl">
              {t('execution:select_session.no_sessions')}
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('execution:select_session.columns.hostname')}</Table.Th>
                  <Table.Th>{t('execution:select_session.columns.os')}</Table.Th>
                  <Table.Th>{t('execution:select_session.columns.username')}</Table.Th>
                  <Table.Th>{t('execution:select_session.columns.arch')}</Table.Th>
                  <Table.Th>{t('execution:select_session.columns.last_seen')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((session) => (
                  <Table.Tr
                    key={session.id}
                    onClick={() => setSelectedId(session.id)}
                    style={{
                      cursor: 'pointer',
                      background: selectedId === session.id ? 'var(--mantine-color-dark-5)' : undefined,
                    }}
                  >
                    <Table.Td>{session.hostname}</Table.Td>
                    <Table.Td>{session.os}</Table.Td>
                    <Table.Td>{session.username}</Table.Td>
                    <Table.Td>{session.arch}</Table.Td>
                    <Table.Td>{formatTimestamp(session.last_seen)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </ScrollArea>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            {t('execution:select_session.confirm')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
