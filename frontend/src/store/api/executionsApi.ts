import { baseApi } from './baseApi';
import type { Execution } from '@/types';

// Backend returns PascalCase fields for execution list
interface ExecutionListItem {
  ID: string;
  ChainID: string;
  SessionID: string;
  Status: string;
  Error?: string;
  StartedAt: string;
  FinishedAt?: string;
}

// Backend returns nested structure for execution detail
interface ExecutionDetailResponse {
  execution: ExecutionListItem;
  steps: Array<{
    ExecutionID: string;
    StepID: string;
    Status: string;
    Stdout: string;
    Stderr: string;
    ExitCode: number;
    Error: string;
    DurationMs: number;
  }>;
}

function normalizeExecution(raw: ExecutionListItem): Execution {
  return {
    id: raw.ID,
    chain_id: raw.ChainID,
    session_id: raw.SessionID,
    status: raw.Status as Execution['status'],
    started_at: raw.StartedAt,
    finished_at: raw.FinishedAt,
    error: raw.Error,
    steps: [],
  };
}

function normalizeExecutionDetail(raw: ExecutionDetailResponse): Execution {
  return {
    ...normalizeExecution(raw.execution),
    steps: (raw.steps ?? []).map((s) => ({
      step_id: s.StepID,
      step_name: s.StepID,
      status: s.Status as any,
      exit_code: s.ExitCode,
      duration_ms: s.DurationMs,
      stdout: s.Stdout,
      stderr: s.Stderr,
      error: s.Error,
      logs: [
        ...(s.Stdout ? [s.Stdout] : []),
        ...(s.Stderr ? [`[stderr] ${s.Stderr}`] : []),
        ...(s.Error ? [`[error] ${s.Error}`] : []),
      ],
    })),
  };
}

export const executionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExecutions: builder.query<Execution[], string | undefined>({
      query: (chainId) => ({
        url: chainId ? `/executions?chain_id=${chainId}` : '/executions',
        method: 'GET',
      }),
      transformResponse: (response: ExecutionListItem[]) =>
        (response ?? []).map(normalizeExecution),
      providesTags: ['Execution'],
    }),
    getExecution: builder.query<Execution, string>({
      query: (id) => ({ url: `/executions/${id}`, method: 'GET' }),
      transformResponse: (response: ExecutionDetailResponse) =>
        normalizeExecutionDetail(response),
      providesTags: (_r, _e, id) => [{ type: 'Execution', id }],
    }),
    cancelExecution: builder.mutation<void, string>({
      query: (id) => ({ url: `/executions/${id}/cancel`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Execution', id }],
    }),
  }),
});

export const {
  useGetExecutionsQuery,
  useGetExecutionQuery,
  useCancelExecutionMutation,
} = executionsApi;
