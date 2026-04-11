import { TextInput, Textarea, Stack } from '@mantine/core';
import type { SliverRpcAction } from '@/types';

interface SliverRpcFormProps {
  value: SliverRpcAction;
  onChange: (value: SliverRpcAction) => void;
}

export function SliverRpcForm({ value, onChange }: SliverRpcFormProps) {
  const rpc = value.sliver_rpc ?? { method: '', params: {} };
  const paramsStr = JSON.stringify(rpc.params ?? {}, null, 2);

  const handleParamsChange = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      onChange({ ...value, sliver_rpc: { ...rpc, params: parsed } });
    } catch {
      // Don't update state on invalid JSON — user is still typing
    }
  };

  return (
    <Stack gap="sm">
      <TextInput
        label="RPC Method"
        value={rpc.method}
        onChange={(e) => onChange({ ...value, sliver_rpc: { ...rpc, method: e.currentTarget.value } })}
        placeholder="e.g. Ps, Screenshot, Ifconfig, Netstat"
      />
      <Textarea
        label="Params (JSON object)"
        value={paramsStr}
        onChange={(e) => handleParamsChange(e.currentTarget.value)}
        minRows={4}
        autosize
        styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
      />
    </Stack>
  );
}
