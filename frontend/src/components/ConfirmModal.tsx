import { Text } from '@mantine/core';
import { modals } from '@mantine/modals';

interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  danger?: boolean;
}

export function openConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  danger = false,
}: ConfirmModalOptions) {
  modals.openConfirmModal({
    title,
    children: <Text size="sm">{message}</Text>,
    labels: { confirm: confirmLabel, cancel: cancelLabel },
    confirmProps: { color: danger ? 'red' : 'cyan' },
    onConfirm,
  });
}
