import { TextInput, Select, Stack } from '@mantine/core';
import type { ProbeAction } from '@/types';

interface ProbeFormProps {
  value: ProbeAction;
  onChange: (value: ProbeAction) => void;
}

export function ProbeForm({ value, onChange }: ProbeFormProps) {
  return (
    <Stack gap="sm">
      <Select
        label="Kind"
        data={['os', 'kernel', 'arch', 'software_exists', 'software_version']}
        value={value.probe.kind}
        onChange={(v) =>
          onChange({ ...value, probe: { ...value.probe, kind: v ?? '' } })
        }
        allowDeselect={false}
        placeholder="Select probe kind"
      />
      <Select
        label="Platform"
        data={['linux', 'windows', 'darwin']}
        value={value.probe.platform ?? 'linux'}
        onChange={(v) =>
          onChange({ ...value, probe: { ...value.probe, platform: v ?? 'linux' } })
        }
        allowDeselect={false}
      />
      {(value.probe.kind === 'software_exists' || value.probe.kind === 'software_version') && (
        <TextInput
          label="Software"
          value={value.probe.software ?? ''}
          onChange={(e) =>
            onChange({ ...value, probe: { ...value.probe, software: e.currentTarget.value } })
          }
          placeholder="e.g. python3, curl"
        />
      )}
      <TextInput
        label="Match (regex, optional)"
        value={value.probe.match ?? ''}
        onChange={(e) =>
          onChange({ ...value, probe: { ...value.probe, match: e.currentTarget.value } })
        }
        placeholder="e.g. ^5\\..*"
      />
    </Stack>
  );
}
