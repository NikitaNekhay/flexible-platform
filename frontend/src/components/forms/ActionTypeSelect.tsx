import { Select } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ActionType } from '@/types';
import { ACTION_TYPES } from '@/utils/constants';

interface ActionTypeSelectProps {
  value: ActionType;
  onChange: (value: ActionType) => void;
}

export function ActionTypeSelect({ value, onChange }: ActionTypeSelectProps) {
  const { t } = useTranslation();

  const data = ACTION_TYPES.map((item) => ({
    value: item.value,
    label: t(item.label),
  }));

  return (
    <Select
      label={t('editor:step_modal.tab_action')}
      data={data}
      value={value}
      onChange={(v) => v && onChange(v as ActionType)}
      allowDeselect={false}
    />
  );
}
