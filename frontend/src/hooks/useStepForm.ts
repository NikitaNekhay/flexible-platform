import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import type { Step, OnFailBehavior, StepAction } from '@/types';

const stepSchema = z.object({
  id: z.string().min(1, 'Step ID is required'),
  name: z.string().min(1, 'Step name is required'),
  depends_on: z.array(z.string()),
  on_fail: z.enum(['stop', 'continue', 'skip_dependents'] as const),
  action: z.object({
    type: z.string(),
  }).passthrough(),
  conditions: z.array(
    z.object({
      variable: z.string(),
      operator: z.enum(['eq', 'neq', 'contains', 'regex']),
      value: z.string(),
    }),
  ).optional(),
  output_vars: z.array(z.string()).optional(),
});

const DEFAULT_ACTION: StepAction = {
  type: 'command',
  executor: '',
  command: '',
};

export function useStepForm(initial?: Step) {
  return useForm<Step>({
    validate: zodResolver(stepSchema) as any,
    initialValues: initial ?? {
      id: '',
      name: '',
      depends_on: [],
      action: DEFAULT_ACTION,
      conditions: [],
      output_vars: [],
      on_fail: 'stop' as OnFailBehavior,
    },
  });
}
