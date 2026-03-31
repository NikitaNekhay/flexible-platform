import { TextInput, Switch, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import type { BinaryAction } from '@/types';

interface BinaryFormProps {
  value: BinaryAction;
  onChange: (value: BinaryAction) => void;
}

export function BinaryForm({ value, onChange }: BinaryFormProps) {
  const hasUrl = !!value.binary.url;

  return (
    <Stack gap="sm">
      <div>
        <Text size="sm" fw={500} mb={4}>Source</Text>
        <SegmentedControl
          data={[
            { label: 'URL', value: 'url' },
            { label: 'Embedded (base64)', value: 'data' },
          ]}
          value={hasUrl || !value.binary.data ? 'url' : 'data'}
          onChange={(v) => {
            if (v === 'url') {
              onChange({ ...value, binary: { ...value.binary, data: undefined } });
            } else {
              onChange({ ...value, binary: { ...value.binary, url: undefined } });
            }
          }}
        />
      </div>

      {(hasUrl || !value.binary.data) ? (
        <TextInput
          label="URL"
          value={value.binary.url ?? ''}
          onChange={(e) =>
            onChange({ ...value, binary: { ...value.binary, url: e.currentTarget.value } })
          }
          placeholder="https://..."
        />
      ) : (
        <TextInput
          label="Base64 Data"
          value={value.binary.data ?? ''}
          onChange={(e) =>
            onChange({ ...value, binary: { ...value.binary, data: e.currentTarget.value } })
          }
          placeholder="Base64-encoded binary"
        />
      )}

      <TextInput
        label="Remote Path"
        value={value.binary.remote_path}
        onChange={(e) =>
          onChange({ ...value, binary: { ...value.binary, remote_path: e.currentTarget.value } })
        }
        placeholder="C:\\temp\\payload.exe"
      />

      <TextInput
        label="Arguments"
        value={value.binary.args ?? ''}
        onChange={(e) =>
          onChange({ ...value, binary: { ...value.binary, args: e.currentTarget.value } })
        }
        placeholder="Arguments to pass when executing"
      />

      <Select
        label="Platform"
        data={['linux', 'windows']}
        value={value.binary.platform ?? 'linux'}
        onChange={(v) =>
          onChange({ ...value, binary: { ...value.binary, platform: v ?? 'linux' } })
        }
        allowDeselect={false}
      />

      <Switch
        label="Cleanup after execution"
        checked={value.binary.cleanup ?? false}
        onChange={(e) =>
          onChange({ ...value, binary: { ...value.binary, cleanup: e.currentTarget.checked } })
        }
      />
    </Stack>
  );
}
