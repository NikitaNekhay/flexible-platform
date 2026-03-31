import { Textarea, TagsInput, Stack } from '@mantine/core';
import type { PythonAction } from '@/types';

interface PythonFormProps {
  value: PythonAction;
  onChange: (value: PythonAction) => void;
}

export function PythonForm({ value, onChange }: PythonFormProps) {
  return (
    <Stack gap="sm">
      <Textarea
        label="Python Script"
        value={value.script}
        onChange={(e) => onChange({ ...value, script: e.currentTarget.value })}
        minRows={6}
        autosize
        placeholder="import os&#10;print(os.getcwd())"
        styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
      />
      <TagsInput
        label="Arguments"
        value={value.args ?? []}
        onChange={(args) => onChange({ ...value, args })}
        placeholder="Add argument and press Enter"
      />
    </Stack>
  );
}
