import { Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { StepStatusValue, ExecutionStatusValue, StreamStatusValue } from '@/types';

type StatusValue = StepStatusValue | ExecutionStatusValue | StreamStatusValue;

const STATUS_COLORS: Record<string, string> = {
  pending: 'gray',
  running: 'blue',
  done: 'green',
  failed: 'red',
  skipped: 'yellow',
  cancelled: 'orange',
  idle: 'gray',
  connecting: 'yellow',
  connected: 'green',
  disconnected: 'orange',
  error: 'red',
};

interface StatusBadgeProps {
  status: StatusValue;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const { t } = useTranslation();
  const color = STATUS_COLORS[status] ?? 'gray';
  const label = t(`status.${status}`, status);

  return (
    <Badge color={color} variant="light" size={size} aria-live="polite" role="status">
      {label}
    </Badge>
  );
}
