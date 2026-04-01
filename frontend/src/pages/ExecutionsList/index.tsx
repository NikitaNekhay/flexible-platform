import { useEffect, useMemo, useState } from 'react';
import { Title, Stack, Table, Text, Group, Badge, TextInput, Select, Skeleton, Pagination } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGetExecutionsQuery } from '@/store/api/executionsApi';
import { useGetChainsQuery } from '@/store/api/chainsApi';
import { StatusBadge } from '@/components/StatusBadge';
import { formatTimestamp, formatDuration, truncate } from '@/utils/formatUtils';

export default function ExecutionsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: executions = [], isLoading } = useGetExecutionsQuery(chainFilter ?? undefined, {
    pollingInterval: 5000,
    skipPollingIfUnfocused: true,
  });
  const { data: chains = [] } = useGetChainsQuery();

  const chainMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of chains) {
      map[c.id] = c.name;
    }
    return map;
  }, [chains]);

  const chainSelectData = useMemo(
    () => chains.map((c) => ({ value: c.id, label: c.name })),
    [chains],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return executions;
    const q = search.toLowerCase();
    return executions.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.session_id.toLowerCase().includes(q) ||
        (chainMap[e.chain_id] ?? '').toLowerCase().includes(q) ||
        e.status.toLowerCase().includes(q),
    );
  }, [executions, search, chainMap]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage],
  );

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, chainFilter]);

  return (
    <Stack gap="lg">
      <Title order={2}>{t('nav.executions')}</Title>

      <Group gap="sm">
        <TextInput
          placeholder={t('actions.search') + '...'}
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Filter by scenario"
          data={chainSelectData}
          value={chainFilter}
          onChange={setChainFilter}
          clearable
          w={250}
        />
      </Group>

      <Table.ScrollContainer minWidth={700}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Execution ID</Table.Th>
              <Table.Th>Scenario</Table.Th>
              <Table.Th>Session</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Started</Table.Th>
              <Table.Th>Duration</Table.Th>
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
              paginatedData.map((exec) => (
                <Table.Tr
                  key={exec.id}
                  onClick={() => navigate(`/execution/${exec.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td>
                    <Text size="sm" ff="monospace">{truncate(exec.id, 12)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {chainMap[exec.chain_id] ?? truncate(exec.chain_id, 12)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace">{truncate(exec.session_id, 16)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <StatusBadge status={exec.status} size="xs" />
                      {exec.error && (
                        <Badge size="xs" color="red" variant="light">
                          {truncate(exec.error, 30)}
                        </Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatTimestamp(exec.started_at)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace">
                      {exec.finished_at && exec.started_at
                        ? formatDuration(
                            new Date(exec.finished_at).getTime() -
                              new Date(exec.started_at).getTime(),
                          )
                        : exec.status === 'running'
                          ? 'running...'
                          : '—'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {totalPages > 1 && (
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">
            {filtered.length} execution{filtered.length !== 1 ? 's' : ''} total
          </Text>
          <Pagination
            value={currentPage}
            onChange={setPage}
            total={totalPages}
            size="sm"
          />
        </Group>
      )}
    </Stack>
  );
}
