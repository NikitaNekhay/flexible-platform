import { useMemo, useState } from 'react';
import { Title, Stack, Table, Text, TextInput, Badge, Group, Skeleton } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useGetSessionsQuery } from '@/store/api/sessionsApi';
import { formatTimestamp } from '@/utils/formatUtils';

export default function SessionsListPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data: sessions = [], isLoading } = useGetSessionsQuery(undefined, {
    pollingInterval: 5000,
    skipPollingIfUnfocused: true,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.hostname.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        s.os.toLowerCase().includes(q),
    );
  }, [sessions, search]);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group gap="sm">
          <Title order={2}>{t('nav.sessions')}</Title>
          <Badge color={sessions.length > 0 ? 'green' : 'gray'} variant="light" size="lg">
            {sessions.length} active
          </Badge>
        </Group>
      </Group>

      {sessions.length === 0 && !isLoading && (
        <Text c="dimmed" size="sm">
          No active Sliver sessions. Make sure victim containers are running and have checked in.
          Sessions auto-refresh every 5 seconds.
        </Text>
      )}

      <TextInput
        placeholder={t('actions.search') + '...'}
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      <Table.ScrollContainer minWidth={600}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Session ID</Table.Th>
              <Table.Th>Hostname</Table.Th>
              <Table.Th>OS</Table.Th>
              <Table.Th>Username</Table.Th>
              <Table.Th>Arch</Table.Th>
              <Table.Th>PID</Table.Th>
              <Table.Th>Last Seen</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Table.Tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : filtered.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center">
                  <Text c="dimmed" py="xl">{t('no_data')}</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filtered.map((session) => (
                <Table.Tr key={session.id}>
                  <Table.Td>
                    <Text size="sm" ff="monospace">{session.id}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>{session.hostname}</Text>
                  </Table.Td>
                  <Table.Td>{session.os}</Table.Td>
                  <Table.Td>{session.username}</Table.Td>
                  <Table.Td>{session.arch}</Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace">{session.pid}</Text>
                  </Table.Td>
                  <Table.Td>{formatTimestamp(session.last_seen)}</Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
