import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ExecutionStatusValue,
  StreamStatusValue,
  StepExecutionStatus,
  SSEEvent,
} from '@/types';

interface ExecutionState {
  executionId: string | null;
  chainId: string | null;
  status: ExecutionStatusValue;
  streamStatus: StreamStatusValue;
  stepsStatus: Record<string, StepExecutionStatus>;
  selectedStepId: string | null;
}

const initialState: ExecutionState = {
  executionId: null,
  chainId: null,
  status: 'pending',
  streamStatus: 'idle',
  stepsStatus: {},
  selectedStepId: null,
};

function ensureStep(state: ExecutionState, stepId: string): StepExecutionStatus {
  if (!state.stepsStatus[stepId]) {
    state.stepsStatus[stepId] = {
      step_id: stepId,
      step_name: stepId,
      status: 'pending',
      logs: [],
    };
  }
  return state.stepsStatus[stepId];
}

const executionSlice = createSlice({
  name: 'execution',
  initialState,
  reducers: {
    setExecutionId(
      state,
      action: PayloadAction<{ executionId: string; chainId?: string }>,
    ) {
      state.executionId = action.payload.executionId;
      state.chainId = action.payload.chainId ?? null;
      state.status = 'running';
      state.streamStatus = 'idle';
      state.stepsStatus = {};
      state.selectedStepId = null;
    },
    resetExecution() {
      return initialState;
    },
    setStreamStatus(state, action: PayloadAction<StreamStatusValue>) {
      state.streamStatus = action.payload;
    },
    selectStep(state, action: PayloadAction<string | null>) {
      state.selectedStepId = action.payload;
    },
    initStepsFromChain(
      state,
      action: PayloadAction<Array<{ step_id: string; step_name: string }>>,
    ) {
      for (const s of action.payload) {
        if (!state.stepsStatus[s.step_id]) {
          state.stepsStatus[s.step_id] = {
            step_id: s.step_id,
            step_name: s.step_name,
            status: 'pending',
            logs: [],
          };
        }
      }
    },
    sseEventReceived(state, action: PayloadAction<SSEEvent>) {
      const event = action.payload;

      switch (event.event) {
        case 'step_start': {
          state.status = 'running';
          const step = ensureStep(state, event.step_id);
          step.status = 'running';
          step.started_at = event.timestamp;
          if (event.step_name) step.step_name = event.step_name;
          break;
        }
        case 'step_done': {
          const step = ensureStep(state, event.step_id);
          step.status = 'done';
          step.exit_code = event.exit_code;
          step.duration_ms = event.duration_ms;
          step.finished_at = event.timestamp;
          if (event.stdout) step.logs.push(event.stdout);
          if (event.stderr) step.logs.push(`[stderr] ${event.stderr}`);
          break;
        }
        case 'step_failed': {
          const step = ensureStep(state, event.step_id);
          step.status = 'failed';
          step.exit_code = event.exit_code;
          step.duration_ms = event.duration_ms;
          step.finished_at = event.timestamp;
          if (event.stdout) step.logs.push(event.stdout);
          if (event.stderr) step.logs.push(`[stderr] ${event.stderr}`);
          if (event.error) step.logs.push(`[error] ${event.error}`);
          break;
        }
        case 'step_skipped': {
          const step = ensureStep(state, event.step_id);
          step.status = 'skipped';
          if (event.message) step.logs.push(`[skipped] ${event.message}`);
          break;
        }
        case 'step_log': {
          // Replay event — contains the full stored step result.
          // REPLACE logs (not append): this event is called by both the REST seed and the SSE
          // replay-on-connect; appending would duplicate every log line on each reconnect.
          const step = ensureStep(state, event.step_id);
          step.status = (event.status as StepExecutionStatus['status']) ?? step.status;
          step.exit_code = event.exit_code;
          step.duration_ms = event.duration_ms;
          step.logs = [];
          if (event.stdout) step.logs.push(event.stdout);
          if (event.stderr) step.logs.push(`[stderr] ${event.stderr}`);
          if (event.error) step.logs.push(`[error] ${event.error}`);
          break;
        }
        case 'chain_done': {
          state.status = 'done';
          break;
        }
        case 'chain_failed': {
          state.status = 'failed';
          break;
        }
        case 'done': {
          // Stream close signal — set final status if not already set
          if (state.status === 'running' || state.status === 'pending') {
            state.status = event.status === 'failed' ? 'failed' : 'done';
          }
          state.streamStatus = 'idle';
          break;
        }
      }
    },
  },
});

export const {
  setExecutionId,
  resetExecution,
  setStreamStatus,
  selectStep,
  initStepsFromChain,
  sseEventReceived,
} = executionSlice.actions;
export default executionSlice.reducer;
