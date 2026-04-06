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
        label="Interpreter"
        data={['cmd', 'powershell', 'bash', 'sh']}
        value={value.command.interpreter}
        onChange={(v) =>
          onChange({ ...value, command: { ...value.command, interpreter: v ?? '' } })
        }
        allowDeselect={false}
        placeholder="Select interpreter"
      />
      <Textarea
        label="Command"
        value={value.command.cmd}
        onChange={(e) =>
          onChange({ ...value, command: { ...value.command, cmd: e.currentTarget.value } })
        }
        minRows={3}
        autosize
        placeholder="Enter command to execute"
        mt="sm"
        styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
      />
    </>
  );
}
