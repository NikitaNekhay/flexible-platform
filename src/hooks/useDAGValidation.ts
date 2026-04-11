import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setValidation } from '@/store/slices/editorSlice';
import { validateDAG } from '@/utils/dagUtils';

export function useDAGValidation(): void {
  const dispatch = useAppDispatch();
  const steps = useAppSelector((state) => state.editor.steps);

  useEffect(() => {
    const result = validateDAG(steps);
    dispatch(setValidation(result));
  }, [steps, dispatch]);
}
