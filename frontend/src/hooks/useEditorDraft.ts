import { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { initEditor } from '@/store/slices/editorSlice';
import { notifications } from '@mantine/notifications';

const DRAFT_KEY_PREFIX = 'editor_draft_';

interface DraftData {
  chainId: string | null;
  name: string;
  description: string;
  tags: string[];
  mitreTactics: string[];
  steps: unknown[];
  savedAt: number;
}

function getDraftKey(chainId: string | null): string {
  return `${DRAFT_KEY_PREFIX}${chainId ?? 'new'}`;
}

export function useEditorDraft(chainId: string | undefined) {
  const dispatch = useAppDispatch();
  const isDirty = useAppSelector((s) => s.editor.isDirty);
  const chainName = useAppSelector((s) => s.editor.chainName);
  const chainDescription = useAppSelector((s) => s.editor.chainDescription);
  const chainTags = useAppSelector((s) => s.editor.chainTags);
  const chainMitreTactics = useAppSelector((s) => s.editor.chainMitreTactics);
  const steps = useAppSelector((s) => s.editor.steps);
  const restoredRef = useRef(false);
  const isDirtyRef = useRef(isDirty);

  // Try to restore draft on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const key = getDraftKey(chainId ?? null);
    const raw = sessionStorage.getItem(key);
    if (!raw) return;

    try {
      const draft: DraftData = JSON.parse(raw);
      // Only restore if draft is less than 1 hour old
      if (Date.now() - draft.savedAt > 3600000) {
        sessionStorage.removeItem(key);
        return;
      }

      notifications.show({
        id: 'draft-restore',
        title: 'Draft Found',
        message: `Unsaved changes from ${new Date(draft.savedAt).toLocaleTimeString()} were restored.`,
        color: 'blue',
        autoClose: 5000,
      });

      dispatch(
        initEditor({
          chainId: draft.chainId,
          name: draft.name,
          description: draft.description,
          tags: draft.tags,
          mitreTactics: draft.mitreTactics,
          steps: draft.steps as any,
        }),
      );
    } catch {
      sessionStorage.removeItem(key);
    }
  }, [chainId, dispatch]);

  // Keep ref in sync
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  // Save draft when dirty
  useEffect(() => {
    if (!isDirty) return;

    const key = getDraftKey(chainId ?? null);
    const draft: DraftData = {
      chainId: chainId ?? null,
      name: chainName,
      description: chainDescription,
      tags: chainTags,
      mitreTactics: chainMitreTactics,
      steps,
      savedAt: Date.now(),
    };

    sessionStorage.setItem(key, JSON.stringify(draft));
  }, [isDirty, chainId, chainName, chainDescription, chainTags, chainMitreTactics, steps]);

  // Clear draft on clean unmount (user saved or navigated away normally)
  useEffect(() => {
    return () => {
      if (!isDirtyRef.current) {
        sessionStorage.removeItem(getDraftKey(chainId ?? null));
      }
    };
  }, [chainId]);
}
