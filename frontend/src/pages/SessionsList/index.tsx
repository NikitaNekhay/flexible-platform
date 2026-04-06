import { useMemo, useState } from 'react';
import { Title, Stack, Table, Text, TextInput, Badge, Group, Skeleton } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useGetSessionsQuery } from '@/store/api/sessionsApi';

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
        s.name.toLowerCase().includes(q) ||
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
        <Table striped highlightOnHover aria-label="Active sessions">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Session ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Hostname</Table.Th>
              <Table.Th>OS</Table.Th>
              <Table.Th>Username</Table.Th>
              <Table.Th>PID</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Table.Tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : filtered.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6} ta="center">
                  <Text c="dimmed" py="xl">{t('no_data')}</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filtered.map((session) => (
                <Table.Tr key={session.id}>
                  <Table.Td>
                    <Text size="sm" ff="monospace">{session.id.slice(0, 8)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500} c="cyan">{session.name}</Text>
                  </Table.Td>
                  <Table.Td>{session.hostname}</Table.Td>
                  <Table.Td>
                    <Badge variant="light" size="sm">{session.os}</Badge>
                  </Table.Td>
                  <Table.Td>{session.username}</Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace">{session.pid}</Text>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
