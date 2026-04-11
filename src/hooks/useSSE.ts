import { useEffect } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { sseEventReceived, setStreamStatus } from '@/store/slices/executionSlice';
import { sseService } from '@/services/sseService';

export function useSSE(executionId: string | null): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!executionId) return;

    sseService.connect(
      executionId,
      (event) => dispatch(sseEventReceived(event)),
      (status) => dispatch(setStreamStatus(status)),
    );

    return () => {
      sseService.disconnect();
    };
  }, [executionId, dispatch]);
}
