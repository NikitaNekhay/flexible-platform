import { Select, Textarea } from '@mantine/core';
import type { CommandAction } from '@/types';

interface CommandFormProps {
  value: CommandAction;
  onChange: (value: CommandAction) => void;
}

export function CommandForm({ value, onChange }: CommandFormProps) {
  return (
    <>
      <Select
        label="Executor"
        data={['cmd', 'powershell', 'bash', 'sh']}
        value={value.executor}
        onChange={(v) => onChange({ ...value, executor: v ?? '' })}
        allowDeselect={false}
        placeholder="Select executor"
      />
      <Textarea
        label="Command"
        value={value.command}
        onChange={(e) => onChange({ ...value, command: e.currentTarget.value })}
        minRows={3}
        autosize
        placeholder="Enter command to execute"
        mt="sm"
        styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
      />
    </>
  );
}
