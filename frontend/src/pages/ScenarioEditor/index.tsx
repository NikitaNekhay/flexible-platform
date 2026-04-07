import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  Stack, TextInput, Textarea, TagsInput, Title, Breadcrumbs, Anchor, Skeleton,
  Button, Group, Collapse,
} from '@mantine/core';
import { IconCode, IconForms } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { initEditor, resetEditor, setChainMeta, replaceAllSteps } from '@/store/slices/editorSlice';
import { useGetChainQuery } from '@/store/api/chainsApi';
import { useDAGValidation } from '@/hooks/useDAGValidation';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { useEditorDraft } from '@/hooks/useEditorDraft';
import { MITRE_TACTICS } from '@/utils/constants';
import { EditorToolbar } from './EditorToolbar';
import { StepsTable } from './StepsTable';
import { ScenarioYAMLPanel } from './ScenarioYAMLPanel';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import type { Step } from '@/types';

const DAGViewer = lazy(() => import('./DAGViewer'));

export default function ScenarioEditorPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [showYAML, setShowYAML] = useState(false);

  const { data: chain, isLoading } = useGetChainQuery(id!, { skip: !id });

  const chainName = useAppSelector((s) => s.editor.chainName);
  const chainDescription = useAppSelector((s) => s.editor.chainDescription);
  const chainTags = useAppSelector((s) => s.editor.chainTags);
  const chainMitreTactics = useAppSelector((s) => s.editor.chainMitreTactics);

  // Capture navigation state once on mount (passed from e.g. Atomics library "Add to scenario")
  const initialStepsRef = useRef<Step[] | null>(
    (location.state as { initialSteps?: Step[] } | null)?.initialSteps ?? null,
  );
  // Tracks whether we've already seeded from initialStepsRef — survives StrictMode cleanup
  const initialStepsApplied = useRef(false);

  // Cleanup on unmount only — kept separate so StrictMode's between-run cleanup doesn't
  // wipe steps that were just seeded, then skip re-seeding because the ref was nulled.
  useEffect(() => {
    return () => {
      dispatch(resetEditor());
      initialStepsApplied.current = false;
    };
  }, [dispatch]);

  // Seed editor state from fetched chain or reset for new
  useEffect(() => {
    if (id && chain) {
      dispatch(
        initEditor({
          chainId: chain.id,
          name: chain.name,
          description: chain.description,
          tags: chain.tags,
          mitreTactics: chain.mitre_tactics,
          steps: chain.steps,
        }),
      );
    } else if (!id) {
      dispatch(resetEditor());
      // Seed with steps passed from navigation state (e.g. from Atomics library).
      // Guard with applied ref so StrictMode's double-run doesn't skip seeding on
      // the second pass (ref is alive; applied flag is reset in the cleanup above).
      if (initialStepsRef.current && !initialStepsApplied.current) {
        dispatch(replaceAllSteps(initialStepsRef.current));
        initialStepsApplied.current = true;
      }
    }
  }, [id, chain, dispatch]);

  useDAGValidation();
  useUnsavedChangesWarning();
  useEditorDraft(id);

  if (id && isLoading) {
    return <LoadingOverlay visible />;
  }

  return (
    <Stack gap="md">
      <Breadcrumbs>
        <Anchor component={Link} to="/scenarios" size="sm">
          {t('nav.scenarios')}
        </Anchor>
        <Anchor size="sm" c="dimmed">
          {id ? (chainName || t('editor:title_edit')) : t('editor:title_new')}
        </Anchor>
      </Breadcrumbs>

      <Group justify="space-between" align="center">
        <Title order={3}>
          {id ? t('editor:title_edit') : t('editor:title_new')}
        </Title>
        <Button
          size="xs"
          variant={showYAML ? 'filled' : 'light'}
          color="gray"
          leftSection={showYAML ? <IconForms size={14} /> : <IconCode size={14} />}
          onClick={() => setShowYAML((v) => !v)}
        >
          {showYAML ? 'Form view' : 'YAML view'}
        </Button>
      </Group>

      <EditorToolbar />

      {/* ── FORM VIEW ── */}
      <Collapse in={!showYAML}>
        <Stack gap="md">
          <TextInput
            label={t('editor:fields.name')}
            value={chainName}
            onChange={(e) => dispatch(setChainMeta({ name: e.currentTarget.value }))}
            required
          />

          <Textarea
            label={t('editor:fields.description')}
            value={chainDescription}
            onChange={(e) => dispatch(setChainMeta({ description: e.currentTarget.value }))}
            autosize
            minRows={2}
            maxRows={5}
          />

          <TagsInput
            label={t('editor:fields.tags')}
            value={chainTags}
            onChange={(tags) => dispatch(setChainMeta({ tags }))}
          />

          <TagsInput
            label={t('editor:fields.mitre_tactics')}
            value={chainMitreTactics}
            onChange={(mitreTactics) => dispatch(setChainMeta({ mitreTactics }))}
            data={Object.keys(MITRE_TACTICS)}
          />

          <StepsTable />

          <Suspense fallback={<Skeleton height={400} radius="md" />}>
            <DAGViewer />
          </Suspense>
        </Stack>
      </Collapse>

      {/* ── YAML VIEW ── */}
      <Collapse in={showYAML}>
        <ScenarioYAMLPanel />
      </Collapse>
    </Stack>
  );
}
