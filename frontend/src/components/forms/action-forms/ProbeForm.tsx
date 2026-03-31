import { TextInput, Select, NumberInput, Stack } from '@mantine/core';
import type { ProbeAction } from '@/types';

interface ProbeFormProps {
  value: ProbeAction;
  onChange: (value: ProbeAction) => void;
}

export function ProbeForm({ value, onChange }: ProbeFormProps) {
  return (
    <Stack gap="sm">
      <Select
        label="Probe Type"
        data={['tcp', 'http', 'process_exists', 'file_exists', 'dns']}
        value={value.probe_type}
        onChange={(v) => onChange({ ...value, probe_type: v ?? '' })}
        allowDeselect={false}
        placeholder="Select probe type"
      />
      <TextInput
        label="Target"
        value={value.target}
        onChange={(e) => onChange({ ...value, target: e.currentTarget.value })}
        placeholder="e.g. 192.168.1.1:8080 or http://target/health"
      />
      <TextInput
        label="Expected Result"
        value={value.expected_result}
        onChange={(e) => onChange({ ...value, expected_result: e.currentTarget.value })}
        placeholder="e.g. 200 or true"
      />
      <NumberInput
        label="Timeout (seconds)"
        value={value.timeout_seconds}
        onChange={(v) => onChange({ ...value, timeout_seconds: Number(v) })}
        min={1}
        max={300}
      />
    </Stack>
  );
}
