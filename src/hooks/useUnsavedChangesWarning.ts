import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { store } from '@/store';
import { openConfirmModal } from '@/components/ConfirmModal';

export function useUnsavedChangesWarning() {
  const isDirty = useAppSelector((s) => s.editor.isDirty);

  // Browser tab close / refresh
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // React Router navigation.
  // Read isDirty directly from the store (not the stale closure) so that a
  // dispatch(markClean/initEditor) followed immediately by navigate() doesn't
  // race: the store is updated synchronously by RTK, but the component hasn't
  // re-rendered yet, so the closure value would still be the old `true`.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      store.getState().editor.isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== 'blocked') return;

    openConfirmModal({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
      confirmLabel: 'Leave',
      onConfirm: () => blocker.proceed(),
      onCancel: () => blocker.reset(),
      danger: true,
    });
  }, [blocker]);
}
