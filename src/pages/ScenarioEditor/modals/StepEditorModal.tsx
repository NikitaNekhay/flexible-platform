import { lazy, Suspense, useState } from 'react';
import {
  Tabs,
  Stack,
  TextInput,
  Select,
  Button,
  Group,
  SegmentedControl,
  Alert,
  Loader,
  Center,
  Text,
  Badge,
  Switch,
  NumberInput,
  ActionIcon,
} from '@mantine/core';
import { IconAlertCircle, IconForms, IconCode, IconPlus, IconTrash } from '@tabler/icons-react';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import { useTranslation } from 'react-i18next';
import type { ContextModalProps } from '@mantine/modals';
import type { Step, StepAction, ActionType, StepCondition, OutputCapture } from '@/types';
import { useStepForm } from '@/hooks/useStepForm';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addStep, updateStep } from '@/store/slices/editorSlice';
import { ActionTypeSelect } from '@/components/forms/ActionTypeSelect';
import { DependsOnSelect } from '@/components/forms/DependsOnSelect';
import { CommandForm } from '../forms/CommandForm';
import { AtomicForm } from '../forms/AtomicForm';
import { BinaryForm } from '../forms/BinaryForm';
import { UploadForm } from '../forms/UploadForm';
import { SliverRpcForm } from '../forms/SliverRpcForm';
import { PythonForm } from '../forms/PythonForm';
import { ProbeForm } from '../forms/ProbeForm';
import { ON_FAIL_OPTIONS } from '@/utils/constants';
import { isValidStepId } from '@/utils/validation';
import { stepToYAML, yamlToStep } from '@/utils/yamlUtils';

const CodeMirror = lazy(() => import('@uiw/react-codemirror'));

interface StepEditorInnerProps {
  step?: Step;
  isNew?: boolean;
}

function getDefaultAction(type: ActionType): StepAction {
  switch (type) {
    case 'command':
      return { type: 'command', command: { interpreter: 'sh', cmd: '' } };
    case 'atomic':
      return { type: 'atomic', atomic_ref: { id: '', test: 0, args: {} } };
    case 'binary':
      return { type: 'binary', binary: { remote_path: '', platform: 'linux' } };
    case 'upload':
      return { type: 'upload', upload: { remote_path: '' } };
    case 'sliver_rpc':
      return { type: 'sliver_rpc', sliver_rpc: { method: '', params: {} } };
    case 'python':
      return { type: 'python', python: { inline: '' } };
    case 'probe':
      return { type: 'probe', probe: { kind: 'os', platform: 'linux' } };
  }
}

function ActionSubForm({ action, onChange }: { action: StepAction; onChange: (a: StepAction) => void }) {
  switch (action.type) {
    case 'command': return <CommandForm value={action} onChange={onChange} />;
    case 'atomic':  return <AtomicForm  value={action} onChange={onChange} />;
    case 'binary':  return <BinaryForm  value={action} onChange={onChange} />;
    case 'upload':  return <UploadForm  value={action} onChange={onChange} />;
    case 'sliver_rpc': return <SliverRpcForm value={action} onChange={onChange} />;
    case 'python':  return <PythonForm  value={action} onChange={onChange} />;
    case 'probe':   return <ProbeForm   value={action} onChange={onChange} />;
  }
}

const CONDITION_OPERATORS = [
  { value: 'eq',       label: 'eq — exact match' },
  { value: 'neq',      label: 'neq — not equal' },
  { value: 'contains', label: 'contains — substring' },
  { value: 'matches',  label: 'matches — regex' },
  { value: 'gt',       label: 'gt — greater than' },
  { value: 'lt',       label: 'lt — less than' },
];

