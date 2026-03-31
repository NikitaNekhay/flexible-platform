import { TextInput, Switch, SegmentedControl, FileInput, Stack, Text } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import type { BinaryAction } from '@/types';

interface BinaryFormProps {
  value: BinaryAction;
  onChange: (value: BinaryAction) => void;
}

export function BinaryForm({ value, onChange }: BinaryFormProps) {
  return (
    <Stack gap="sm">
      <div>
        <Text size="sm" fw={500} mb={4}>Source</Text>
        <SegmentedControl
          data={[
            { label: 'URL', value: 'url' },
            { label: 'Upload', value: 'upload' },
          ]}
          value={value.source}
          onChange={(v) => onChange({ ...value, source: v as 'url' | 'upload' })}
        />
      </div>

      {value.source === 'url' ? (
        <TextInput
          label="URL"
          value={value.url ?? ''}
          onChange={(e) => onChange({ ...value, url: e.currentTarget.value })}
          placeholder="https://..."
        />
      ) : (
        <FileInput
          label="Binary File"
          placeholder="Select file"
          leftSection={<IconUpload size={16} />}
          onChange={() => {
            // File upload would set file_ref after uploading via API
            // For now just mark the source
          }}
        />
      )}

      <TextInput
        label="Destination Path"
        value={value.destination_path}
        onChange={(e) => onChange({ ...value, destination_path: e.currentTarget.value })}
        placeholder="C:\\temp\\payload.exe"
      />

      <Switch
        label="Execute after upload"
        checked={value.execute_after_upload}
        onChange={(e) =>
          onChange({ ...value, execute_after_upload: e.currentTarget.checked })
        }
      />
    </Stack>
  );
}
