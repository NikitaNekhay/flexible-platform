import { TextInput, NumberInput, Button, Stack, Group } from '@mantine/core';
import { modals } from '@mantine/modals';
import type { AtomicAction, Atomic } from '@/types';

interface AtomicFormProps {
  value: AtomicAction;
  onChange: (value: AtomicAction) => void;
}

export function AtomicForm({ value, onChange }: AtomicFormProps) {
  const handleSelectAtomic = () => {
    modals.openContextModal({
      modal: 'atomicSelector',
      title: 'Select Atomic Test',
      size: 'xl',
      innerProps: {
        onSelect: (atomic: Atomic, testIndex: number) => {
          const test = atomic.tests[testIndex];
          const defaultArgs: Record<string, string> = {};
          if (test) {
            for (const arg of test.arguments) {
              defaultArgs[arg.name] = arg.default ?? '';
            }
          }
          onChange({
            ...value,
            technique_id: atomic.technique_id,
            test_index: testIndex,
            arguments: defaultArgs,
          });
        },
      },
    });
  };

  const argEntries = Object.entries(value.arguments ?? {});

  return (
    <Stack gap="sm">
      <Group grow>
        <TextInput
          label="Technique ID"
          value={value.technique_id}
          onChange={(e) => onChange({ ...value, technique_id: e.currentTarget.value })}
          placeholder="e.g. T1059.001"
        />
        <NumberInput
          label="Test Index"
          value={value.test_index}
          onChange={(v) => onChange({ ...value, test_index: Number(v) })}
          min={0}
        />
      </Group>
      <Button variant="light" size="xs" onClick={handleSelectAtomic}>
        Browse Atomics Library
      </Button>
      {argEntries.length > 0 && (
        <>
          {argEntries.map(([key, val]) => (
            <TextInput
              key={key}
              label={key}
              value={val}
              onChange={(e) =>
                onChange({
                  ...value,
                  arguments: { ...value.arguments, [key]: e.currentTarget.value },
                })
              }
            />
          ))}
        </>
      )}
    </Stack>
  );
}
