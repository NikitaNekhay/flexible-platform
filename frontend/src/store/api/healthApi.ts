import { baseApi } from './baseApi';
import type { HealthResponse } from '@/types';

export const healthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHealth: builder.query<HealthResponse, void>({
      query: () => ({ url: '/health', method: 'GET' }),
      providesTags: ['Health'],
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;
