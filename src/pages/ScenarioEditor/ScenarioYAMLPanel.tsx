import { lazy, Suspense, useState } from 'react';
import { Stack, Button, Group, Alert, Loader, Center, Text, Paper } from '@mantine/core';
import { IconAlertCircle, IconCheck, IconRefresh } from '@tabler/icons-react';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { replaceAllSteps, setChainMeta } from '@/store/slices/editorSlice';
import { chainToYAML, yamlToChain } from '@/utils/yamlUtils';

const CodeMirror = lazy(() => import('@uiw/react-codemirror'));

/**
 * Inline YAML editor for the whole scenario.
 * Reflects current editor state; user can edit freely and apply changes.
 * Does NOT auto-sync — requires explicit Apply to avoid conflicts with the form fields above.
 */
export function ScenarioYAMLPanel() {
  const dispatch = useAppDispatch();
  const chainName = useAppSelector((s) => s.editor.chainName);
  const chainDescription = useAppSelector((s) => s.editor.chainDescription);
  const chainTags = useAppSelector((s) => s.editor.chainTags);
  const chainMitreTactics = useAppSelector((s) => s.editor.chainMitreTactics);
  const steps = useAppSelector((s) => s.editor.steps);

  const getCurrentYAML = () =>
    chainToYAML({
      name: chainName,
      description: chainDescription,
      tags: chainTags,
      mitre_tactics: chainMitreTactics,
      steps,
    });

  const [yamlText, setYamlText] = useState(getCurrentYAML);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  // Refresh YAML from store when user clicks refresh
  const handleRefresh = () => {
    setYamlText(getCurrentYAML());
    setError(null);
    setApplied(false);
  };

  const handleApply = () => {
    setError(null);
    setApplied(false);
    try {
      const parsed = yamlToChain(yamlText);
      dispatch(replaceAllSteps(parsed.steps));
      dispatch(
        setChainMeta({
          name: parsed.name,
          description: parsed.description,
          tags: parsed.tags,
          mitreTactics: parsed.mitre_tactics,
        }),
      );
      setApplied(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'YAML parse error');
    }
  };

  return (
    <Paper withBorder p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text size="sm" fw={600}>
            Scenario YAML
          </Text>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Edit directly — click Apply to update the scenario
            </Text>
            <Button
              size="xs"
              variant="subtle"
              leftSection={<IconRefresh size={14} />}
              onClick={handleRefresh}
            >
              Refresh from editor
            </Button>
          </Group>
        </Group>

        <Suspense fallback={<Center h={500}><Loader size="sm" /></Center>}>
          <CodeMirror
            value={yamlText}
            onChange={(v) => {
              setYamlText(v);
              setApplied(false);
            }}
            extensions={[yamlLang()]}
            theme="dark"
            height="500px"
            basicSetup={{
              lineNumbers: true,
              foldGutter: true,
              autocompletion: false,
              highlightActiveLine: true,
            }}
          />
        </Suspense>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
            {error}
          </Alert>
        )}

        {applied && (
          <Alert icon={<IconCheck size={16} />} color="green" variant="light">
            Applied — scenario updated from YAML.
          </Alert>
        )}

        <Group justify="flex-end">
          <Button
            variant="light"
            color="teal"
            onClick={handleApply}
          >
            Apply YAML
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
