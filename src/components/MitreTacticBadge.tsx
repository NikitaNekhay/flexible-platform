import { Badge } from '@mantine/core';
import { MITRE_TACTICS } from '@/utils/constants';

interface MitreTacticBadgeProps {
  tactic: string;
}

export function MitreTacticBadge({ tactic }: MitreTacticBadgeProps) {
  const info = MITRE_TACTICS[tactic];
  return (
    <Badge color={info?.color ?? 'gray'} variant="light" size="xs">
      {info?.label ?? tactic}
    </Badge>
  );
}
