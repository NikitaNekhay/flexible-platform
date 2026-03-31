import { useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { chainToYAML, yamlToChain } from '@/utils/yamlUtils';
import type { ChainCreatePayload } from '@/types';

export function useYAML() {
  const chainName = useAppSelector((s) => s.editor.chainName);
  const chainDescription = useAppSelector((s) => s.editor.chainDescription);
  const chainTags = useAppSelector((s) => s.editor.chainTags);
  const chainMitreTactics = useAppSelector((s) => s.editor.chainMitreTactics);
  const steps = useAppSelector((s) => s.editor.steps);

  const exportYAML = useCallback((): string => {
    return chainToYAML({
      name: chainName,
      description: chainDescription,
      tags: chainTags,
      mitre_tactics: chainMitreTactics,
      steps,
    });
  }, [chainName, chainDescription, chainTags, chainMitreTactics, steps]);

  const importYAML = useCallback(
    (yamlString: string): ChainCreatePayload => {
      return yamlToChain(yamlString);
    },
    [],
  );

  const downloadYAML = useCallback(() => {
    const yamlStr = exportYAML();
    const blob = new Blob([yamlStr], { type: 'application/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chainName || 'scenario'}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportYAML, chainName]);

  return { exportYAML, importYAML, downloadYAML };
}
