import { describe, it, expect } from 'vitest';
import reducer, {
  setExecutionId,
  resetExecution,
  setStreamStatus,
  selectStep,
  initStepsFromChain,
  sseEventReceived,
} from './executionSlice';

function initialState() {
  return reducer(undefined, { type: '@@INIT' });
}

describe('executionSlice', () => {
  it('has correct initial state', () => {
    const state = initialState();
    expect(state.executionId).toBeNull();
    expect(state.chainId).toBeNull();
    expect(state.status).toBe('pending');
    expect(state.streamStatus).toBe('idle');
    expect(state.stepsStatus).toEqual({});
    expect(state.selectedStepId).toBeNull();
  });

  it('setExecutionId resets state and sets running', () => {
    const state = reducer(initialState(), setExecutionId({ executionId: 'exec-1', chainId: 'chain-1' }));
    expect(state.executionId).toBe('exec-1');
    expect(state.chainId).toBe('chain-1');
    expect(state.status).toBe('running');
    expect(state.stepsStatus).toEqual({});
  });

  it('resetExecution returns to initial', () => {
    let state = reducer(initialState(), setExecutionId({ executionId: 'exec-1' }));
    state = reducer(state, resetExecution());
    expect(state.executionId).toBeNull();
    expect(state.status).toBe('pending');
  });

  it('setStreamStatus updates stream status', () => {
    const state = reducer(initialState(), setStreamStatus('connected'));
    expect(state.streamStatus).toBe('connected');
  });

  it('selectStep sets selectedStepId', () => {
    const state = reducer(initialState(), selectStep('step-1'));
    expect(state.selectedStepId).toBe('step-1');
  });

  it('initStepsFromChain adds pending steps', () => {
    const state = reducer(
      initialState(),
      initStepsFromChain([
        { step_id: 'a', step_name: 'Step A' },
        { step_id: 'b', step_name: 'Step B' },
      ]),
    );
    expect(Object.keys(state.stepsStatus)).toEqual(['a', 'b']);
    expect(state.stepsStatus['a'].status).toBe('pending');
    expect(state.stepsStatus['a'].step_name).toBe('Step A');
    expect(state.stepsStatus['b'].logs).toEqual([]);
  });

  describe('sseEventReceived', () => {
    it('step_start sets step to running', () => {
      const state = reducer(
        initialState(),
        sseEventReceived({
          event: 'step_start',
          step_id: 's1',
          step_name: 'My Step',
          timestamp: '2024-01-01T00:00:00Z',
        }),
      );
      expect(state.stepsStatus['s1'].status).toBe('running');
      expect(state.stepsStatus['s1'].step_name).toBe('My Step');
      expect(state.stepsStatus['s1'].started_at).toBe('2024-01-01T00:00:00Z');
      expect(state.status).toBe('running');
    });

    it('step_done sets step to done with metadata', () => {
      let state = reducer(
        initialState(),
        sseEventReceived({ event: 'step_start', step_id: 's1', timestamp: '' }),
      );
      state = reducer(
        state,
        sseEventReceived({
          event: 'step_done',
          step_id: 's1',
          exit_code: 0,
          duration_ms: 150,
          timestamp: '2024-01-01T00:00:01Z',
          stdout: 'hello world',
          stderr: 'warn',
        }),
      );
      expect(state.stepsStatus['s1'].status).toBe('done');
      expect(state.stepsStatus['s1'].exit_code).toBe(0);
      expect(state.stepsStatus['s1'].duration_ms).toBe(150);
      expect(state.stepsStatus['s1'].logs).toContain('hello world');
      expect(state.stepsStatus['s1'].logs).toContain('[stderr] warn');
    });

    it('step_failed sets step to failed with error', () => {
      const state = reducer(
        initialState(),
        sseEventReceived({
          event: 'step_failed',
          step_id: 's1',
          exit_code: 1,
          duration_ms: 50,
          timestamp: '',
          error: 'command not found',
        }),
      );
      expect(state.stepsStatus['s1'].status).toBe('failed');
      expect(state.stepsStatus['s1'].logs).toContain('[error] command not found');
    });

    it('step_skipped sets step to skipped', () => {
      const state = reducer(
        initialState(),
        sseEventReceived({
          event: 'step_skipped',
          step_id: 's1',
          message: 'dependency failed',
        }),
      );
      expect(state.stepsStatus['s1'].status).toBe('skipped');
      expect(state.stepsStatus['s1'].logs).toContain('[skipped] dependency failed');
    });

    it('step_log replays stored results', () => {
      const state = reducer(
        initialState(),
        sseEventReceived({
          event: 'step_log',
          step_id: 's1',
          status: 'done',
          exit_code: 0,
          duration_ms: 100,
          stdout: 'output',
          stderr: '',
          error: '',
        }),
      );
      expect(state.stepsStatus['s1'].status).toBe('done');
      expect(state.stepsStatus['s1'].logs).toContain('output');
    });

    it('chain_done sets execution status to done', () => {
      let state = reducer(initialState(), setExecutionId({ executionId: 'e1' }));
      state = reducer(state, sseEventReceived({ event: 'chain_done' }));
      expect(state.status).toBe('done');
    });

    it('chain_failed sets execution status to failed', () => {
      let state = reducer(initialState(), setExecutionId({ executionId: 'e1' }));
      state = reducer(state, sseEventReceived({ event: 'chain_failed' }));
      expect(state.status).toBe('failed');
    });

    it('done event finalizes stream', () => {
      let state = reducer(initialState(), setExecutionId({ executionId: 'e1' }));
      state = reducer(state, sseEventReceived({ event: 'done', status: 'done' }));
      expect(state.status).toBe('done');
      expect(state.streamStatus).toBe('idle');
    });

    it('done event with failed status', () => {
      let state = reducer(initialState(), setExecutionId({ executionId: 'e1' }));
      state = reducer(state, sseEventReceived({ event: 'done', status: 'failed' }));
      expect(state.status).toBe('failed');
    });

    it('done event does not override already-finished status', () => {
      let state = reducer(initialState(), setExecutionId({ executionId: 'e1' }));
      state = reducer(state, sseEventReceived({ event: 'chain_done' }));
      expect(state.status).toBe('done');
      // done event arrives after chain_done — should not change status
      state = reducer(state, sseEventReceived({ event: 'done', status: 'failed' }));
      expect(state.status).toBe('done');
    });

    it('creates step on the fly if not pre-initialized', () => {
      const state = reducer(
        initialState(),
        sseEventReceived({ event: 'step_start', step_id: 'new-step', timestamp: '' }),
      );
      expect(state.stepsStatus['new-step']).toBeDefined();
      expect(state.stepsStatus['new-step'].status).toBe('running');
    });
  });
});
