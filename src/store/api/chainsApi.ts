import { baseApi } from './baseApi';
import type {
  Chain,
  ChainCreatePayload,
  ChainUpdatePayload,
  ExecuteChainRequest,
  ExecuteChainResponse,
} from '@/types';

function normalizeChain(raw: Chain): Chain {
  return {
    ...raw,
    tags: raw.tags ?? [],
    mitre_tactics: raw.mitre_tactics ?? [],
    steps: (raw.steps ?? []).map((s) => ({
      ...s,
      depends_on: s.depends_on ?? [],
      conditions: s.conditions ?? [],
      output_var: s.output_var ?? '',
    })),
  };
}

export const chainsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getChains: builder.query<Chain[], void>({
      query: () => ({ url: '/chains', method: 'GET' }),
      transformResponse: (response: Chain[]) =>
        (response ?? []).map(normalizeChain),
      providesTags: ['Chain'],
    }),
    getChain: builder.query<Chain, string>({
      query: (id) => ({ url: `/chains/${id}`, method: 'GET' }),
      transformResponse: (response: Chain) => normalizeChain(response),
      providesTags: (_r, _e, id) => [{ type: 'Chain', id }],
    }),
    createChain: builder.mutation<Chain, ChainCreatePayload>({
      query: (data) => ({ url: '/chains', method: 'POST', data }),
      transformResponse: (response: Chain) => normalizeChain(response),
      invalidatesTags: ['Chain'],
    }),
    updateChain: builder.mutation<Chain, { id: string; body: ChainUpdatePayload }>({
      query: ({ id, body }) => ({ url: `/chains/${id}`, method: 'PUT', data: body }),
      transformResponse: (response: Chain) => normalizeChain(response),
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
      invalidatesTags: ['Execution'],
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
