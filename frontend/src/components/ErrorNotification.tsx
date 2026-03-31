import { useState } from 'react';
import { Text, UnstyledButton, Group, Code, Collapse, Stack, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconChevronDown, IconChevronUp } from '@tabler/icons-react';

interface ErrorNotificationContentProps {
  title: string;
  message: string;
  details?: string;
}

function ErrorNotificationContent({ title, message, details }: ErrorNotificationContentProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Stack gap={4}>
      <Text size="sm" fw={600} c="red.4">
        {title}
      </Text>
      <Text size="sm" c="dimmed">
        {message}
      </Text>
      {details && (
        <>
          <UnstyledButton onClick={() => setExpanded((v) => !v)}>
            <Group gap={4}>
              <Text size="xs" c="dimmed" td="underline">
                {expanded ? 'Hide details' : 'Show details'}
              </Text>
              {expanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
            </Group>
          </UnstyledButton>
          <Collapse in={expanded}>
            <Box
              style={{
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              <Code block style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>
                {details}
              </Code>
            </Box>
          </Collapse>
        </>
      )}
    </Stack>
  );
}

export interface ShowErrorOptions {
  title: string;
  message: string;
  details?: string;
  autoClose?: number | false;
}

export function showErrorNotification({ title, message, details, autoClose = 8000 }: ShowErrorOptions) {
  notifications.show({
    color: 'red',
    icon: <IconAlertTriangle size={18} />,
    autoClose,
    withCloseButton: true,
    message: <ErrorNotificationContent title={title} message={message} details={details} />,
    styles: {
      root: { minWidth: 340, maxWidth: 480 },
    },
  });
}

/**
 * Extract a human-readable error from various error shapes
 * (Axios, RTK Query, native Error, string, etc.)
 */
export function extractError(error: unknown): { message: string; details?: string } {
  if (!error) return { message: 'Unknown error' };

  // RTK Query / axiosBaseQuery error shape: { status, data }
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const e = error as { status?: number; data: unknown };
    const status = e.status ? `HTTP ${e.status}` : '';

    if (typeof e.data === 'string') {
      return { message: e.data, details: status || undefined };
    }

    if (typeof e.data === 'object' && e.data !== null) {
      const d = e.data as Record<string, unknown>;
      const msg =
        (typeof d.message === 'string' && d.message) ||
        (typeof d.error === 'string' && d.error) ||
        (typeof d.detail === 'string' && d.detail) ||
        status ||
        'Request failed';
      return {
        message: msg,
        details: JSON.stringify(e.data, null, 2),
      };
    }

    return { message: status || 'Request failed' };
  }

  // Native Error
  if (error instanceof Error) {
    return { message: error.message, details: error.stack };
  }

  // String
  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: String(error) };
}
