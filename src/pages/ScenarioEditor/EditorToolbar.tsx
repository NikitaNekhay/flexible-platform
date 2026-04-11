import { Group, Button, Badge, Alert } from '@mantine/core';
import {
  IconDeviceFloppy,
  IconCheck,
  IconFileExport,
  IconFileImport,
  IconPlus,
  IconArrowLeft,
  IconFlask,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  replaceAllSteps,
  setChainMeta,
  markClean,
  initEditor,
  addStep,
} from '@/store/slices/editorSlice';
import {
  useCreateChainMutation,
  useUpdateChainMutation,
  useExecuteChainMutation,
} from '@/store/api/chainsApi';
import { useYAML } from '@/hooks/useYAML';
import { usePermissions } from '@/hooks/usePermissions';
import { openConfirmModal } from '@/components/ConfirmModal';
import type { ChainCreatePayload, Atomic } from '@/types';
import { v4Fallback } from './idUtils';

export function EditorToolbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { canEdit } = usePermissions();
  const { downloadYAML } = useYAML();

  const chainId = useAppSelector((s) => s.editor.chainId);
  const chainName = useAppSelector((s) => s.editor.chainName);
  const chainDescription = useAppSelector((s) => s.editor.chainDescription);
  const chainTags = useAppSelector((s) => s.editor.chainTags);
  const chainMitreTactics = useAppSelector((s) => s.editor.chainMitreTactics);
  const steps = useAppSelector((s) => s.editor.steps);
  const isDirty = useAppSelector((s) => s.editor.isDirty);
  const validation = useAppSelector((s) => s.editor.validationState);

  const [createChain, { isLoading: isCreating }] = useCreateChainMutation();
  const [updateChain, { isLoading: isUpdating }] = useUpdateChainMutation();
  const [executeChain, { isLoading: isValidating }] = useExecuteChainMutation();

  const isSaving = isCreating || isUpdating;

  const handleSave = async () => {
    if (!chainName.trim()) {
      notifications.show({ title: 'Scenario name required', message: 'Please enter a name before saving', color: 'yellow' });
      return;
    }
    if (!validation.valid) {
      notifications.show({ title: t('editor:validation.invalid'), message: '', color: 'red' });
      return;
    }

    // Strip frontend-only metadata from atomic_ref before sending to backend
    const sanitizedSteps = steps.map((step) => {
      if (step.action.type !== 'atomic') return step;
      const { name: _n, guid: _g, ...cleanRef } = step.action.atomic_ref as typeof step.action.atomic_ref & { name?: string; guid?: string };
      return { ...step, action: { type: 'atomic' as const, atomic_ref: cleanRef } };
    });

    const payload: ChainCreatePayload = {
      name: chainName.trim(),
      description: chainDescription,
      tags: chainTags,
      mitre_tactics: chainMitreTactics,
      steps: sanitizedSteps,
    };

    if (chainId) {
      const result = await updateChain({ id: chainId, body: payload });
      if ('data' in result) {
        dispatch(markClean());
        notifications.show({ title: t('editor:scenario_saved'), message: '', color: 'green' });
      }
    } else {
      const result = await createChain(payload);
      if ('data' in result) {
        // Write the new chainId into the store immediately so that:
        // (a) useBlocker reads isDirty=false from store.getState() before React re-renders;
        // (b) if navigation is somehow cancelled, any re-save uses updateChain, not createChain.
        dispatch(initEditor({
          chainId: result.data!.id,
          name: chainName.trim(),
          description: chainDescription,
          tags: chainTags,
          mitreTactics: chainMitreTactics,
          steps: sanitizedSteps,
        }));
        notifications.show({ title: t('editor:scenario_created'), message: '', color: 'green' });
        navigate(`/editor/${result.data!.id}`, { replace: true });
      }
    }
  };

  const handleValidate = async () => {
    if (!chainId) {
      notifications.show({ title: 'Save first', message: 'Save the scenario before validating', color: 'yellow' });
      return;
    }
    const result = await executeChain({ id: chainId, body: { session_id: 'dry-run', dry_run: true } });
    if ('data' in result) {
      notifications.show({ title: t('editor:validation.dry_run_success'), message: '', color: 'green' });
    } else {
      notifications.show({ title: t('editor:validation.dry_run_failed', { error: '' }), message: '', color: 'red' });
    }
  };

  const handleAddStep = () => {
    modals.openContextModal({
      modal: 'stepEditor',
      title: t('editor:step_modal.title_new'),
      size: 'xl',
      closeOnClickOutside: false,
      innerProps: { isNew: true },
    });
  };

  const handleAddAtomic = () => {
    modals.openContextModal({
      modal: 'atomicSelector',
      title: 'Add Atomic from Library',
      size: 'xl',
      closeOnClickOutside: false,
      innerProps: {
        onSelect: (atomic: Atomic, testIndex: number) => {
          const test = atomic.tests[testIndex];
          const defaultArgs: Record<string, string> = {};
          for (const arg of test?.arguments ?? []) {
            defaultArgs[arg.name] = arg.default ?? '';
          }
          dispatch(
            addStep({
              id: `${atomic.technique_id}_${testIndex}_${v4Fallback()}`,
              name: `${atomic.technique_id} — ${test?.name ?? ''}`,
              depends_on: [],
              on_fail: 'abort',
              action: {
                type: 'atomic',
                atomic_ref: {
                  id: atomic.technique_id,
                  test: testIndex,
                  args: defaultArgs,
                },
              },
            }),
          );
        },
      },
    });
  };

  const handleImportYAML = () => {
    modals.openContextModal({
      modal: 'yamlImport',
      title: t('editor:yaml_import.title'),
      size: 'xl',
      innerProps: {
        onImport: (data: ChainCreatePayload) => {
          dispatch(replaceAllSteps(data.steps));
          dispatch(setChainMeta({
            name: data.name,
            description: data.description,
            tags: data.tags,
            mitreTactics: data.mitre_tactics,
          }));
        },
      },
    });
  };

  const handleBack = () => {
    if (isDirty) {
      openConfirmModal({
        title: t('actions.back'),
        message: t('editor:unsaved_changes'),
        confirmLabel: t('actions.confirm'),
        onConfirm: () => navigate('/scenarios'),
      });
    } else {
      navigate('/scenarios');
    }
  };

  return (
    <>
      <Group justify="space-between">
        <Group gap="sm">
          <Button variant="subtle" leftSection={<IconArrowLeft size={16} />} onClick={handleBack}>
            {t('actions.back')}
          </Button>
          {isDirty && <Badge color="yellow" variant="light">Unsaved</Badge>}
          {!validation.valid && <Badge color="red" variant="light">Invalid</Badge>}
        </Group>
        <Group gap="sm">
          {canEdit && (
            <>
              <Button variant="light" leftSection={<IconPlus size={16} />} onClick={handleAddStep}>
                {t('editor:toolbar.add_step')}
              </Button>
              <Button variant="light" color="violet" leftSection={<IconFlask size={16} />} onClick={handleAddAtomic}>
                Add Atomic
              </Button>
              <Button variant="light" leftSection={<IconFileImport size={16} />} onClick={handleImportYAML}>
                {t('editor:toolbar.import_yaml')}
              </Button>
            </>
          )}
          <Button variant="light" leftSection={<IconFileExport size={16} />} onClick={downloadYAML}>
            {t('editor:toolbar.export_yaml')}
          </Button>
          {canEdit && (
            <>
              <Button
                variant="light"
                color="teal"
                leftSection={<IconCheck size={16} />}
                onClick={handleValidate}
                loading={isValidating}
              >
                {t('editor:toolbar.validate')}
              </Button>
              <Button
                leftSection={<IconDeviceFloppy size={16} />}
                onClick={handleSave}
                loading={isSaving}
                disabled={!validation.valid}
              >
                {t('editor:toolbar.save')}
              </Button>
            </>
          )}
        </Group>
      </Group>

      {!validation.valid && (
        <Alert color="red" variant="light" mt="sm">
          {validation.cycleNodes.length > 0 &&
            t('editor:validation.cycle_detected', { steps: validation.cycleNodes.join(', ') })}
          {validation.missingDeps.map((md) => (
            <div key={`${md.stepId}-${md.missingDep}`}>
              {t('editor:validation.missing_dep', { stepId: md.stepId, dep: md.missingDep })}
            </div>
          ))}
          {validation.duplicateIds.map((dup) => (
            <div key={dup}>
              {t('editor:validation.duplicate_id', { id: dup })}
            </div>
          ))}
        </Alert>
      )}
    </>
  );
}
