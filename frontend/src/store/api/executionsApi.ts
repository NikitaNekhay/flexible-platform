import { baseApi } from './baseApi';
import type { Execution } from '@/types';

export const executionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExecution: builder.query<Execution, string>({
      query: (id) => ({ url: `/executions/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Execution', id }],
    }),
    cancelExecution: builder.mutation<void, string>({
      query: (id) => ({ url: `/executions/${id}/cancel`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Execution', id }],
    }),
  }),
});

export const { useGetExecutionQuery, useCancelExecutionMutation } = executionsApi;
