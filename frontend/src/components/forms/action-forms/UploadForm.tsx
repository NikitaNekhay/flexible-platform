import { TextInput, SegmentedControl, FileInput, Stack, Text } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import type { UploadAction } from '@/types';

interface UploadFormProps {
  value: UploadAction;
  onChange: (value: UploadAction) => void;
}

export function UploadForm({ value, onChange }: UploadFormProps) {
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
          label="File to Upload"
          placeholder="Select file"
          leftSection={<IconUpload size={16} />}
          onChange={() => {
            // File upload sets file_ref after API call
          }}
        />
      )}

      <TextInput
        label="Destination Path"
        value={value.destination_path}
        onChange={(e) => onChange({ ...value, destination_path: e.currentTarget.value })}
        placeholder="/tmp/data.txt"
      />
    </Stack>
  );
}
