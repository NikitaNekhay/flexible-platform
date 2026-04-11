import { useState } from 'react';
import {
  Card, Group, Text, Progress, Stack, Badge, Divider, Skeleton,
  Popover, Table, CopyButton, ActionIcon, Tooltip, ThemeIcon,
} from '@mantine/core';
import {
  IconServer, IconUser, IconNetwork, IconCpu, IconClock,
  IconFingerprint, IconCheck, IconCopy, IconInfoCircle,
} from '@tabler/icons-react';
import { useAppSelector } from '@/store/hooks';
import { useGetExecutionQuery } from '@/store/api/executionsApi';
import { useGetChainQuery } from '@/store/api/chainsApi';
import { useGetSessionsQuery } from '@/store/api/sessionsApi';
import { selectProgress } from '@/store/selectors/executionSelectors';
import { formatTimestamp } from '@/utils/formatUtils';
import { ElapsedTimer } from './ElapsedTimer';
import type { Session } from '@/types';

// ── helpers ───────────────────────────────────────────────────────────────────

function osBadgeColor(os: string): string {
  const l = os.toLowerCase();
  if (l.includes('linux')) return 'teal';
  if (l.includes('windows')) return 'blue';
  if (l.includes('darwin') || l.includes('mac')) return 'gray';
  return 'violet';
}

function FieldRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <Table.Tr>
      <Table.Td>
        <Text size="xs" c="dimmed" fw={500}>{label}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <Text size="xs" ff={mono ? 'monospace' : undefined} style={{ wordBreak: 'break-all' }}>
            {value || '—'}
          </Text>
          {value && (
            <CopyButton value={value} timeout={1200}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy'} position="right" withArrow>
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color={copied ? 'green' : 'gray'}
                    onClick={copy}
                    style={{ flexShrink: 0 }}
                  >
                    {copied ? <IconCheck size={10} /> : <IconCopy size={10} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}

// ── Session detail popover ────────────────────────────────────────────────────

function SessionDetailPopover({ session, children }: { session: Session; children: React.ReactNode }) {
  const [opened, setOpened] = useState(false);

  // Split "IP:port" → IP and port separately for display
  const [remoteIp, remotePort] = session.remote_address
    ? session.remote_address.includes(':')
      ? [session.remote_address.slice(0, session.remote_address.lastIndexOf(':')),
         session.remote_address.slice(session.remote_address.lastIndexOf(':') + 1)]
      : [session.remote_address, '']
    : ['', ''];

  return (
    <Popover
      opened={opened}
      onClose={() => setOpened(false)}
      position="bottom-start"
      withArrow
      shadow="md"
      width={320}
      withinPortal
    >
      <Popover.Target>
        <span
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setOpened(true)}
          onMouseLeave={() => setOpened(false)}
          onClick={() => setOpened((v) => !v)}
        >
          {children}
        </span>
      </Popover.Target>

      <Popover.Dropdown
        onMouseEnter={() => setOpened(true)}
        onMouseLeave={() => setOpened(false)}
        p={0}
      >
        {/* Header */}
        <Group px="sm" py="xs" gap="sm" style={{ borderBottom: '1px solid var(--mantine-color-dark-4)' }}>
          <ThemeIcon size="sm" variant="light" color={osBadgeColor(session.os)}>
            <IconServer size={12} />
          </ThemeIcon>
          <Text size="sm" fw={700} ff="monospace" c="cyan">{session.name}</Text>
          <Badge size="xs" color="green" variant="dot" ml="auto">live</Badge>
        </Group>

        {/* Details table */}
        <Table
          withRowBorders={false}
          verticalSpacing={2}
          horizontalSpacing="sm"
          style={{ fontSize: 12 }}
        >
          <Table.Tbody>
            {/* Identity */}
            <Table.Tr>
              <Table.Td colSpan={2} pt="xs">
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">Identity</Text>
              </Table.Td>
            </Table.Tr>
            <FieldRow label="Hostname" value={session.hostname} />
            <FieldRow label="Username" value={session.username} />
            <FieldRow label="PID" value={String(session.pid)} mono />

            {/* Platform */}
            <Table.Tr>
              <Table.Td colSpan={2} pt="xs">
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">Platform</Text>
              </Table.Td>
            </Table.Tr>
            <FieldRow label="OS" value={session.os} />
            <FieldRow label="Architecture" value={session.arch} />

            {/* Network */}
            {(remoteIp || session.remote_address) && (
              <>
                <Table.Tr>
                  <Table.Td colSpan={2} pt="xs">
                    <Text size="xs" fw={600} c="dimmed" tt="uppercase">Network</Text>
                  </Table.Td>
                </Table.Tr>
                {remoteIp && <FieldRow label="IP Address" value={remoteIp} mono />}
                {remotePort && <FieldRow label="Source Port" value={remotePort} mono />}
                {session.remote_address && (
                  <FieldRow label="Remote" value={session.remote_address} mono />
                )}
              </>
            )}

            {/* Timestamps */}
            <Table.Tr>
              <Table.Td colSpan={2} pt="xs">
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">Timestamps</Text>
              </Table.Td>
            </Table.Tr>
            {session.connected_at && (
              <FieldRow label="Connected" value={formatTimestamp(session.connected_at)} />
            )}
            {session.last_seen && (
              <FieldRow label="Last seen" value={formatTimestamp(session.last_seen)} />
            )}

            {/* Session ID */}
            <Table.Tr>
              <Table.Td colSpan={2} pt="xs">
                <Text size="xs" fw={600} c="dimmed" tt="uppercase">Session</Text>
              </Table.Td>
            </Table.Tr>
            <FieldRow label="ID" value={session.id} mono />
          </Table.Tbody>
        </Table>

        <Group px="sm" py="xs" style={{ borderTop: '1px solid var(--mantine-color-dark-4)' }}>
          <IconInfoCircle size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
          <Text size="xs" c="dimmed">Click to pin • hover to preview</Text>
        </Group>
      </Popover.Dropdown>
    </Popover>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExecutionMetaHeader() {
  const executionId = useAppSelector((s) => s.execution.executionId);
  const executionStatus = useAppSelector((s) => s.execution.status);
  const progress = useAppSelector(selectProgress);

  const { data: execution } = useGetExecutionQuery(executionId!, { skip: !executionId });
  const { data: chain } = useGetChainQuery(execution?.chain_id ?? '', { skip: !execution?.chain_id });
  const { data: sessions = [], isLoading: sessionsLoading } = useGetSessionsQuery(undefined, {
    pollingInterval: executionStatus === 'running' ? 10_000 : 0,
    skipPollingIfUnfocused: true,
  });

  if (!execution) return null;

  const session = sessions.find((s) => s.id === execution.session_id);

  return (
    <Card padding="sm" radius="md" withBorder>
      <Stack gap="sm">
        {/* ── Timing row ──────────────────────────────────────────────── */}
        <Group justify="space-between" wrap="wrap">
          <Group gap="lg">
            {chain && (
              <Text size="sm">
                <Text span c="dimmed">Scenario: </Text>
                <Text span fw={600}>{chain.name}</Text>
              </Text>
            )}
          </Group>
          <Group gap="lg">
            <Text size="sm">
              <Text span c="dimmed">Started: </Text>
              <Text span>{formatTimestamp(execution.started_at)}</Text>
            </Text>
            <Text size="sm">
              <Text span c="dimmed">Elapsed: </Text>
              <ElapsedTimer
                startedAt={execution.started_at}
                finishedAt={execution.finished_at}
                isRunning={executionStatus === 'running'}
              />
            </Text>
          </Group>
        </Group>

        <Divider />

        {/* ── Target session row ──────────────────────────────────────── */}
        <Group gap="xs" wrap="wrap" align="center">
          <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ minWidth: 52 }}>
            Target
          </Text>

          {sessionsLoading ? (
            <Group gap="sm">
              <Skeleton height={22} width={130} radius="sm" />
              <Skeleton height={22} width={90} radius="sm" />
              <Skeleton height={22} width={60} radius="sm" />
            </Group>
          ) : session ? (
            <SessionDetailPopover session={session}>
              <Group gap="md" wrap="wrap" align="center">
                {/* Beacon name — primary click target */}
                <Group gap={4}>
                  <IconServer size={14} style={{ color: 'var(--mantine-color-cyan-4)' }} />
                  <Text
                    size="sm" fw={600} c="cyan" ff="monospace"
                    style={{ textDecoration: 'underline dotted', textUnderlineOffset: 3 }}
                  >
                    {session.name}
                  </Text>
                </Group>

                {/* Hostname */}
                <Group gap={4}>
                  <Text size="sm" c="dimmed">host:</Text>
                  <Text size="sm" fw={500}>{session.hostname}</Text>
                </Group>

                {/* OS + arch */}
                <Group gap={4}>
                  <Badge size="sm" color={osBadgeColor(session.os)} variant="light">
                    {session.os}
                  </Badge>
                  {session.arch && (
                    <Badge size="sm" variant="outline" color="gray">
                      <Group gap={2} wrap="nowrap">
                        <IconCpu size={10} />
                        {session.arch}
                      </Group>
                    </Badge>
                  )}
                </Group>

                {/* Username */}
                <Group gap={4}>
                  <IconUser size={13} style={{ color: 'var(--mantine-color-dimmed)' }} />
                  <Text size="sm" c="dimmed">{session.username}</Text>
                </Group>

                {/* IP */}
                {session.remote_address && (
                  <Group gap={4}>
                    <IconNetwork size={13} style={{ color: 'var(--mantine-color-dimmed)' }} />
                    <Text size="sm" ff="monospace" c="dimmed">
                      {session.remote_address.slice(0, session.remote_address.lastIndexOf(':'))}
                    </Text>
                  </Group>
                )}

                {/* Last seen */}
                {session.last_seen && (
                  <Group gap={4}>
                    <IconClock size={13} style={{ color: 'var(--mantine-color-dimmed)' }} />
                    <Text size="sm" c="dimmed">{formatTimestamp(session.last_seen)}</Text>
                  </Group>
                )}
              </Group>
            </SessionDetailPopover>
          ) : (
            <Group gap="sm">
              <IconFingerprint size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
              <Text size="sm" ff="monospace" c="dimmed">{execution.session_id.slice(0, 16)}</Text>
              <Badge size="xs" color="gray" variant="outline">offline / historic</Badge>
            </Group>
          )}
        </Group>

        {/* ── Progress bar ────────────────────────────────────────────── */}
        {progress.total > 0 && (
          <Group gap="sm" align="center">
            <Progress.Root size="lg" style={{ flex: 1 }} radius="sm">
              <Progress.Section value={(progress.done / progress.total) * 100} color="green" />
              <Progress.Section value={(progress.failed / progress.total) * 100} color="red" />
            </Progress.Root>
            <Text size="xs" c="dimmed" w={80} ta="right">
              {progress.done + progress.failed}/{progress.total} steps
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
