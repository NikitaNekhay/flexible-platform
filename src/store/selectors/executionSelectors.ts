import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

const selectStepsStatus = (state: RootState) => state.execution.stepsStatus;

export const selectStepsArray = createSelector(
  selectStepsStatus,
  (stepsStatus) => Object.values(stepsStatus),
);

export const selectStepCount = createSelector(
  selectStepsStatus,
  (stepsStatus) => Object.keys(stepsStatus).length,
);

export const selectProgress = createSelector(
  selectStepsArray,
  (steps) => {
    const total = steps.length;
    if (total === 0) return { done: 0, failed: 0, total: 0, percent: 0 };
    const done = steps.filter((s) => s.status === 'done' || s.status === 'skipped').length;
    const failed = steps.filter((s) => s.status === 'failed').length;
    const completed = done + failed;
    return { done, failed, total, percent: Math.round((completed / total) * 100) };
  },
);
