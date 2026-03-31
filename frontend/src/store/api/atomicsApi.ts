import { baseApi } from './baseApi';
import type { Atomic } from '@/types';

export const atomicsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAtomics: builder.query<Atomic[], void>({
      query: () => ({ url: '/atomics', method: 'GET' }),
      providesTags: ['Atomic'],
    }),
    getAtomic: builder.query<Atomic, string>({
      query: (id) => ({ url: `/atomics/${id}`, method: 'GET' }),
      providesTags: (_r, _e, id) => [{ type: 'Atomic', id }],
    }),
  }),
});

export const { useGetAtomicsQuery, useGetAtomicQuery } = atomicsApi;
