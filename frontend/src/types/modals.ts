import type { ContextModalProps } from '@mantine/modals';
import type { Step, ChainCreatePayload, Atomic } from '@/types';

export interface ContextModalMap {
  stepEditor: ContextModalProps<{ step?: Step }>;
  atomicSelector: ContextModalProps<{ onSelect: (atomic: Atomic, testIndex: number) => void }>;
  yamlImport: ContextModalProps<{ onImport: (chain: ChainCreatePayload) => void }>;
  sessionSelector: ContextModalProps<{ chainId: string; onSelected: (executionId: string) => void }>;
}
