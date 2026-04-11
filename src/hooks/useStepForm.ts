import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { z } from 'zod';
import type { Step, OnFailBehavior, StepAction } from '@/types';

const stepSchema = z.object({
  id: z.string().min(1, 'Step ID is required'),
  name: z.string().min(1, 'Step name is required'),
  depends_on: z.array(z.union([
    z.string(),
    z.object({ any: z.array(z.string()).optional(), all: z.array(z.string()).optional() }),
  ])),
  on_fail: z.enum(['abort', 'continue', 'continue_no_err', 'skip_dependents'] as const),
  action: z.object({
    type: z.string(),
  }).passthrough(),
  conditions: z.array(
    z.object({
      var: z.string(),
      op: z.enum(['eq', 'neq', 'contains', 'matches', 'gt', 'lt']),
      value: z.string(),
      negate: z.boolean().optional(),
    }),
  ).optional(),
  output_var: z.string().optional(),
  output_filter: z.object({
    regex: z.string(),
    group: z.number().optional(),
  }).optional(),
  output_extract: z.array(z.object({
    var: z.string(),
    regex: z.string(),
    group: z.number().optional(),
  })).optional(),
  timeout: z.string().optional(),
});

const DEFAULT_ACTION: StepAction = {
  type: 'command',
  command: { interpreter: 'sh', cmd: '' },
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
      output_var: '',
      output_extract: [],
      timeout: '',
      on_fail: 'abort' as OnFailBehavior,
    },
  });
}
