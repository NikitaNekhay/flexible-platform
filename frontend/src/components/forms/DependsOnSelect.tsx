import { MultiSelect } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';

interface DependsOnSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  currentStepId?: string;
}

export function DependsOnSelect({ value, onChange, currentStepId }: DependsOnSelectProps) {
  const { t } = useTranslation();
  const steps = useAppSelector((s) => s.editor.steps);

  const data = steps
    .filter((step) => step.id !== currentStepId)
    .map((step) => ({
      value: step.id,
      label: `${step.id} — ${step.name}`,
    }));

  return (
    <MultiSelect
      label={t('editor:step_modal.field_depends_on')}
      data={data}
      value={value}
      onChange={onChange}
      placeholder={data.length === 0 ? 'No other steps' : 'Select dependencies...'}
      searchable
      clearable
      comboboxProps={{ withinPortal: false }}
    />
  );
}
