import { Group, Button, Badge, Alert } from '@mantine/core';
import {
  IconDeviceFloppy,
  IconCheck,
  IconFileExport,
  IconFileImport,
  IconPlus,
  IconArrowLeft,
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
} from '@/store/slices/editorSlice';
import {
  useCreateChainMutation,
  useUpdateChainMutation,
  useExecuteChainMutation,
} from '@/store/api/chainsApi';
import { useYAML } from '@/hooks/useYAML';
import { usePermissions } from '@/hooks/usePermissions';
import { openConfirmModal } from '@/components/ConfirmModal';
import type { ChainCreatePayload } from '@/types';

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
    if (!validation.valid) {
      notifications.show({ title: t('editor:validation.invalid'), message: '', color: 'red' });
      return;
    }

    const payload: ChainCreatePayload = {
      name: chainName,
      description: chainDescription,
      tags: chainTags,
      mitre_tactics: chainMitreTactics,
      steps,
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
        dispatch(markClean());
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
      innerProps: { isNew: true },
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
