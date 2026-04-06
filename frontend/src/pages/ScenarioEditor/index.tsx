import { lazy, Suspense, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Stack, TextInput, Textarea, TagsInput, Title, Breadcrumbs, Anchor, Skeleton } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { initEditor, resetEditor, setChainMeta } from '@/store/slices/editorSlice';
import { useGetChainQuery } from '@/store/api/chainsApi';
import { useDAGValidation } from '@/hooks/useDAGValidation';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { useEditorDraft } from '@/hooks/useEditorDraft';
import { MITRE_TACTICS } from '@/utils/constants';
import { EditorToolbar } from './EditorToolbar';
import { StepsTable } from './StepsTable';
import { LoadingOverlay } from '@/components/LoadingOverlay';

const DAGViewer = lazy(() => import('./DAGViewer'));

export default function ScenarioEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { data: chain, isLoading } = useGetChainQuery(id!, { skip: !id });

  const chainName = useAppSelector((s) => s.editor.chainName);
  const chainDescription = useAppSelector((s) => s.editor.chainDescription);
  const chainTags = useAppSelector((s) => s.editor.chainTags);
  const chainMitreTactics = useAppSelector((s) => s.editor.chainMitreTactics);

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
    }
    return () => {
      dispatch(resetEditor());
    };
  }, [id, chain, dispatch]);

  // Run DAG validation on every step change
  useDAGValidation();

  // Warn before leaving with unsaved changes
  useUnsavedChangesWarning();

  // Persist draft to sessionStorage for crash recovery
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

      <Title order={3}>
        {id ? t('editor:title_edit') : t('editor:title_new')}
      </Title>

      <EditorToolbar />

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
  );
}
