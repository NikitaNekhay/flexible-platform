import { Code, CopyButton, ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconCopy, IconCheck } from '@tabler/icons-react';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
  return (
    <Group gap={0} align="flex-start" style={{ position: 'relative' }}>
      <Code block style={{ flex: 1, paddingRight: 40 }}>
        {code}
      </Code>
      <CopyButton value={code} timeout={2000}>
        {({ copied, copy }) => (
          <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="left">
            <ActionIcon
              color={copied ? 'teal' : 'gray'}
              variant="subtle"
              onClick={copy}
              style={{ position: 'absolute', top: 4, right: 4 }}
            >
              {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
            </ActionIcon>
          </Tooltip>
        )}
      </CopyButton>
    </Group>
  );
}
