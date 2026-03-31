import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { Table, TextInput, Group, Badge, ActionIcon, Tooltip } from '@mantine/core';
import {
  IconSearch,
  IconPencil,
  IconPlayerPlay,
  IconCopy,
  IconTrash,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import type { Chain } from '@/types';
import {
  useGetChainsQuery,
  useDeleteChainMutation,
  useCreateChainMutation,
} from '@/store/api/chainsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { openConfirmModal } from '@/components/ConfirmModal';
import { MitreTacticBadge } from '@/components/MitreTacticBadge';
import { truncate } from '@/utils/formatUtils';

const columnHelper = createColumnHelper<Chain>();

interface ScenariosTableProps {
  onExecute: (chain: Chain) => void;
}

export function ScenariosTable({ onExecute }: ScenariosTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canEdit, canDelete, canExecute } = usePermissions();
  const { data: chains = [], isLoading } = useGetChainsQuery();
  const [deleteChain] = useDeleteChainMutation();
  const [createChain] = useCreateChainMutation();
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => <strong>{info.getValue()}</strong>,
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => truncate(info.getValue() || '', 60),
      }),
      columnHelper.accessor('tags', {
        header: 'Tags',
        cell: (info) => (
          <Group gap={4}>
            {(info.getValue() ?? []).map((tag) => (
              <Badge key={tag} size="xs" variant="outline">
                {tag}
              </Badge>
            ))}
          </Group>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('mitre_tactics', {
        header: 'MITRE Tactics',
        cell: (info) => (
          <Group gap={4}>
            {(info.getValue() ?? []).map((tactic) => (
              <MitreTacticBadge key={tactic} tactic={tactic} />
            ))}
          </Group>
        ),
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const chain = row.original;
          return (
            <Group gap={4}>
              {canEdit && (
                <Tooltip label={t('actions.edit')}>
                  <ActionIcon
                    variant="subtle"
                    color="cyan"
                    onClick={() => navigate(`/editor/${chain.id}`)}
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
              {canExecute && (
                <Tooltip label={t('actions.execute')}>
                  <ActionIcon
                    variant="subtle"
                    color="green"
                    onClick={() => onExecute(chain)}
                  >
                    <IconPlayerPlay size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
              <Tooltip label={t('actions.clone')}>
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  onClick={async () => {
                    const result = await createChain({
                      name: `Copy of ${chain.name}`,
                      description: chain.description,
                      tags: chain.tags ?? [],
                      mitre_tactics: chain.mitre_tactics ?? [],
                      steps: chain.steps ?? [],
                    });
                    if ('data' in result) {
                      notifications.show({
                        title: 'Cloned',
                        message: `Scenario "${chain.name}" cloned`,
                        color: 'green',
                      });
                      navigate(`/editor/${result.data!.id}`);
                    }
                  }}
                >
                  <IconCopy size={16} />
                </ActionIcon>
              </Tooltip>
              {canDelete && (
                <Tooltip label={t('actions.delete')}>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() =>
                      openConfirmModal({
                        title: t('actions.delete'),
                        message: t('confirm_delete'),
                        confirmLabel: t('actions.delete'),
                        onConfirm: async () => {
                          await deleteChain(chain.id);
                          notifications.show({
                            title: 'Deleted',
                            message: `Scenario "${chain.name}" deleted`,
                            color: 'red',
                          });
                        },
                        danger: true,
                      })
                    }
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          );
        },
      }),
    ],
    [canEdit, canDelete, canExecute, navigate, t, deleteChain, createChain, onExecute],
  );

  const table = useReactTable({
    data: chains,
    columns,
    state: { globalFilter, sorting },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <TextInput
        placeholder={t('actions.search') + '...'}
        leftSection={<IconSearch size={16} />}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.currentTarget.value)}
        mb="md"
      />
      <Table.ScrollContainer minWidth={700}>
        <Table striped highlightOnHover>
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={5} ta="center">{t('loading')}</Table.Td>
              </Table.Tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5} ta="center">{t('no_data')}</Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </>
  );
}
