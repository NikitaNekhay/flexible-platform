import { MultiSelect, Badge, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import type { DepEntry } from '@/types';

interface DependsOnSelectProps {
  value: DepEntry[];
  onChange: (value: DepEntry[]) => void;
  currentStepId?: string;
}

/** Flatten DepEntry[] to plain string IDs for display. */
function flatStrings(deps: DepEntry[]): string[] {
  return deps.filter((d): d is string => typeof d === 'string');
}

/** Format an operator group for display. */
function formatGroup(g: Exclude<DepEntry, string>): string {
  if (g.any) return `any(${g.any.join(', ')})`;
  if (g.all) return `all(${g.all.join(', ')})`;
  return '?';
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

  // Preserve any operator groups ({any:[...]}/{all:[...]}) that the form can't edit
  const operatorGroups = value.filter((d): d is Exclude<DepEntry, string> => typeof d !== 'string');

  const handleChange = (newStringDeps: string[]) => {
    // Keep operator groups, replace the flat string portion
    onChange([...newStringDeps, ...operatorGroups]);
  };

  return (
    <>
      <MultiSelect
        label={t('editor:step_modal.field_depends_on')}
        data={data}
        value={flatStrings(value)}
        onChange={handleChange}
        placeholder={data.length === 0 ? 'No other steps' : 'Select dependencies...'}
        searchable
        clearable
        comboboxProps={{ withinPortal: false }}
      />
      {operatorGroups.length > 0 && (
        <Group gap={4} mt={4}>
          <Text size="xs" c="dimmed">Operator deps (edit in YAML):</Text>
          {operatorGroups.map((g, i) => (
            <Badge key={i} size="xs" variant="outline" color="violet">{formatGroup(g)}</Badge>
          ))}
        </Group>
      )}
    </>
  );
}
