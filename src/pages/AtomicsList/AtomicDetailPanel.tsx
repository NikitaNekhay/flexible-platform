import { Stack, Text, Group, Badge, Skeleton, Paper, Table, Code, Button, Box, Alert } from '@mantine/core';
import { IconAlertCircle, IconTerminal2 } from '@tabler/icons-react';
import { useGetAtomicQuery } from '@/store/api/atomicsApi';
import type { AtomicTest } from '@/types';

interface AtomicDetailPanelProps {
  techniqueId: string;
  onAddToScenario: (testIndex: number) => void;
}

function TestCard({ test, index, onAdd }: { test: AtomicTest; index: number; onAdd: () => void }) {
  return (
    <Paper p="sm" withBorder>
      <Group justify="space-between" mb="xs" wrap="nowrap" align="flex-start">
        <Group gap="xs" wrap="nowrap">
          <Badge variant="filled" size="sm" style={{ flexShrink: 0 }}>
            #{index}
          </Badge>
          <Text fw={600} size="sm">
            {test.name}
          </Text>
        </Group>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          {test.platforms.map((p) => (
            <Badge key={p} size="xs" variant="outline">
              {p}
            </Badge>
          ))}
          {test.executor && (
            <Badge size="xs" color="cyan" leftSection={<IconTerminal2 size={10} />}>
              {test.executor}
            </Badge>
          )}
          <Button size="xs" variant="light" color="teal" onClick={onAdd}>
            Add to new scenario
          </Button>
        </Group>
      </Group>

      {test.description && (
        <Box
          component="pre"
          mb="sm"
          style={{
            fontFamily: 'inherit',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
            color: 'var(--mantine-color-dimmed)',
            lineHeight: 1.6,
          }}
        >
          {test.description.trim()}
        </Box>
      )}

      {test.arguments.length > 0 && (
        <Box mt="xs">
          <Text size="xs" fw={600} c="dimmed" mb={4} tt="uppercase">
            Input Arguments
          </Text>
          <Table size="xs" withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Default</Table.Th>
                <Table.Th>Required</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {test.arguments.map((arg) => (
                <Table.Tr key={arg.name}>
                  <Table.Td>
                    <Code>{arg.name}</Code>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" variant="outline">
                      {arg.type}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Code fz="xs">{arg.default || '—'}</Code>
                  </Table.Td>
                  <Table.Td>
                    {arg.required ? (
                      <Badge size="xs" color="red">
                        required
                      </Badge>
                    ) : (
                      <Text size="xs" c="dimmed">
                        optional
                      </Text>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Paper>
  );
}

export function AtomicDetailPanel({ techniqueId, onAddToScenario }: AtomicDetailPanelProps) {
  const { data: atomic, isLoading, isError } = useGetAtomicQuery(techniqueId);

  if (isLoading) {
    return (
      <Stack p="md" gap="sm">
        <Skeleton height={80} radius="sm" />
        <Skeleton height={60} radius="sm" />
      </Stack>
    );
  }

  if (isError || !atomic) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red" m="md">
        Failed to load atomic detail for {techniqueId}.
      </Alert>
    );
  }

  return (
    <Stack gap="sm" p="md" style={{ background: 'var(--mantine-color-dark-8)' }}>
      {atomic.tests.map((test) => (
        <TestCard
          key={test.test_index}
          test={test}
          index={test.test_index}
          onAdd={() => onAddToScenario(test.test_index)}
        />
      ))}
    </Stack>
  );
}
