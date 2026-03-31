import { baseApi } from './baseApi';
import type {
  Chain,
  ChainCreatePayload,
  ChainUpdatePayload,
  ExecuteChainRequest,
  ExecuteChainResponse,
} from '@/types';

export const chainsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChains: builder.query<Chain[], void>({
      query: () => ({ url: '/chains', method: 'GET' }),
      providesTags: ['Chain'],
    }),
    getChain: builder.query<Chain, string>({
      query: (id) => ({ url: `/chains/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Chain', id }],
    }),
    createChain: builder.mutation<Chain, ChainCreatePayload>({
      query: (data) => ({ url: '/chains', method: 'POST', data }),
      invalidatesTags: ['Chain'],
    }),
    updateChain: builder.mutation<Chain, { id: string; body: ChainUpdatePayload }>({
      query: ({ id, body }) => ({ url: `/chains/${id}`, method: 'PUT', data: body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Chain', id }, 'Chain'],
    }),
    deleteChain: builder.mutation<void, string>({
      query: (id) => ({ url: `/chains/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Chain'],
    }),
    executeChain: builder.mutation<
      ExecuteChainResponse,
      { id: string; body: ExecuteChainRequest }
    >({
      query: ({ id, body }) => ({
        url: `/chains/${id}/execute`,
        method: 'POST',
        data: body,
      }),
    }),
  }),
});

export const {
  useGetChainsQuery,
  useGetChainQuery,
  useCreateChainMutation,
  useUpdateChainMutation,
  useDeleteChainMutation,
  useExecuteChainMutation,
} = chainsApi;