export function StepEditorModal({
  context,
  id,
  innerProps,
}: ContextModalProps<StepEditorInnerProps>) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const existingIds = useAppSelector((s) => s.editor.steps.map((step) => step.id));
  const form = useStepForm(innerProps.step);

  const [activeTab, setActiveTab] = useState('general');
  const [viewMode, setViewMode] = useState<'form' | 'yaml'>('form');
  const [yamlText, setYamlText] = useState(() => stepToYAML(innerProps.step ?? {
    id: '', name: '', depends_on: [], on_fail: 'abort',
    action: getDefaultAction('command'),
  } as Step));
  const [yamlError, setYamlError] = useState<string | null>(null);

  // Switching form → yaml: serialize current form state to YAML
  const handleSwitchToYAML = () => {
    setYamlText(stepToYAML(form.values));
    setYamlError(null);
    setViewMode('yaml');
  };

  // Switching yaml → form: parse YAML back into form
  const handleSwitchToForm = () => {
    setYamlError(null);
    try {
      const parsed = yamlToStep(yamlText);
      form.setValues(parsed);
      setViewMode('form');
    } catch (e) {
      setYamlError(e instanceof Error ? e.message : 'YAML parse error');
    }
  };

  const handleModeChange = (mode: string) => {
    if (mode === 'yaml') handleSwitchToYAML();
    else handleSwitchToForm();
  };

  const handleActionTypeChange = (newType: ActionType) => {
    if (newType !== form.values.action.type) {
      form.setFieldValue('action', getDefaultAction(newType));
    }
  };

  const handleConditionAdd = () => {
    form.setFieldValue('conditions', [
      ...(form.values.conditions ?? []),
      { var: '', op: 'eq' as const, value: '', negate: false },
    ]);
  };

  const handleConditionRemove = (index: number) => {
    const conditions = [...(form.values.conditions ?? [])];
    conditions.splice(index, 1);
    form.setFieldValue('conditions', conditions);
  };

  const handleOutputExtractAdd = () => {
    form.setFieldValue('output_extract', [
      ...(form.values.output_extract ?? []),
      { var: '', regex: '', group: 1 },
    ]);
  };

  const handleOutputExtractRemove = (index: number) => {
    const items = [...(form.values.output_extract ?? [])];
    items.splice(index, 1);
    form.setFieldValue('output_extract', items);
  };

  const handleSubmitForm = (values: Step) => {
    if (innerProps.isNew) {
      if (!isValidStepId(values.id)) {
        form.setFieldError('id', 'Step ID must contain only letters, numbers, underscores, dots, or hyphens');
        setActiveTab('general');
        return;
      }
      if (existingIds.includes(values.id)) {
        form.setFieldError('id', t('editor:validation.duplicate_id', { id: values.id }));
        setActiveTab('general');
        return;
      }
      dispatch(addStep(values));
    } else {
      dispatch(updateStep(values));
    }
    context.closeModal(id);
  };

  // Manual validate + smart tab switch on error (fixes: errors on hidden tab go unseen)
  const handleFormCreate = () => {
    const { hasErrors } = form.validate();
    if (hasErrors) {
      const keys = Object.keys(form.errors);
      if (keys.some((k) => ['id', 'name', 'on_fail', 'depends_on'].includes(k))) {
        setActiveTab('general');
      } else if (keys.some((k) => k.startsWith('action'))) {
        setActiveTab('action');
      } else if (keys.some((k) => k.startsWith('conditions'))) {
        setActiveTab('conditions');
      } else {
        setActiveTab('output');
      }
      return;
    }
    handleSubmitForm(form.values);
  };

  const handleSubmitYAML = () => {
    setYamlError(null);
    let parsed: Step;
    try {
      parsed = yamlToStep(yamlText);
    } catch (e) {
      setYamlError(e instanceof Error ? e.message : 'YAML parse error');
      return;
    }
    if (innerProps.isNew) {
      if (!isValidStepId(parsed.id)) {
        setYamlError('Step ID must contain only letters, numbers, underscores, dots, or hyphens');
        return;
      }
      if (existingIds.includes(parsed.id)) {
        setYamlError(`Duplicate step ID: "${parsed.id}" already exists in this scenario`);
        return;
      }
      dispatch(addStep(parsed));
    } else {
      dispatch(updateStep(parsed));
    }
    context.closeModal(id);
  };

  const onFailData = ON_FAIL_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.label) }));
  const isAtomic = form.values.action.type === 'atomic';

  return (
    <Stack gap="sm">
      {/* View toggle */}
      <Group justify="space-between" align="center">
        <Group gap="xs">
          {isAtomic && viewMode === 'yaml' && (
            <Badge size="xs" color="violet" variant="light">
              Atomic — edit args or any field freely in YAML
            </Badge>
          )}
        </Group>
        <SegmentedControl
          size="xs"
          value={viewMode}
          onChange={handleModeChange}
          data={[
            { value: 'form', label: <Group gap={4}><IconForms size={14} /><Text size="xs">Form</Text></Group> },
            { value: 'yaml', label: <Group gap={4}><IconCode size={14} /><Text size="xs">YAML</Text></Group> },
          ]}
        />
      </Group>

      {/* ── FORM VIEW ─────────────────────────────────────── */}
      {viewMode === 'form' && (
        <Stack gap="sm">
          <Tabs value={activeTab} onChange={(v) => v && setActiveTab(v)}>
            <Tabs.List>
              <Tabs.Tab value="general">{t('editor:step_modal.tab_general')}</Tabs.Tab>
              <Tabs.Tab value="action">{t('editor:step_modal.tab_action')}</Tabs.Tab>
              <Tabs.Tab value="conditions">{t('editor:step_modal.tab_conditions')}</Tabs.Tab>
              <Tabs.Tab value="output">{t('editor:step_modal.tab_output')}</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="general" pt="md">
              <Stack gap="sm">
                <TextInput
                  label={t('editor:step_modal.field_id')}
                  placeholder={t('editor:step_modal.placeholder_id')}
                  disabled={!innerProps.isNew}
                  {...form.getInputProps('id')}
                />
                <TextInput
                  label={t('editor:step_modal.field_name')}
                  placeholder={t('editor:step_modal.placeholder_name')}
                  {...form.getInputProps('name')}
                />
                <Select
                  label={t('editor:step_modal.field_on_fail')}
                  data={onFailData}
                  {...form.getInputProps('on_fail')}
                  allowDeselect={false}
                  comboboxProps={{ withinPortal: false }}
                />
                <DependsOnSelect
                  value={form.values.depends_on}
                  onChange={(v) => form.setFieldValue('depends_on', v)}
                  currentStepId={form.values.id}
                />
                <TextInput
                  label="Timeout"
                  placeholder="e.g. 30s, 5m (leave empty for default 60s)"
                  {...form.getInputProps('timeout')}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="action" pt="md">
              <Stack gap="sm">
                <ActionTypeSelect
                  value={form.values.action.type}
                  onChange={handleActionTypeChange}
                />
                <ActionSubForm
                  action={form.values.action}
                  onChange={(a) => form.setFieldValue('action', a)}
                />
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="conditions" pt="md">
              <Stack gap="sm">
                {(form.values.conditions ?? []).map((cond: StepCondition, i: number) => (
                  <Group key={i} grow align="flex-end">
                    <TextInput
                      label="Variable"
                      placeholder="e.g. victim_os"
                      value={cond.var}
                      onChange={(e) => {
                        const conditions = [...(form.values.conditions ?? [])];
                        conditions[i] = { ...conditions[i], var: e.currentTarget.value };
                        form.setFieldValue('conditions', conditions);
                      }}
                    />
                    <Select
                      label="Operator"
                      data={CONDITION_OPERATORS}
                      value={cond.op}
                      onChange={(v) => {
                        const conditions = [...(form.values.conditions ?? [])];
                        conditions[i] = { ...conditions[i], op: (v ?? 'eq') as StepCondition['op'] };
                        form.setFieldValue('conditions', conditions);
                      }}
                      allowDeselect={false}
                      comboboxProps={{ withinPortal: false }}
                    />
                    <TextInput
                      label="Value"
                      placeholder="e.g. Linux"
                      value={cond.value}
                      onChange={(e) => {
                        const conditions = [...(form.values.conditions ?? [])];
                        conditions[i] = { ...conditions[i], value: e.currentTarget.value };
                        form.setFieldValue('conditions', conditions);
                      }}
                    />
                    <Switch
                      label="Negate"
                      checked={cond.negate ?? false}
                      onChange={(e) => {
                        const conditions = [...(form.values.conditions ?? [])];
                        conditions[i] = { ...conditions[i], negate: e.currentTarget.checked };
                        form.setFieldValue('conditions', conditions);
                      }}
                    />
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleConditionRemove(i)}>
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                ))}
                <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={handleConditionAdd}>
                  Add Condition
                </Button>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="output" pt="md">
              <Stack gap="sm">
                <TextInput
                  label="Output Variable (output_var)"
                  placeholder="e.g. victim_os — captures full stdout as this variable"
                  value={form.values.output_var ?? ''}
                  onChange={(e) => form.setFieldValue('output_var', e.currentTarget.value)}
                />

                <Stack gap="xs">
                  <Text size="sm" fw={500}>Output Extract (output_extract)</Text>
                  <Text size="xs" c="dimmed">Extract multiple named variables from stdout using regex capture groups.</Text>
                  {(form.values.output_extract ?? []).map((item: OutputCapture, i: number) => (
                    <Group key={i} grow align="flex-end">
                      <TextInput
                        label="Var name"
                        placeholder="e.g. uid"
                        value={item.var}
                        onChange={(e) => {
                          const items = [...(form.values.output_extract ?? [])];
                          items[i] = { ...items[i], var: e.currentTarget.value };
                          form.setFieldValue('output_extract', items);
                        }}
                      />
                      <TextInput
                        label="Regex"
                        placeholder={`e.g. uid=(\\d+)`}
                        value={item.regex}
                        onChange={(e) => {
                          const items = [...(form.values.output_extract ?? [])];
                          items[i] = { ...items[i], regex: e.currentTarget.value };
                          form.setFieldValue('output_extract', items);
                        }}
                      />
                      <NumberInput
                        label="Group"
                        placeholder="1"
                        min={1}
                        value={item.group ?? 1}
                        onChange={(v) => {
                          const items = [...(form.values.output_extract ?? [])];
                          items[i] = { ...items[i], group: typeof v === 'number' ? v : 1 };
                          form.setFieldValue('output_extract', items);
                        }}
                      />
                      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleOutputExtractRemove(i)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  ))}
                  <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={handleOutputExtractAdd}>
                    Add Extract Rule
                  </Button>
                </Stack>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => context.closeModal(id)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleFormCreate}>
              {innerProps.isNew ? t('actions.create') : t('actions.save')}
            </Button>
          </Group>
        </Stack>
      )}

      {/* ── YAML VIEW ─────────────────────────────────────── */}
      {viewMode === 'yaml' && (
        <Stack gap="sm">
          <Suspense fallback={<Center h={420}><Loader size="sm" /></Center>}>
            <CodeMirror
              value={yamlText}
              onChange={setYamlText}
              extensions={[yamlLang()]}
              theme="dark"
              height="420px"
              basicSetup={{ lineNumbers: true, foldGutter: true, autocompletion: false, highlightActiveLine: true }}
            />
          </Suspense>

          {yamlError && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
              {yamlError}
            </Alert>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={() => context.closeModal(id)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleSubmitYAML}>
              {innerProps.isNew ? t('actions.create') : t('actions.save')}
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  );
}
