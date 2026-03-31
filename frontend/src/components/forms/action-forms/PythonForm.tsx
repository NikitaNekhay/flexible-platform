import { Textarea, TagsInput, Stack, SegmentedControl, TextInput, Text } from '@mantine/core';
import type { PythonAction } from '@/types';

interface PythonFormProps {
  value: PythonAction;
  onChange: (value: PythonAction) => void;
}

export function PythonForm({ value, onChange }: PythonFormProps) {
  const mode = value.python.script ? 'script' : 'inline';

  return (
    <Stack gap="sm">
      <div>
        <Text size="sm" fw={500} mb={4}>Mode</Text>
        <SegmentedControl
          data={[
            { label: 'Script Path', value: 'script' },
            { label: 'Inline', value: 'inline' },
          ]}
          value={mode}
          onChange={(v) => {
            if (v === 'script') {
              onChange({ ...value, python: { ...value.python, inline: undefined, script: '' } });
            } else {
              onChange({ ...value, python: { ...value.python, script: undefined, inline: '' } });
            }
          }}
        />
      </div>

      {mode === 'script' ? (
        <TextInput
          label="Script Path"
          value={value.python.script ?? ''}
          onChange={(e) =>
            onChange({ ...value, python: { ...value.python, script: e.currentTarget.value } })
          }
          placeholder="/opt/scenarios/scripts/recon.py"
        />
      ) : (
        <Textarea
          label="Inline Script"
          value={value.python.inline ?? ''}
          onChange={(e) =>
            onChange({ ...value, python: { ...value.python, inline: e.currentTarget.value } })
          }
          minRows={6}
          autosize
          placeholder="import os&#10;print(os.getcwd())"
          styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
        />
      )}

      <TagsInput
        label="Arguments"
        value={value.python.args ?? []}
        onChange={(args) => onChange({ ...value, python: { ...value.python, args } })}
        placeholder="Add argument and press Enter"
      />
    </Stack>
  );
}
