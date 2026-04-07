import { Fragment, useMemo, useState, useEffect, memo } from 'react';
import {
  Title, Stack, Group, TextInput, Badge, Text, Skeleton,
  ActionIcon, Tooltip, SegmentedControl, Box, Accordion, Table, Pagination,
} from '@mantine/core';
import {
  IconSearch, IconFlask, IconChevronDown, IconChevronRight,
  IconList, IconLayoutList,
} from '@tabler/icons-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ExpandedState,
} from '@tanstack/react-table';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useGetAtomicsQuery } from '@/store/api/atomicsApi';
import type { Atomic, Step } from '@/types';
import { v4Fallback } from '@/pages/ScenarioEditor/idUtils';
import { AtomicDetailPanel } from './AtomicDetailPanel';

const PAGE_SIZE_FLAT = 25;
const PAGE_SIZE_GROUPS = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAtomicStep(atomic: Atomic, testIndex: number): Step {
  const test = atomic.tests[testIndex];
  const defaultArgs: Record<string, string> = {};
  for (const arg of test?.arguments ?? []) {
    defaultArgs[arg.name] = arg.default ?? '';
  }
  return {
    id: `${atomic.technique_id}_${testIndex}_${v4Fallback()}`,
    name: `${atomic.technique_id} — ${test?.name ?? ''}`,
    depends_on: [],
    on_fail: 'stop',
    action: {
      type: 'atomic',
      atomic_ref: { id: atomic.technique_id, test: testIndex, args: defaultArgs },
    },
  };
}

function baseFamily(id: string) {
  return id.split('.')[0];
}

// ── Flat table ────────────────────────────────────────────────────────────────

const columnHelper = createColumnHelper<Atomic>();

