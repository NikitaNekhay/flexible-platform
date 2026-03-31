import { TextInput, Stack } from '@mantine/core';
import type { UploadAction } from '@/types';

interface UploadFormProps {
  value: UploadAction;
  onChange: (value: UploadAction) => void;
}

export function UploadForm({ value, onChange }: UploadFormProps) {
  return (
    <Stack gap="sm">
      <TextInput
        label="Local Path (on C2 server)"
        value={value.upload.local_path ?? ''}
        onChange={(e) =>
          onChange({ ...value, upload: { ...value.upload, local_path: e.currentTarget.value } })
        }
        placeholder="/opt/payloads/file.txt"
      />
      <TextInput
        label="Remote Path (on victim)"
        value={value.upload.remote_path}
        onChange={(e) =>
          onChange({ ...value, upload: { ...value.upload, remote_path: e.currentTarget.value } })
        }
        placeholder="/tmp/data.txt"
      />
    </Stack>
  );
}
