import { useState, useMemo } from 'react';
import { TextInput, Stack, Accordion, Group, Text, Badge, UnstyledButton } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import type { ContextModalProps } from '@mantine/modals';
import type { Atomic } from '@/types';
import { useGetAtomicsQuery } from '@/store/api/atomicsApi';
import { MitreTacticBadge } from '@/components/MitreTacticBadge';

interface AtomicSelectorInnerProps {
  onSelect: (atomic: Atomic, testIndex: number) => void;
}

export function AtomicSelectorModal({
  context,
  id,
  innerProps,
}: ContextModalProps<AtomicSelectorInnerProps>) {
  const { data: atomics = [], isLoading } = useGetAtomicsQuery();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return atomics;
    const q = search.toLowerCase();
    return atomics.filter(
      (a) =>
        a.technique_id.toLowerCase().includes(q) ||
        a.technique_name.toLowerCase().includes(q) ||
        a.tactic.toLowerCase().includes(q),
    );
  }, [atomics, search]);

  // Group by tactic
  const grouped = useMemo(() => {
    const map = new Map<string, Atomic[]>();
    for (const a of filtered) {
      const list = map.get(a.tactic) ?? [];
      list.push(a);
      map.set(a.tactic, list);
    }
    return map;
  }, [filtered]);

  const handleSelect = (atomic: Atomic, testIndex: number) => {
    innerProps.onSelect(atomic, testIndex);
    context.closeModal(id);
  };

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Search by technique ID or name..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      {isLoading ? (
        <Text c="dimmed">Loading atomics...</Text>
      ) : filtered.length === 0 ? (
        <Text c="dimmed">No matching atomics found</Text>
      ) : (
        <Accordion variant="separated" styles={{ content: { padding: 0 } }}>
          {[...grouped.entries()].map(([tactic, items]) => (
            <Accordion.Item key={tactic} value={tactic}>
              <Accordion.Control>
                <Group gap="sm">
                  <MitreTacticBadge tactic={tactic} />
                  <Text size="sm">({items.length})</Text>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap={0}>
                  {items.map((atomic) =>
                    atomic.tests.map((test) => (
                      <UnstyledButton
                        key={`${atomic.technique_id}-${test.test_index}`}
                        onClick={() => handleSelect(atomic, test.test_index)}
                        p="xs"
                        style={(theme) => ({
                          '&:hover': { backgroundColor: theme.colors.dark[6] },
                          borderBottom: `1px solid ${theme.colors.dark[5]}`,
                        })}
                      >
                        <Group justify="space-between">
                          <div>
                            <Text size="sm" fw={500}>
                              {atomic.technique_id} — {test.name}
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {test.description}
                            </Text>
                          </div>
                          <Group gap={4}>
                            {test.platforms.map((p) => (
                              <Badge key={p} size="xs" variant="outline">
                                {p}
                              </Badge>
                            ))}
                          </Group>
                        </Group>
                      </UnstyledButton>
                    )),
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Stack>
  );
}
