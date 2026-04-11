import { useAppSelector } from '@/store/hooks';

export function usePermissions() {
  const role = useAppSelector((s) => s.auth.role);

  return {
    role,
    isMentor: role === 'mentor',
    isViewer: role === 'viewer',
    canCreate: role === 'mentor',
    canEdit: role === 'mentor',
    canDelete: role === 'mentor',
    canExecute: role === 'mentor',
    canUpload: role === 'mentor',
  };
}
