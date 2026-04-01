import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
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

  // React Router navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
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
