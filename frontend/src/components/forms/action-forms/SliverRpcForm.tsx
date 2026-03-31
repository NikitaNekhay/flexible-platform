import { TextInput, Textarea, Stack } from '@mantine/core';
import type { SliverRpcAction } from '@/types';

interface SliverRpcFormProps {
  value: SliverRpcAction;
  onChange: (value: SliverRpcAction) => void;
}

export function SliverRpcForm({ value, onChange }: SliverRpcFormProps) {
  const paramsStr = JSON.stringify(value.params ?? {}, null, 2);

  const handleParamsChange = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      onChange({ ...value, params: parsed });
    } catch {
      // Don't update state on invalid JSON — user is still typing
    }
  };

  return (
    <Stack gap="sm">
      <TextInput
        label="RPC Method"
        value={value.rpc_method}
        onChange={(e) => onChange({ ...value, rpc_method: e.currentTarget.value })}
        placeholder="e.g. Execute"
      />
      <Textarea
        label="Params (JSON)"
        value={paramsStr}
        onChange={(e) => handleParamsChange(e.currentTarget.value)}
        minRows={4}
        autosize
        styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
      />
    </Stack>
  );
}