// Stable column definitions — defined outside the component so useMemo deps are clean
const columns = [
  columnHelper.display({
    id: 'expander',
    header: '',
    size: 36,
    cell: ({ row }) => (
      <ActionIcon
        variant="subtle"
        size="xs"
        onClick={row.getToggleExpandedHandler()}
        aria-label={row.getIsExpanded() ? 'Collapse' : 'Expand'}
      >
        {row.getIsExpanded() ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
      </ActionIcon>
    ),
  }),
  columnHelper.accessor('technique_id', {
    header: 'Technique ID',
    cell: (info) => (
      <Text
        size="sm" fw={600} ff="monospace" c="cyan"
        style={{ cursor: 'pointer' }}
        onClick={info.row.getToggleExpandedHandler()}
      >
        {info.getValue()}
      </Text>
    ),
  }),
  columnHelper.accessor('technique_name', {
    header: 'Name',
    cell: (info) => <Text size="sm">{info.getValue()}</Text>,
  }),
  columnHelper.accessor('tests', {
    id: 'test_count',
    header: 'Tests',
    sortingFn: (a, b) => a.original.tests.length - b.original.tests.length,
    cell: (info) => <Badge variant="light" size="sm">{info.getValue().length}</Badge>,
  }),
];

interface AtomicsFlatTableProps {
  atomics: Atomic[];
  onAddToScenario: (atomic: Atomic, testIndex: number) => void;
}

function AtomicsFlatTable({ atomics, onAddToScenario }: AtomicsFlatTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'technique_id', desc: false }]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data: atomics,
    columns,
    state: { sorting, expanded },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // FIX: required for row expansion to work in TanStack Table v8
    getRowCanExpand: () => true,
    getRowId: (row) => row.technique_id,
    initialState: { pagination: { pageSize: PAGE_SIZE_FLAT } },
    // autoResetPageIndex defaults to true — resets to page 0 when `atomics` prop changes
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const totalRows = atomics.length;
  const from = pageIndex * pageSize + 1;
  const to = Math.min(from + pageSize - 1, totalRows);

  return (
    <Stack gap="sm">
      <Table.ScrollContainer minWidth={600}>
        <Table striped highlightOnHover withTableBorder aria-label="Atomics library">
          <Table.Thead>
            {table.getHeaderGroups().map((hg) => (
              <Table.Tr key={hg.id}>
                {hg.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    style={{
                      width: header.column.getSize() !== 150 ? header.column.getSize() : undefined,
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <Group gap={4} wrap="nowrap">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && ' ↑'}
                      {header.column.getIsSorted() === 'desc' && ' ↓'}
                    </Group>
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {table.getRowModel().rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={columns.length} ta="center">
                  <Text c="dimmed" py="xl">No atomics found.</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                // FIX: Fragment with key — <> cannot carry a key prop, breaking React's reconciliation
                <Fragment key={row.id}>
                  <Table.Tr>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                  {/* Only mount AtomicDetailPanel when expanded — triggers the fetch then */}
                  {row.getIsExpanded() && (
                    <Table.Tr>
                      <Table.Td colSpan={columns.length} p={0}>
                        <AtomicDetailPanel
                          techniqueId={row.original.technique_id}
                          onAddToScenario={(idx) => onAddToScenario(row.original, idx)}
                        />
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Fragment>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          {totalRows === 0 ? 'No results' : `${from}–${to} of ${totalRows}`}
        </Text>
        {table.getPageCount() > 1 && (
          <Pagination
            size="sm"
            total={table.getPageCount()}
            value={pageIndex + 1}
            onChange={(p) => table.setPageIndex(p - 1)}
          />
        )}
      </Group>
    </Stack>
  );
}

// ── Grouped view ──────────────────────────────────────────────────────────────

interface GroupRowProps {
  atomic: Atomic;
  isOpen: boolean;
  onToggle: () => void;
  onAddToScenario: (testIndex: number) => void;
}

// Memoized row so sibling re-renders don't cascade through all group items
const GroupRow = memo(function GroupRow({ atomic, isOpen, onToggle, onAddToScenario }: GroupRowProps) {
  return (
    <Box>
      <Group
        px="sm"
        py="xs"
        justify="space-between"
        style={(theme) => ({
          borderBottom: `1px solid ${theme.colors.dark[5]}`,
          cursor: 'pointer',
        })}
        onClick={onToggle}
      >
        <Group gap="sm">
          <ActionIcon variant="subtle" size="xs" aria-label={isOpen ? 'Collapse' : 'Expand'}>
            {isOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
          </ActionIcon>
          <Text size="sm" fw={600} ff="monospace" c="cyan">{atomic.technique_id}</Text>
          <Text size="sm">{atomic.technique_name}</Text>
        </Group>
        <Badge variant="light" size="xs">
          {atomic.tests.length} test{atomic.tests.length !== 1 ? 's' : ''}
        </Badge>
      </Group>
      {/* FIX: conditional render — no mount = no fetch until user opens */}
      {isOpen && (
        <AtomicDetailPanel
          techniqueId={atomic.technique_id}
          onAddToScenario={onAddToScenario}
        />
      )}
    </Box>
  );
});

interface AtomicsGroupedProps {
  atomics: Atomic[];
  onAddToScenario: (atomic: Atomic, testIndex: number) => void;
}

function AtomicsGrouped({ atomics, onAddToScenario }: AtomicsGroupedProps) {
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const groups = useMemo(() => {
    const map = new Map<string, Atomic[]>();
    for (const a of atomics) {
      const key = baseFamily(a.technique_id);
      (map.get(key) ?? (map.set(key, []), map.get(key)!)).push(a);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [atomics]);

  // Reset page and open detail when search changes
  useEffect(() => {
    setPage(1);
    setOpenDetail(null);
  }, [atomics]);

  const totalPages = Math.ceil(groups.length / PAGE_SIZE_GROUPS);
  const visibleGroups = groups.slice((page - 1) * PAGE_SIZE_GROUPS, page * PAGE_SIZE_GROUPS);

  return (
    <Stack gap="sm">
      <Accordion variant="separated" multiple>
        {visibleGroups.map(([family, items]) => (
          <Accordion.Item key={family} value={family}>
            <Accordion.Control>
              <Group gap="sm">
                <Text fw={700} ff="monospace" size="sm">{family}</Text>
                <Badge variant="light" size="sm">
                  {items.length} technique{items.length !== 1 ? 's' : ''}
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel p={0}>
              <Stack gap={0}>
                {items.map((atomic) => (
                  <GroupRow
                    key={atomic.technique_id}
                    atomic={atomic}
                    isOpen={openDetail === atomic.technique_id}
                    onToggle={() =>
                      setOpenDetail((prev) =>
                        prev === atomic.technique_id ? null : atomic.technique_id,
                      )
                    }
                    onAddToScenario={(idx) => onAddToScenario(atomic, idx)}
                  />
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>

      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          {groups.length} families · {atomics.length} techniques
        </Text>
        {totalPages > 1 && (
          <Pagination
            size="sm"
            total={totalPages}
            value={page}
            onChange={(p) => { setPage(p); setOpenDetail(null); }}
          />
        )}
      </Group>
    </Stack>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AtomicsListPage() {
  const navigate = useNavigate();
  const { data: atomics = [], isLoading } = useGetAtomicsQuery();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  const filtered = useMemo(() => {
    if (!search.trim()) return atomics;
    const q = search.toLowerCase();
    return atomics.filter(
      (a) =>
        a.technique_id.toLowerCase().includes(q) ||
        a.technique_name.toLowerCase().includes(q),
    );
  }, [atomics, search]);

  const handleAddToScenario = (atomic: Atomic, testIndex: number) => {
    notifications.show({
      title: 'Atomic added',
      message: `${atomic.technique_id} — test #${testIndex} added as first step`,
      color: 'teal',
    });
    navigate('/editor/new', { state: { initialSteps: [makeAtomicStep(atomic, testIndex)] } });
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group gap="sm">
          <IconFlask size={24} />
          <Title order={2}>Atomics Library</Title>
          {!isLoading && (
            <Badge variant="light" size="lg">{atomics.length}</Badge>
          )}
        </Group>
        <SegmentedControl
          value={viewMode}
          onChange={(v) => setViewMode(v as 'list' | 'grouped')}
          data={[
            { value: 'list', label: <Tooltip label="Flat list"><Group gap={4}><IconList size={16} /></Group></Tooltip> },
            { value: 'grouped', label: <Tooltip label="Grouped by technique family"><Group gap={4}><IconLayoutList size={16} /></Group></Tooltip> },
          ]}
        />
      </Group>

      <TextInput
        placeholder="Search by technique ID or name..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      {isLoading ? (
        <Stack gap="xs">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} height={38} radius="sm" />
          ))}
        </Stack>
      ) : viewMode === 'list' ? (
        <AtomicsFlatTable atomics={filtered} onAddToScenario={handleAddToScenario} />
      ) : (
        <AtomicsGrouped atomics={filtered} onAddToScenario={handleAddToScenario} />
      )}
    </Stack>
  );
}
