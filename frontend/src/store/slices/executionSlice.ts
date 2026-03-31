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
          if (!state.stepsStatus[event.step_id]) {
            state.stepsStatus[event.step_id] = {
              step_id: event.step_id,
              step_name: event.step_name,
              status: 'running',
              started_at: event.timestamp,
              logs: [],
            };
          } else {
            state.stepsStatus[event.step_id].status = 'running';
            state.stepsStatus[event.step_id].started_at = event.timestamp;
          }
          break;
        }
        case 'step_done': {
          const step = state.stepsStatus[event.step_id];
          if (step) {
            step.status = 'done';
            step.exit_code = event.exit_code;
            step.duration_ms = event.duration_ms;
            step.finished_at = event.timestamp;
          }
          break;
        }
        case 'step_failed': {
          const step = state.stepsStatus[event.step_id];
          if (step) {
            step.status = 'failed';
            step.exit_code = event.exit_code;
            step.duration_ms = event.duration_ms;
            step.finished_at = event.timestamp;
          }
          break;
        }
        case 'step_log': {
          const step = state.stepsStatus[event.step_id];
          if (step) {
            step.logs.push(event.line);
          } else {
            // Step log arrived before step_start (shouldn't happen, but handle gracefully)
            state.stepsStatus[event.step_id] = {
              step_id: event.step_id,
              step_name: event.step_id,
              status: 'running',
              logs: [event.line],
            };
          }
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
