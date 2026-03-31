import { useMemo } from 'react';
import { Table, Text } from '@mantine/core';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectStep } from '@/store/slices/executionSlice';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDuration } from '@/utils/formatUtils';
import type { StepExecutionStatus } from '@/types';

const columnHelper = createColumnHelper<StepExecutionStatus>();

export function ExecutionStepsTable() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const stepsStatus = useAppSelector((s) => s.execution.stepsStatus);
  const selectedStepId = useAppSelector((s) => s.execution.selectedStepId);

  const data = useMemo(() => Object.values(stepsStatus), [stepsStatus]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('step_id', {
        header: t('execution:steps_table.step_id'),
        cell: (info) => (
          <Text size="sm" ff="monospace">
            {info.getValue()}
          </Text>
        ),
      }),
      columnHelper.accessor('step_name', {
        header: t('execution:steps_table.name'),
        cell: (info) => <Text size="sm" fw={500}>{info.getValue()}</Text>,
      }),
      columnHelper.accessor('status', {
        header: t('execution:steps_table.status'),
        cell: (info) => <StatusBadge status={info.getValue()} size="xs" />,
      }),
      columnHelper.accessor('duration_ms', {
        header: t('execution:steps_table.duration'),
        cell: (info) => (
          <Text size="sm" ff="monospace">
            {formatDuration(info.getValue())}
          </Text>
        ),
      }),
    ],
    [t],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table.ScrollContainer minWidth={500}>
      <Table striped highlightOnHover>
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.Th key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </Table.Th>
              ))}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {data.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={4} ta="center">
                <Text c="dimmed" py="xl">
                  Waiting for steps to start...
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <Table.Tr
                key={row.id}
                onClick={() => dispatch(selectStep(row.original.step_id))}
                style={{
                  cursor: 'pointer',
                  background:
                    selectedStepId === row.original.step_id
                      ? 'var(--mantine-color-dark-5)'
                      : undefined,
                }}
              >
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
  );
}
