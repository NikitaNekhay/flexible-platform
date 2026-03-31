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
            atomic_ref: {
              ...value.atomic_ref,
              id: atomic.technique_id,
              test: testIndex,
              args: defaultArgs,
            },
          });
        },
      },
    });
  };

  const argEntries = Object.entries(value.atomic_ref.args ?? {});

  return (
    <Stack gap="sm">
      <Group grow>
        <TextInput
          label="Technique ID"
          value={value.atomic_ref.id}
          onChange={(e) =>
            onChange({
              ...value,
              atomic_ref: { ...value.atomic_ref, id: e.currentTarget.value },
            })
          }
          placeholder="e.g. T1059.001"
        />
        <NumberInput
          label="Test Index"
          value={value.atomic_ref.test}
          onChange={(v) =>
            onChange({
              ...value,
              atomic_ref: { ...value.atomic_ref, test: Number(v) },
            })
          }
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
                  atomic_ref: {
                    ...value.atomic_ref,
                    args: { ...value.atomic_ref.args, [key]: e.currentTarget.value },
                  },
                })
              }
            />
          ))}
        </>
      )}
    </Stack>
  );
}
