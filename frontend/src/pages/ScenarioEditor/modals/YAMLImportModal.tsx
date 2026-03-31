import { useState } from 'react';
import { Stack, Button, Group, Text, Alert } from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import CodeMirror from '@uiw/react-codemirror';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import type { ContextModalProps } from '@mantine/modals';
import type { ChainCreatePayload } from '@/types';
import { yamlToChain } from '@/utils/yamlUtils';

interface YAMLImportInnerProps {
  onImport: (chain: ChainCreatePayload) => void;
}

export function YAMLImportModal({
  context,
  id,
  innerProps,
}: ContextModalProps<YAMLImportInnerProps>) {
  const { t } = useTranslation();
  const [yamlText, setYamlText] = useState('');
  const [parsed, setParsed] = useState<ChainCreatePayload | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParse = () => {
    try {
      const result = yamlToChain(yamlText);
      setParsed(result);
      setParseError(null);
    } catch (e) {
      setParsed(null);
      setParseError(e instanceof Error ? e.message : 'Unknown parse error');
    }
  };

  const handleImport = () => {
    if (parsed) {
      innerProps.onImport(parsed);
      context.closeModal(id);
    }
  };

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {t('editor:yaml_import.paste_yaml')}
      </Text>

      <CodeMirror
        value={yamlText}
        onChange={setYamlText}
        extensions={[yamlLang()]}
        theme="dark"
        height="300px"
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
        }}
      />

      {parseError && (
        <Alert color="red" icon={<IconAlertCircle size={16} />} title={t('editor:yaml_import.parse_error')}>
          {parseError}
        </Alert>
      )}

      {parsed && (
        <Alert color="green" icon={<IconCheck size={16} />}>
          {t('editor:yaml_import.parse_success', { count: parsed.steps.length })} —
          &quot;{parsed.name}&quot;
        </Alert>
      )}

      <Group justify="flex-end">
        <Button variant="default" onClick={() => context.closeModal(id)}>
          {t('actions.cancel')}
        </Button>
        <Button variant="light" onClick={handleParse} disabled={!yamlText.trim()}>
          {t('editor:yaml_import.parse')}
        </Button>
        <Button onClick={handleImport} disabled={!parsed}>
          {t('editor:yaml_import.import')}
        </Button>
      </Group>
    </Stack>
  );
}
