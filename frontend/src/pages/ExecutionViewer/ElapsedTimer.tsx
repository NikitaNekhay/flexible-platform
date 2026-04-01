import { useEffect, useState } from 'react';
import { Text } from '@mantine/core';
import { formatDuration } from '@/utils/formatUtils';

interface ElapsedTimerProps {
  startedAt: string;
  finishedAt?: string;
  isRunning: boolean;
}

export function ElapsedTimer({ startedAt, finishedAt, isRunning }: ElapsedTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : now;
  const elapsed = Math.max(0, end - start);

  return <Text span ff="monospace">{formatDuration(elapsed)}</Text>;
}
